package uz.scorm.lms.app.v1.academicdocument.controller

import org.springframework.http.ContentDisposition
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.academicdocument.dto.SaveCallLetterRequest
import uz.scorm.lms.app.v1.academicdocument.dto.SaveTranscriptRequest
import uz.scorm.lms.app.v1.academicdocument.service.AcademicDocumentService
import uz.scorm.lms.app.v1.academicdocument.service.GeneratedAcademicDocument
import uz.scorm.lms.app.v1.user.model.User
import java.nio.charset.StandardCharsets

@RestController
@RequestMapping("/api/v1/academic-documents")
@PreAuthorize("hasAuthority('ACADEMIC_READ')")
class AcademicDocumentController(private val service: AcademicDocumentService) {
    @GetMapping("/students")
    fun students() = service.studentOptions()

    @GetMapping("/call-letters")
    fun callLetters() = service.listCallLetters()

    @PostMapping("/call-letters")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun createCallLetter(@RequestBody request: SaveCallLetterRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.createCallLetter(request, requireNotNull(user.id)))

    @PutMapping("/call-letters/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateCallLetter(@PathVariable id: Long, @RequestBody request: SaveCallLetterRequest, @CurrentUser user: User) =
        service.updateCallLetter(id, request, requireNotNull(user.id))

    @PostMapping("/call-letters/{id}/confirm")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun confirmCallLetter(@PathVariable id: Long, @CurrentUser user: User) = service.confirmCallLetter(id, requireNotNull(user.id))

    @PostMapping("/call-letters/{id}/generate", produces = [MediaType.APPLICATION_PDF_VALUE])
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun generateCallLetter(@PathVariable id: Long, @CurrentUser user: User) = pdf(service.generateCallLetter(id, requireNotNull(user.id)))

    @DeleteMapping("/call-letters/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun deleteCallLetter(@PathVariable id: Long, @CurrentUser user: User): ResponseEntity<Void> {
        service.deleteCallLetter(id, requireNotNull(user.id)); return ResponseEntity.noContent().build()
    }

    @GetMapping("/transcripts")
    fun transcripts() = service.listTranscripts()

    @PostMapping("/transcripts")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun createTranscript(@RequestBody request: SaveTranscriptRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.createTranscript(request, requireNotNull(user.id)))

    @PutMapping("/transcripts/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateTranscript(@PathVariable id: Long, @RequestBody request: SaveTranscriptRequest, @CurrentUser user: User) =
        service.updateTranscript(id, request, requireNotNull(user.id))

    @PostMapping("/transcripts/{id}/generate", produces = [MediaType.APPLICATION_PDF_VALUE])
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun generateTranscript(@PathVariable id: Long, @CurrentUser user: User) = pdf(service.generateTranscript(id, requireNotNull(user.id)))

    @DeleteMapping("/transcripts/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun deleteTranscript(@PathVariable id: Long, @CurrentUser user: User): ResponseEntity<Void> {
        service.deleteTranscript(id, requireNotNull(user.id)); return ResponseEntity.noContent().build()
    }

    private fun pdf(document: GeneratedAcademicDocument): ResponseEntity<ByteArray> = ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_PDF)
        .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
            .filename(document.filename, StandardCharsets.UTF_8).build().toString())
        .body(document.bytes)
}
