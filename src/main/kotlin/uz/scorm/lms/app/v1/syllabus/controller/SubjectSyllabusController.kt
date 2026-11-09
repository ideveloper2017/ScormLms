package uz.scorm.lms.app.v1.syllabus.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusRequest
import uz.scorm.lms.app.v1.syllabus.service.SubjectSyllabusService

@RestController
@RequestMapping("/api/v1/syllabi")
class SubjectSyllabusController(
    private val service: SubjectSyllabusService,
    private val media: uz.scorm.lms.app.v1.syllabus.service.SyllabusMediaService,
) {
    /** Muqova rasmi (cover) yoki tanishtiruv videosi (video) — qaytadi: yangilangan dastur */
    @PostMapping("/{id}/media/{kind}", consumes = [org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun uploadMedia(@PathVariable id: Long, @PathVariable kind: String, @RequestPart("file") file: org.springframework.web.multipart.MultipartFile) =
        media.upload(id, uz.scorm.lms.app.v1.syllabus.service.SyllabusMediaKind.of(kind), file).let { service.findAll(listOf(id)).first() }

    @DeleteMapping("/{id}/media/{kind}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun removeMedia(@PathVariable id: Long, @PathVariable kind: String) =
        media.remove(id, uz.scorm.lms.app.v1.syllabus.service.SyllabusMediaKind.of(kind)).let { service.findAll(listOf(id)).first() }

    @GetMapping("/{id}/media/{kind}")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun mediaFile(@PathVariable id: Long, @PathVariable kind: String) =
        syllabusMediaResponse(media.open(id, uz.scorm.lms.app.v1.syllabus.service.SyllabusMediaKind.of(kind)))

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun history(@PathVariable id: Long) = service.history(id)

    @PostMapping("/{id}/workflow")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun workflow(@PathVariable id: Long, @RequestBody request: uz.scorm.lms.app.v1.syllabus.dto.SyllabusWorkflowRequest,
        @uz.scorm.lms.app.security.CurrentUser user: uz.scorm.lms.app.v1.user.model.User) = service.transition(id, request.action, user)
    @GetMapping
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun list(@RequestParam(required = false) subjectId: Long?, @RequestParam(required = false) modelProgramId: Long?) =
        service.list(subjectId, modelProgramId)

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: SubjectSyllabusRequest) = ResponseEntity.status(HttpStatus.CREATED).body(service.create(request))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun update(@PathVariable id: Long, @RequestBody request: SubjectSyllabusRequest) = service.update(id, request)

    @PutMapping("/{id}/topics")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateTopics(@PathVariable id: Long, @RequestBody topics: List<uz.scorm.lms.app.v1.syllabus.dto.SyllabusTopicRequest>) =
        service.updateTopics(id, topics)

    /** Dastur tuzilmasi: modullar va darslar (to'liq almashtiriladi, faqat qoralamada) */
    @PutMapping("/{id}/modules")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateModules(@PathVariable id: Long, @RequestBody modules: List<uz.scorm.lms.app.v1.syllabus.dto.SyllabusModuleRequest>) =
        service.updateModules(id, modules)

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> { service.delete(id); return ResponseEntity.noContent().build() }
}

/** Dastur media fayli javobi (admin va talaba uchun umumiy) */
fun syllabusMediaResponse(download: uz.scorm.lms.app.v1.syllabus.service.SyllabusMediaDownload): ResponseEntity<org.springframework.core.io.InputStreamResource> =
    ResponseEntity.ok()
        .cacheControl(org.springframework.http.CacheControl.noStore())
        .header("Content-Disposition", org.springframework.http.ContentDisposition.inline()
            .filename(download.fileName, java.nio.charset.StandardCharsets.UTF_8).build().toString())
        .header("X-Content-Type-Options", "nosniff")
        .contentType(org.springframework.http.MediaType.parseMediaType(download.mediaType))
        .contentLength(download.sizeBytes)
        .body(download.resource)
