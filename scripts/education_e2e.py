"""Role-based HTTP acceptance test. Run only against the disposable E2E instance on port 8092.

Create a separate PostgreSQL database and enable the local demo seed before running.
The script creates new records, never modifies an existing course, and prints no tokens.
"""
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE = "http://localhost:8092/api/v1"
OUT = Path("tmp/e2e-20260908")
OUT.mkdir(parents=True, exist_ok=True)
checks = []

def api(role, method, path, body=None, expected=None):
    headers = {"Content-Type": "application/json"}
    if role:
        headers["Authorization"] = "Bearer " + tokens[role]
    request = Request(BASE + path, json.dumps(body).encode() if body is not None else None, headers, method=method)
    try:
        with urlopen(request, timeout=30) as response:
            raw = response.read()
            code = response.status
    except HTTPError as error:
        raw = error.read()
        code = error.code
        if expected is None or code not in expected:
            raise AssertionError(f"{role} {method} {path}: HTTP {code}: {raw.decode()}") from None
    if expected is not None:
        assert code in expected, f"{path}: expected {expected}, got {code}"
        return code
    if not raw:
        return None
    value = json.loads(raw)
    return value["data"] if isinstance(value, dict) and "data" in value and "success" in value else value

def check(name, condition=True):
    assert condition, name
    checks.append(name)
    print("PASS " + name, flush=True)

def instant(offset=0):
    return (datetime.now(timezone.utc) + timedelta(seconds=offset)).isoformat()

tokens = {}
for role, password in [("teacher", "Physics#Teach2026"), ("student", "Physics#Study2026"), ("admin", "Physics#Staff2026")]:
    result = api(None, "POST", "/auth/login", {"username": "demo_" + role, "password": os.getenv("E2E_" + role.upper() + "_PASSWORD", password)})
    tokens[role] = result["accessToken"]
    check(role + " login")

student = api("student", "GET", "/students/me")
owned = api("teacher", "GET", "/courses/owned")
subject = next(row["subjectId"] for row in owned if row.get("subjectId"))
title = "E2E Fizika " + datetime.now().strftime("%Y%m%d-%H%M%S")
course = api("teacher", "POST", "/courses", {"title": title, "subjectId": subject, "description": "O‘qituvchi va talaba uchun to‘liq sinov kursi"})
cid = course["id"]
check("teacher creates an owned draft course", course["status"].upper() == "DRAFT")
api("student", "POST", "/courses", {"title": "Forbidden"}, expected=[403])
check("student cannot create a teacher course")
api("teacher", "PATCH", f"/courses/{cid}/status", {"status": "PUBLISHED"})
enrollments = api("teacher", "POST", f"/courses/{cid}/enrollments", {"studentIds": [int(student["id"])], "academicYear": "2026-2027", "semester": 1, "credits": 6})
enrollment = next(row for row in enrollments if str(row["studentId"]) == str(student["id"]))
eid = enrollment["id"]
check("student sees published enrolled course", any(str(row["id"]) == str(cid) for row in api("student", "GET", "/students/me/courses")))
module = api("teacher", "POST", f"/courses/{cid}/modules", {"title": "Mexanika asoslari"})
mid = module["id"]
api("teacher", "PATCH", f"/courses/{cid}/modules/{mid}/status", {"status": "PUBLISHED"})
lesson = api("teacher", "POST", f"/courses/{cid}/modules/{mid}/contents", {
    "title": "Nyutonning ikkinchi qonuni", "contentType": "TEXT", "contentBody": "<p>Kuch massa va tezlanish ko‘paytmasiga teng: F = m × a.</p>",
    "languageCode": "uz", "authorName": "E2E o‘qituvchi", "contentVersion": "1.0", "sourceName": "E2E mustaqil dars", "validFrom": datetime.now().date().isoformat(),
})
lid = lesson["id"]
api("teacher", "PATCH", f"/courses/{cid}/contents/{lid}/status", {"status": "PUBLISHED"}, expected=[400])
check("unreviewed lesson cannot be published")
review = api("teacher", "POST", f"/courses/{cid}/contents/{lid}/submit-review")
api("admin", "POST", f"/content-reviews/{review['id']}/decision", {"decision": "APPROVED", "comment": "Sinov darsi mazmuni tekshirildi"})
api("teacher", "PATCH", f"/courses/{cid}/contents/{lid}/status", {"status": "PUBLISHED"})
lessons = api("student", "GET", f"/courses/{cid}/contents")
check("student receives reviewed lesson body", any(row["id"] == lid and "F = m" in row["contentBody"] for row in lessons))
api("student", "POST", f"/students/me/courses/{cid}/contents/{lid}/progress", {"progress": 100})
check("student can complete the lesson")

session = api("teacher", "POST", "/teachers/me/sessions", {"courseId": cid, "title": "Mustaqil mashg‘ulot", "format": "ASYNCHRONOUS", "startsAt": instant(-3600), "endsAt": instant(86400), "resourceUrl": "https://example.org/e2e-resource", "status": "PUBLISHED"})
api("student", "POST", f"/learning-sessions/{session['id']}/access", {"type": "RESOURCE_OPEN"})
check("student can open a published asynchronous session")

assignment = api("teacher", "POST", "/teachers/me/assignments", {"courseId": cid, "title": "Kuchni hisoblang", "instructions": "m=2 kg, a=3 m/s². Kuchni toping.", "dueDate": instant(86400), "submissionType": "TEXT", "maxScore": 100, "status": "PUBLISHED"})
aid = assignment["id"]
submission = api("student", "POST", f"/assignments/{aid}/submit", {"answer": "F = m × a = 2 × 3 = 6 N."})
sid = submission["id"]
check("teacher receives the student submission", any(row["id"] == sid for row in api("teacher", "GET", f"/teachers/me/submissions?assignmentId={aid}")))
api("student", "POST", f"/teachers/me/submissions/{sid}/grade", {"score": 100}, expected=[403])
check("student cannot grade their own submission")
api("teacher", "POST", f"/teachers/me/submissions/{sid}/grade", {"score": 85, "feedback": "Hisoblash to‘g‘ri; birliklarni izohlang."})
assignment_view = api("student", "GET", f"/assignments/{aid}")
check("student receives 85 points and teacher feedback", assignment_view["grade"] == 85 and "birliklarni" in assignment_view["feedback"])

question = api("teacher", "POST", "/teachers/me/questions", {"courseId": cid, "text": "2 kg × 3 m/s² = ?", "type": "SINGLE_CHOICE", "points": 10, "options": ["6 N", "5 N", "1 N"], "correctAnswer": "6 N"})
quiz = api("teacher", "POST", "/teachers/me/tests", {"courseId": cid, "title": "Mexanika nazorati", "opensAt": instant(-60), "closesAt": instant(3600), "durationMinutes": 15, "proctoring": False, "questionIds": [int(question["id"])], "status": "PUBLISHED"})
qid = quiz["id"]
api("student", "POST", f"/tests/{qid}/start")
quiz_result = api("student", "POST", f"/tests/{qid}/submit", {"answers": [{"questionId": question["id"], "answer": "6 N"}]})
check("quiz scores the student answer at 100 percent", quiz_result["percentage"] == 100)

exam = api("teacher", "POST", "/teachers/me/exams", {"courseId": cid, "title": "E2E yakuniy nazorat", "examDate": datetime.now().date().isoformat(), "examTime": "10:00:00", "location": "E2E 101-xona", "examType": "WRITTEN"})
xid = exam["id"]
api("teacher", "POST", f"/teachers/me/exams/{xid}/publish")
api("teacher", "POST", f"/teachers/me/exams/{xid}/start")
api("teacher", "POST", f"/teachers/me/exams/{xid}/complete", expected=[400])
check("exam cannot close with unresolved attendance")
api("teacher", "PUT", f"/teachers/me/exams/{xid}/attendance/{eid}", {"attendanceStatus": "PRESENT"})
api("teacher", "POST", f"/teachers/me/exams/{xid}/complete", expected=[400])
check("exam cannot close with missing grade")
api("teacher", "PUT", f"/teachers/me/exams/{xid}/results/{eid}", {"enrollmentId": eid, "score": 80, "totalScore": 100})
check("unfinished exam is hidden from student results", not any(str(row["examId"]) == str(xid) for row in api("student", "GET", "/students/me/exams/results")))
statement = api("admin", "GET", f"/academic-results/statements/{xid}")
check("statement is complete and ready for approval", len(statement["students"]) == 1 and not statement["completionProblems"])
api("admin", "POST", f"/academic-results/statements/{xid}/complete")
api("teacher", "PUT", f"/teachers/me/exams/{xid}/results/{eid}", {"enrollmentId": eid, "score": 99, "totalScore": 100}, expected=[400])
check("closed exam rejects ordinary score edits")
exam_result = next(row for row in api("student", "GET", "/students/me/exams/results") if str(row["examId"]) == str(xid))
check("student receives published final exam score", exam_result["score"] == 80)
transcript = api("student", "GET", "/students/me/transcript")
transcript_course = next(row for term in transcript["semesters"] for row in term["courses"] if str(row["courseId"]) == str(cid))
check("transcript calculates 100 interim plus 80 final as 90", transcript_course["score"] == 90)
registry = next(row for row in api("admin", "GET", "/academic-results/student-results") if row["enrollmentId"] == eid)
check("academic registry agrees with student transcript", registry["totalScore"] == 90 and registry["passed"])

report = {"courseId": cid, "title": title, "lessonId": lid, "assignmentId": aid, "submissionId": sid, "quizId": qid, "examId": xid, "checks": checks, "assignmentScore": 85, "quizPercentage": 100, "examScore": 80, "transcriptScore": 90}
(OUT / "result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Completed {len(checks)} checks; report: {OUT / 'result.json'}", flush=True)
