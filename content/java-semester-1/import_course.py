"""Import the package through normal authenticated APIs; create missing drafts only.

Credentials are read from environment or an interactive prompt, never saved.
Matching objects are reused without overwriting manual edits. Run once at a time.
"""
import argparse
from datetime import date, datetime, time, timedelta, timezone
import getpass
import hashlib
import json
import os
from pathlib import Path
import sys
import requests

ROOT = Path(__file__).resolve().parent

class API:
    def __init__(self, base, username, password):
        self.base=base.rstrip('/');self.session=requests.Session();self.created=0
        data=self.call('POST','/auth/login',json={'username':username,'password':password},count=False)
        self.session.headers['Authorization']='Bearer '+data['accessToken']

    def call(self, method, path, count=True, **kwargs):
        response=self.session.request(method,self.base+path,timeout=60,**kwargs)
        if not response.ok:
            # Login error body may contain auth details; do not print it.
            detail='' if path.startswith('/auth/') else response.text[:600]
            raise RuntimeError(f'{method} {path}: HTTP {response.status_code} {detail}')
        data=response.json() if response.content else None
        if isinstance(data,dict) and 'success' in data:
            if not data['success']:raise RuntimeError(f'{method} {path}: operation failed')
            data=data['data']
        if method=='POST' and count:self.created+=1
        return data

def unique(values, key, expected):
    matches=[x for x in values if x.get(key)==expected]
    if len(matches)>1:raise RuntimeError(f'Ambiguous existing {key}: {expected}')
    return matches[0] if matches else None

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url',default='http://127.0.0.1:8081/api/v1')
    parser.add_argument('--username',default=os.getenv('LMS_TEACHER_USERNAME','demo_teacher'))
    parser.add_argument('--admin-username',default=os.getenv('LMS_ADMIN_USERNAME'))
    parser.add_argument('--start-date',default='2026-09-14',help='Proposed semester date; draft deadlines use Asia/Tashkent UTC+05.')
    parser.add_argument('--report',default=str(ROOT/'local-import-report.json'))
    args=parser.parse_args()
    package=json.loads((ROOT/'course.json').read_text(encoding='utf-8'))
    start=date.fromisoformat(args.start_date)
    password=os.getenv('LMS_TEACHER_PASSWORD') or getpass.getpass('Teacher password: ')
    api=API(args.base_url,args.username,password)
    subjects=api.call('GET','/subjects')
    subject=unique([s for s in subjects if s.get('programName')==package['programName']], 'name', package['subjectName'])
    if not subject:raise RuntimeError('The Software Engineering subject must exist and be assigned to this teacher.')
    courses=api.call('GET','/courses/owned')
    course=unique(courses,'title',package['title'])
    if course:
        if course['subjectId']!=subject['id']:raise RuntimeError('Existing course belongs to a different subject.')
        if course['status'].lower()!='draft':raise RuntimeError('Import only supports a draft course.')
        if course.get('startDate')!=start.isoformat():raise RuntimeError('Existing course has a different start date; no automatic rescheduling.')
    else:
        course=api.call('POST','/courses',json=dict(title=package['title'],subjectId=subject['id'],shortDescription='Dasturiy injinering: 15 haftada Java, OOP, kolleksiyalar, fayllar va yakuniy loyiha.',description=package['syllabusHtml'],language='uz',level='BEGINNER',paid=False,discountEnabled=False,expiryPeriodType='LIFETIME',dripContent=False,startDate=start.isoformat(),endDate=(start+timedelta(weeks=15,days=-1)).isoformat(),requirements=package['requirements'],outcomes='\n'.join(package['outcomes']),metaKeywords='Java, dasturlash asoslari, dasturiy injinering, 1-semestr'))
    cid=course['id'];base=f'/courses/{cid}'
    existing_modules=api.call('GET',base+'/modules')
    existing_contents=api.call('GET',base+'/contents')
    for pos,module in enumerate(package['modules']):
        match=unique(existing_modules,'title',module['title'])
        if not match:
            match=api.call('POST',base+'/modules',json=dict(title=module['title'],description=module['description'],position=pos+1))
            existing_modules.append(match)
        mid=match['id']
        for order,item in enumerate(module['contents']):
            found=unique([c for c in existing_contents if c['moduleId']==mid],'title',item['title'])
            if not found:
                payload={**item,'position':order+1}
                found=api.call('POST',base+f'/modules/{mid}/contents',json=payload)
                existing_contents.append(found)
        print(f'Module {pos+1}/{len(package["modules"])} ready',flush=True)

    archive=ROOT/'student-package.zip'
    ziptitle='Talaba paketi — 15 hafta, konspektlar va Java kodlari'
    first=unique(existing_modules,'title',package['modules'][0]['title'])
    found=unique(existing_contents,'title',ziptitle)
    if not found:
        with archive.open('rb') as stream:
            asset=api.call('POST',base+'/assets',files={'file':(archive.name,stream,'application/zip')})
        found=api.call('POST',base+f'/modules/{first["id"]}/contents',json=dict(title=ziptitle,contentType='FILE',assetId=asset['id'],position=len(package['modules'][0]['contents'])+1,languageCode='uz',authorName='Codex yordamida tayyorlangan o‘quv material',contentVersion='1.0.0',sourceName='Original konspektlar, topshiriqlar va Java 21 misollari',validFrom=start.isoformat()))
        existing_contents.append(found)

    existing_assignments=api.call('GET','/teachers/me/assignments')
    tz=timezone(timedelta(hours=5))
    def instant(day, at=time(23,59)):
        return datetime.combine(day,at,tzinfo=tz).astimezone(timezone.utc).isoformat().replace('+00:00','Z')
    for a in package['assignments']:
        found=unique([x for x in existing_assignments if str(x['courseId'])==str(cid)],'title',a['title'])
        if not found:
            payload={k:v for k,v in a.items() if k!='week'}
            payload.update(courseId=cid,dueDate=instant(start+timedelta(weeks=a['week'],days=-1)))
            existing_assignments.append(api.call('POST','/teachers/me/assignments',json=payload))

    existing_questions=api.call('GET',f'/teachers/me/questions?courseId={cid}')
    qids={}
    for q in package['questions']:
        found=unique(existing_questions,'text',q['text'])
        if not found:
            found=api.call('POST','/teachers/me/questions',json={**{k:v for k,v in q.items() if k!='key'},'courseId':cid})
            existing_questions.append(found)
        qids[q['key']]=int(found['id'])
    existing_quizzes=api.call('GET','/teachers/me/tests')
    for q in package['quizzes']:
        found=unique([x for x in existing_quizzes if str(x['courseId'])==str(cid)],'title',q['title'])
        if not found:
            payload={k:v for k,v in q.items() if k not in ('week','questionKeys')}
            payload.update(courseId=cid,questionIds=[qids[k] for k in q['questionKeys']],opensAt=instant(start+timedelta(weeks=q['week']-1),time(0)),closesAt=instant(start+timedelta(weeks=q['week'],days=-1)))
            existing_quizzes.append(api.call('POST','/teachers/me/tests',json=payload))
    syllabus_id=None;admin_created=0
    if args.admin_username:
        admin_password=os.getenv('LMS_ADMIN_PASSWORD') or getpass.getpass('Academic admin password: ')
        admin=API(args.base_url,args.admin_username,admin_password)
        syllabi=admin.call('GET',f'/syllabi?subjectId={subject["id"]}')
        name=package['title']+' — o‘quv dasturi'
        syllabus=unique(syllabi,'name',name)
        if not syllabus:
            syllabus=admin.call('POST','/syllabi',json=dict(subjectId=subject['id'],name=name,language='UZ',shortDescription='15 hafta, 6 kredit/180 soat taklifi; o‘zbekcha Java 21 fan dasturi.',requirements=package['requirements'],fullDescription=package['syllabusHtml'],active=True))
        syllabus_id=syllabus['id'];admin_created=admin.created
    # Fresh reads verify persistence, not only successful create responses.
    actual=api.call('GET',base+'/contents')
    actual_modules=api.call('GET',base+'/modules')
    actual_questions=api.call('GET',f'/teachers/me/questions?courseId={cid}')
    actual_assignments=[x for x in api.call('GET','/teachers/me/assignments') if str(x['courseId'])==str(cid)]
    actual_quizzes=[x for x in api.call('GET','/teachers/me/tests') if str(x['courseId'])==str(cid)]
    for module in package['modules']:
        mid=unique(actual_modules,'title',module['title'])['id']
        for item in module['contents']:
            saved=unique([c for c in actual if c['moduleId']==mid],'title',item['title'])
            if not saved:raise RuntimeError('Missing imported content: '+item['title'])
            # Manual edits are retained; report differences instead of overwriting.
    differences=[]
    for module in package['modules']:
        mid=unique(actual_modules,'title',module['title'])['id']
        for item in module['contents']:
            saved=unique([c for c in actual if c['moduleId']==mid],'title',item['title'])
            if any(saved.get(k)!=item.get(k) for k in ('contentBody','contentUrl','languageCode')):differences.append(item['title'])
    report=dict(courseId=cid,subjectId=subject['id'],syllabusId=syllabus_id,status=course['status'],startDate=start.isoformat(),modules=len(actual_modules),textLessons=sum(x['contentType'].lower()=='text' for x in actual),videoLessons=sum(x['contentType'].lower()=='video' for x in actual),downloadPackages=sum(x['contentType'].lower()=='file' for x in actual),assignments=len(actual_assignments),questions=len(actual_questions),quizzes=len(actual_quizzes),createdThisRun=api.created+admin_created,contentDifferences=differences,packageSha256=hashlib.sha256(archive.read_bytes()).hexdigest(),compatibilityIssueCodes=sorted({issue['code'] for c in actual for issue in c['compatibility']['issues']}),teacherUrl=f'http://localhost:5174/teacher/courses/{cid}/contents')
    Path(args.report).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,ensure_ascii=True,indent=2))

if __name__=='__main__':
    try:main()
    except Exception as error:
        print(str(error),file=sys.stderr)
        sys.exit(1)
