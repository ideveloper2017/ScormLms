param(
    [int]$BackendPort = 8081,
    [int]$FrontendPort = 5174
)

$ErrorActionPreference = "Stop"
$apiBase = "http://127.0.0.1:$BackendPort/api/v1"

function Login-DemoUser([string]$Username, [string]$Password) {
    $body = @{ username = $Username; password = $Password } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$apiBase/auth/login" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 30
    if (-not $response.success -or [string]::IsNullOrWhiteSpace($response.data.accessToken)) {
        throw "$Username login tekshiruvidan o'tmadi."
    }
    return $response.data
}

$health = Invoke-RestMethod -Uri "http://127.0.0.1:$BackendPort/actuator/health" -TimeoutSec 30
if ($health.status -ne "UP") { throw "Backend UP emas." }

$frontend = Invoke-WebRequest -Uri "http://127.0.0.1:$FrontendPort/login" -TimeoutSec 15
if ($frontend.StatusCode -ne 200) { throw "Frontend HTTP 200 qaytarmadi." }

$student = Login-DemoUser "demo_student" "Physics#Study2026"
$studentResponse = Invoke-RestMethod -Uri "$apiBase/students/me/courses" -Headers @{ Authorization = "Bearer $($student.accessToken)" } -TimeoutSec 30
$studentCourses = @($studentResponse.data)
if ($studentCourses.Count -lt 2) { throw "Student kabinetida kamida 2 ta demo kurs bo'lishi kerak." }

$teacher = Login-DemoUser "demo_teacher" "Physics#Teach2026"
$teacherResponse = Invoke-RestMethod -Uri "$apiBase/courses/owned" -Headers @{ Authorization = "Bearer $($teacher.accessToken)" } -TimeoutSec 30
$teacherCourses = @($teacherResponse.data)
if ($teacherCourses.Count -lt 3) { throw "Teacher kabinetida kamida 3 ta demo kurs bo'lishi kerak." }

foreach ($staffUsername in @("demo_admin", "demo_metodist", "demo_proctor", "demo_monitoring")) {
    $null = Login-DemoUser $staffUsername "Physics#Staff2026"
}

Write-Host "Lokal tekshiruv muvaffaqiyatli" -ForegroundColor Green
Write-Host "Backend: UP"
Write-Host "Frontend: HTTP 200"
Write-Host "Student kurslari: $($studentCourses.Count)"
Write-Host "Teacher kurslari: $($teacherCourses.Count)"
Write-Host "Staff rollari: admin, metodist, proctor, monitoring"
