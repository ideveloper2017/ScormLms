# EDU-09: Davlat Attestatsiyasi va Bitiruv Nazorat Jurnali
**State Attestation and Graduation Exam Journal**
**Decision 559 - Clause 21**
**Status:** REJADA (PLANNED)
**Dependency:** EDU-08 (Semestr Yakuniy Nazorati)

## 📋 Maqsad (Objective)

Bitiruv (magistratura va bakalavr) imtihonlarini davlat attestatsiyasi sifatida qayd etish va boshqarish. Komissiya azolarining qatnashishi, attesstatsiya natijalari, va kelib chiqish sertifikatlari audit qilinadi.

**Record graduation exams as state attestation with commission member participation, results, and graduation certificates tracked and audited.**

---

## 🔍 TAHLIL (ANALYSIS)

### Tafsil qayd etish (Detailed Requirements from Clause 21)

1. **Davlat Attestatsiya Sessiyasi** (State Attestation Session)
   - Komissiya azolari (Commission members)
   - Sessiya vaqti va joyi
   - Attestatsiya turi (Bakalavriat/Magistratura)
   - Qatnashish registratsiyasi
   
2. **Talaba Qatnashish** (Student Participation)
   - Mustaqil prezentatsiya (Thesis defense)
   - Savollarga javob
   - Komissiya bahosi
   - Bitiruv sertifikati
   
3. **Komissiya Qarorlari** (Commission Decisions)
   - Ijobiy baho (Pass)
   - Salbiy baho (Fail)
   - Takroriy imtihon (Retake)
   - Sertifikat berilish
   
4. **Audit Va Jurnali** (Audit Trail and Journal)
   - Har bir qaror vaqti va imzosi
   - Negizli imzolovchi
   - Komissiya protokoli
   - Sertifikat raqami va tarixi

---

## 📊 ENTITY DIAGRAM

```
StateAttestationSession (davlat_attestation_sessions)
├── id, course_id, semester_id
├── title (Bakalavr/Magistr dissertatsiyasi)
├── exam_date, exam_time, location
├── commission_chair_id (Raisbosh)
├── status (DRAFT → PUBLISHED → ONGOING → COMPLETED)
├── result_published_at
└── deleted, audit fields

AttestationCommissionMember (attestation_commission_members)
├── id, session_id, user_id
├── role (CHAIR, MEMBER, SECRETARY)
├── appointed_by (kim tayinladi)
├── appointed_at
└── deleted, audit fields

StudentDefense (student_defenses)
├── id, attestation_session_id, enrollment_id
├── defense_status (SCHEDULED, DEFENDED, CANCELLED)
├── defense_date, defense_time
├── presentation_file_url
├── defense_notes (tekstual qaydlar)
├── commission_decision (PASS, FAIL, RETAKE)
├── commission_score (0-100 ball)
└── deleted, audit fields

AttestationGrade (attestation_grades)
├── id, student_defense_id
├── graded_by_id (komissiya azosi)
├── score (0-100)
├── criteria_scores (individual scores)
├── comments
├── grading_date
└── deleted, audit fields

GraduationCertificate (graduation_certificates)
├── id, student_defense_id
├── certificate_number (raqamli qayd)
├── issue_date
├── issued_by (Rektori imzosi)
├── specialization
├── gpa_final
├── certificate_file_url
└── deleted, audit fields

AttestationProtocol (attestation_protocols)
├── id, attestation_session_id
├── protocol_number (jurnali raqami)
├── protocol_date
├── total_students
├── passed_count, failed_count
├── protocol_file_url
├── approver_id (Rektori)
├── approved_at
└── deleted, audit fields

AttestationAuditLog (attestation_audit_log)
├── id, attestation_session_id
├── action (CREATED, STUDENT_DEFENDED, GRADED, CERTIFIED, PUBLISHED)
├── actor_id, details
├── ip_address, user_agent
└── action_time
```

---

## 🗂️ FAYLLAR STRUKTURASI (File Structure)

```
src/main/kotlin/uz/scorm/lms/app/v1/attestation/
├── model/                          (6 entity files)
│   ├── StateAttestationSession.kt
│   ├── AttestationCommissionMember.kt
│   ├── StudentDefense.kt
│   ├── AttestationGrade.kt
│   ├── GraduationCertificate.kt
│   └── AttestationProtocol.kt
│
├── repository/                     (6 repository files)
│   ├── AttestationSessionRepository.kt
│   ├── CommissionMemberRepository.kt
│   ├── StudentDefenseRepository.kt
│   ├── AttestationGradeRepository.kt
│   ├── GraduationCertificateRepository.kt
│   └── AttestationProtocolRepository.kt
│
├── dto/                            (3 DTO files)
│   ├── AttestationSessionDto.kt
│   ├── StudentDefenseDto.kt
│   └── GraduationCertificateDto.kt
│
├── service/                        (4 service files)
│   ├── AttestationSessionService.kt
│   ├── StudentDefenseService.kt
│   ├── GraduationCertificateService.kt
│   └── AttestationProtocolService.kt
│
└── controller/                     (3 controller files)
    ├── AttestationSessionController.kt
    ├── StudentDefenseController.kt
    └── GraduationCertificateController.kt

src/main/resources/db/migration/
└── V9__state_attestation_and_graduation.sql

docs/
├── edu-09-state-attestation.md     (this file)
└── edu-09-summary.md               (visual summary)
```

---

## 🔗 BOG'LANISHLAR (Dependencies)

### Muqarrar
- **✅ EDU-08** - Semestr yakuniy nazorati
  - EDU-08 `exam_sessions` jadvali davlat attestatsiyasi uchun model bo'ladi
  - Talaba qatnashish va bahosi EDU-08 dan o'tinadi
  - Commission decisions EDU-09 da saqlangan holda EDU-08 natijalariga tayanadi
  
- **✅ EDU-01** - Course Management
- **✅ EDU-02** - Enrollment System
- **✅ EDU-03** - Individual Study Plan
- **✅ EDU-04** - Attendance Tracking
- **✅ EDU-05** - Assignment Grading
- **✅ EDU-06** - Quiz Results

### Interfeyslashgan
- **📋 MON-04** - Talaba va pedagog hisobotlari
  - Graduation statistics and reports
  - Certificate issuance tracking

---

## 📋 QABUL MEZONI (Acceptance Criteria)

- [ ] Database migration V9 yaratildi va valid
- [ ] Barcha 6 ta entity model compiled
- [ ] Barcha 6 ta repository interface compiled
- [ ] 3 ta DTO fayl compiled
- [ ] 4 ta Service implemented
- [ ] 3 ta REST Controller implemented
- [ ] Commission member management working
- [ ] Student defense recording working
- [ ] Certificate generation working
- [ ] Protocol generation and approval working
- [ ] Audit trail complete
- [ ] Unit tests: 95%+ coverage
- [ ] Integration tests passing
- [ ] E2E scenarios working

---

## 🎯 ASOSIY XUSUSIYATLAR (Key Features)

### 1. Attestation Commission Management
```
Features:
- Commission member appointment (roles: CHAIR, MEMBER, SECRETARY)
- Commission eligibility verification
- Secretary data recording
- Commission meeting scheduling
```

### 2. Student Defense Workflow
```
Workflow:
1. Student presents thesis
2. Commission asks questions
3. Defense recorded with notes
4. Grades assigned by each member
5. Final decision made by chair
6. Certificate generated if passed
```

### 3. Grading and Scoring
```
Criteria:
- Thesis quality
- Presentation skills
- Defense preparation
- Answer quality
- Overall knowledge

Each member scores 0-100
Final score = average of all members
Pass threshold = 60 points (configurable)
```

### 4. Certificate Management
```
Certificate includes:
- Student name and ID
- Program and specialization
- Final GPA
- Certificate number
- Issue date
- Digital signature
- QR code for verification
```

### 5. Protocol Generation
```
Official Record:
- Date and time
- Commission members
- Total students assessed
- Pass/fail counts
- Student results summary
- Rector's approval signature
- Protocol filing and archiving
```

---

## 📊 WORKFLOW DIAGRAM

```
DRAFT STATE
    ↓
[Commission members appointed by admin]
    ↓
PUBLISHED STATE
    ↓
[Exam schedule published]
    ↓
ONGOING STATE
    ↓
[Students attend defense]
    ├─ Commission records attendance
    ├─ Marks each student as DEFENDED/CANCELLED
    ├─ Commission members grade each student
    └─ System calculates average score
    ↓
[Grading completed]
    ↓
[Certificates generated for passed students]
    ↓
[Protocol generated and approved by rector]
    ↓
COMPLETED STATE
    ↓
[Results published to students]
    ↓
[Certificate issued]
```

---

## 🔐 PERMISSION MODEL (Ruxsatlar Modeli)

| Rol | Imkoniyat |
|---|---|
| **Admin** | Create/edit attestation sessions, manage commission members |
| **Rector** | Approve attestation protocol, sign certificates |
| **Commission Chair** | Lead defense, make final decisions |
| **Commission Member** | Grade student defenses, record attendance |
| **Secretary** | Record defense notes, prepare protocol |
| **Teacher** | View student results |
| **Student** | Schedule defense, view grade, download certificate |

---

## 🧪 TEST SCENARIOS

### Happy Path
```
1. Create state attestation session
   ✓ Set date, location, commission
   
2. Publish for students
   ✓ Students register for defense
   
3. Conduct defenses
   ✓ Record attendance
   ✓ Grade each student (6-100 points)
   
4. Generate certificates
   ✓ Create certificate for passed students
   ✓ Assign certificate numbers
   
5. Generate protocol
   ✓ Create official record
   ✓ Get rector approval
   
6. Publish results
   ✓ Results visible to students
   ✓ Certificates downloadable
```

### Edge Cases
```
- Student fails attestation (< 60 points)
  ✓ No certificate issued
  ✓ Retake scheduled
  
- Commission member conflict
  ✓ Member can recuse themselves
  ✓ Replacement member assigned
  
- Missing grades from member
  ✓ Deadline enforcement
  ✓ Admin override capability
  
- Certificate revocation
  ✓ Audit trail updated
  ✓ Archive maintained
```

---

## 💾 DATABASE TABLES (V9 Migration)

### 1. state_attestation_sessions
```sql
id, course_id, semester_id
title, description
exam_date, exam_time, location
commission_chair_id (FK users)
status (DRAFT, PUBLISHED, ONGOING, COMPLETED)
defense_type (BACHELOR, MASTER)
min_members, min_pass_score
result_published_at
published_at, held_at
deleted, audit fields
```

### 2. attestation_commission_members
```sql
id, session_id (FK attestation_sessions)
user_id (FK users)
role (CHAIR, MEMBER, SECRETARY)
appointed_by (FK users)
appointed_at
deleted, audit fields
```

### 3. student_defenses
```sql
id, attestation_session_id (FK)
enrollment_id (FK course_enrollments)
defense_status (SCHEDULED, DEFENDED, CANCELLED)
defense_date, defense_time
presentation_file_url (thesis)
defense_notes TEXT
commission_decision (PASS, FAIL, RETAKE)
commission_score DECIMAL
deleted, audit fields
```

### 4. attestation_grades
```sql
id, student_defense_id (FK)
graded_by_id (FK users - commission member)
score DECIMAL (0-100)
criteria_scores JSON (for detailed breakdown)
comments TEXT
grading_date
deleted, audit fields
```

### 5. graduation_certificates
```sql
id, student_defense_id (FK)
certificate_number VARCHAR UNIQUE
issue_date
issued_by (FK users - rector)
specialization
gpa_final DECIMAL
certificate_file_url (PDF)
qr_code_url
verification_token
deleted, audit fields
```

### 6. attestation_protocols
```sql
id, attestation_session_id (FK)
protocol_number VARCHAR UNIQUE
protocol_date
total_students, passed_count, failed_count
protocol_file_url (PDF)
approver_id (FK users - rector)
approved_at
deleted, audit fields
```

### 7. attestation_audit_log
```sql
id, attestation_session_id (FK)
action VARCHAR (CREATED, PUBLISHED, DEFENDED, GRADED, CERTIFIED, PROTOCOL_APPROVED)
actor_id (FK users)
details TEXT
ip_address, user_agent
action_time
```

---

## 🎓 GRADUATION CERTIFICATE CONTENT

```
╔═══════════════════════════════════════════════════════════════╗
║                 O'ZBEKISTON RESPUBLIKASI                      ║
║            BITIRUV SERTIFIKATI / DIPLOMA                      ║
║                   GRADUATION CERTIFICATE                      ║
╚═══════════════════════════════════════════════════════════════╝

Sertifikat Raqami / Certificate No: XYZ-2026-0001234
Berilgan Sanasi / Issued Date: 2026-06-15

Bu sertifikat shuni tasdiqlaydi va / This certifies that:

F.I.SH. / Full Name: Abdullayev Abdulla Abdulloyevich
Talaba ID / Student ID: STU-2022-00567
O'quv Yili / Academic Year: 2021-2026

Quyidagi yo'nalishda o'qish dasturini muvaffaqiyatli yakunladi:
Has successfully completed the program in:

DASTUR NOMI / Program: Kompyuter Injinierligi
                       Computer Engineering

IXTISOSLANISH / Specialization: Sun'iy Intellekt
                                Artificial Intelligence

FINAL GPA: 3.85 / 4.0

Davlat Attestatsiya Sessiyasida:
At State Attestation Session on:

Sanasi: 2026-06-10
Joyi: O'zMU Konferensiya Zali
Komissiya Raisboshi: Prof. Dr. Maxmatov A.M.

Qaror: TASDIQLANADI / APPROVED
Ball: 94 / 100

Rektori Imzosi:                    Muhr:
╱────────────────────╲
│   Rektorning Imzosi │
│  Rector's Signature │
╲────────────────────╱

QR Code: [████████████████]
Verification: cert.uz/verify/XYZ-2026-0001234
```

---

## 📝 TAQQOSLAMA: EDU-08 vs EDU-09

| Parametr | EDU-08 (Imtihon) | EDU-09 (Attestatsiya) |
|---|---|---|
| **Maqsad** | Semestr oxiri imtihonlari | Bitiruv davlat attestatsiyasi |
| **Komissiya** | 1-2 o'qituvchi | 3-5 komissiya azosi |
| **Vazifa** | Semestr to'liqligi tekshirish | Magistrlik/bakalavrlaring tayyorligini tekshirish |
| **Dissertatsiya** | Yo'q | Ha (Magistr) yoki Proyekt (Bakalavr) |
| **Sertifikat** | Yo'q | Davlat sertifikati |
| **Shumulovlik** | Har semestr | Bir marta (bitiruv) |
| **Qarorlar** | Ball va baho | Pass/Fail/Retake |

---

## ⚠️ MUHIM ESLATMA (Important Notes)

### 1. EDU-08 dan Qanday Farq?
- **EDU-08:** Har bir semestr uchun imtihon (qismiy nihoyat)
- **EDU-09:** Faqat bitiruv imtihoni (to'liq nihoyat)

### 2. Sertifikat Raqamlash
```
Format: YYYY-NNNNN
YYYY = yil (2026)
NNNNN = ketma-ketli raqam
Misol: 2026-00001, 2026-00002, ...
```

### 3. QR Code Tasdiqlanishi
- Universitetin resmi veb-saytida tekshirish
- Certificate fraud oldini olish
- Digital verification token bilan

### 4. Protokol Arxivi
- Rasmiy davlat arxiviga uzatish
- 10 yil saqlash muddati
- Audit trail to'liq saqlalishi kerak

---

## 🔄 DAVOMIYLIK QOIDALARI

1. **Retake Imtihoni**
   - Agar talaba birinchi imtihonda o'tmasa, takroriy imtihon rejalashtriladi
   - Max 2-3 ta takrorii imtihon ruxsati

2. **Komissiya Imzolari**
   - Barcha komissiya azolarining imzosi zarur
   - E-imzo qo'llanilishi mumkin

3. **Bitiruv Shartlari**
   - GPA >= 2.0
   - Barcha kurslar yakunlangan
   - Davlat attestatsiyasini o'tgan

---

## 📅 TAFSIL (Timeline)

| Bosqich | Muddat | Holat |
|---|---|---|
| Database V9 | 2026-08-05 | ⏳ TODO |
| Entity Models (6) | 2026-08-06 | ⏳ TODO |
| Repositories (6) | 2026-08-06 | ⏳ TODO |
| DTOs (3) | 2026-08-06 | ⏳ TODO |
| Services (4) | 2026-08-07 | ⏳ TODO |
| Controllers (3) | 2026-08-07 | ⏳ TODO |
| Frontend | 2026-08-08 | ⏳ TODO |
| Testing | 2026-08-08 | ⏳ TODO |

**Estimated Completion:** 2026-08-09

---

## 📚 REFERENCELER (References)

- Decision 559 Clause 21
- O'zbekiston Respublikasi Ta'lim Qonuni
- UNESCO Guidelines for State Attestation
- Previous graduation records template

---

## ✅ CHECKLIST

### To be Completed
- [ ] Database schema V9 designed
- [ ] Entity models coded
- [ ] Repositories implemented
- [ ] DTOs created
- [ ] Services implemented
- [ ] Controllers created
- [ ] Frontend components
- [ ] Unit tests written
- [ ] Integration tests
- [ ] E2E tests
- [ ] API documentation
- [ ] User guide (teacher)
- [ ] User guide (student)
- [ ] Admin guide
- [ ] Certificate template finalized

---

**Prepared by:** Implementation Team
**Date:** 2026-08-05
**Status:** Ready for Development ✅
