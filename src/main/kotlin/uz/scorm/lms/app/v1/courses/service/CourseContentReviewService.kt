package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.ContentReviewDecisionRequest
import uz.scorm.lms.app.v1.courses.dto.CourseContentReviewDto
import uz.scorm.lms.app.v1.courses.dto.CourseContentAssetDto
import uz.scorm.lms.app.v1.courses.model.ContentReviewDecision
import uz.scorm.lms.app.v1.courses.model.ContentReviewStatus
import uz.scorm.lms.app.v1.courses.model.CourseContent
import uz.scorm.lms.app.v1.courses.model.CourseContentReview
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseContentReviewRepository
import uz.scorm.lms.app.v1.courses.repository.CourseContentRevisionRepository
import uz.scorm.lms.app.v1.contentstandard.service.ContentStandardService
import java.time.Instant

@Service
class CourseContentReviewService(
    private val contentRepository: CourseContentRepository,
    private val revisionRepository: CourseContentRevisionRepository,
    private val reviewRepository: CourseContentReviewRepository,
    private val accessService: CourseAccessService,
    private val compatibilityService: ContentCompatibilityService,
    private val contentStandardService: ContentStandardService,
) {
    @Transactional
    fun submit(
        courseId: Long,
        contentId: Long,
        userId: Long,
        mayManageAll: Boolean,
    ): CourseContentReviewDto {
        accessService.requireManage(courseId, userId, mayManageAll)
        val content = content(courseId, contentId)
        require(content.status == LearningItemStatus.DRAFT.name) {
            "Kontent ekspertizaga yuborilishidan oldin qoralama holatida bo'lishi kerak"
        }
        require(content.reviewStatus in setOf(
            ContentReviewStatus.DRAFT.name,
            ContentReviewStatus.CHANGES_REQUESTED.name,
        )) { "Kontent allaqachon ekspertizada yoki tasdiqlangan" }
        compatibilityService.requireContentCompatible(content)
        val revision = requireNotNull(
            revisionRepository.findFirstByContentIdAndDeletedFalseOrderByRevisionNumberDesc(contentId)
        ) { "Kontent revisioni topilmadi" }
        require(!reviewRepository.existsByContentIdAndRevisionNumberAndDeletedFalse(contentId, revision.revisionNumber)) {
            "Ushbu kontent revisioni avval ekspertizaga yuborilgan"
        }
        val review = reviewRepository.save(CourseContentReview(
            content = content,
            revisionNumber = revision.revisionNumber,
            contentVersion = revision.contentVersion,
            submittedAt = Instant.now(),
            submittedBy = userId,
        ))
        content.reviewStatus = ContentReviewStatus.IN_REVIEW.name
        content.approvedRevisionNumber = null
        contentRepository.save(content)
        return dto(review)
    }

    @Transactional(readOnly = true)
    fun pending(mayReview: Boolean): List<CourseContentReviewDto> {
        require(mayReview) { "Kontent ekspertizasi uchun akademik vakolat kerak" }
        return reviewRepository.findAllByStatusAndDeletedFalseOrderBySubmittedAtAsc("PENDING").map(::dto)
    }

    @Transactional
    fun decide(
        reviewId: Long,
        request: ContentReviewDecisionRequest,
        reviewerId: Long,
        mayReview: Boolean,
    ): CourseContentReviewDto {
        require(mayReview) { "Kontent ekspertizasi uchun akademik vakolat kerak" }
        val review = reviewRepository.findByIdAndDeletedFalse(reviewId)
            ?: throw NoSuchElementException("Kontent ekspertizasi topilmadi: $reviewId")
        val content = review.content
        require(review.status == "PENDING" && content.reviewStatus == ContentReviewStatus.IN_REVIEW.name) {
            "Ekspertiza bo'yicha yakuniy qaror allaqachon chiqarilgan"
        }
        require(reviewerId != content.module.course.userId && reviewerId != review.submittedBy) {
            "Kontent egasi yoki yuboruvchisi o'z materialini tasdiqlay olmaydi"
        }
        val latest = requireNotNull(
            revisionRepository.findFirstByContentIdAndDeletedFalseOrderByRevisionNumberDesc(requireNotNull(content.id))
        ) { "Kontent revisioni topilmadi" }
        require(latest.revisionNumber == review.revisionNumber && latest.contentVersion == review.contentVersion) {
            "Ekspertizaga yuborilgan revision joriy kontent versiyasiga mos emas"
        }
        val comment = request.comment?.trim()?.takeIf(String::isNotBlank)
        require(comment == null || comment.length <= 2000) { "Ekspert izohi 2000 belgidan oshmasligi kerak" }
        require(request.decision != ContentReviewDecision.CHANGES_REQUESTED || (comment?.length ?: 0) >= 10) {
            "Tuzatishga qaytarishda kamida 10 belgili asos majburiy"
        }
        if (request.decision == ContentReviewDecision.APPROVED) {
            compatibilityService.requireContentCompatible(content)
            contentStandardService.requirePassingAssessmentIfConfigured(requireNotNull(latest.id))
        }
        val now = Instant.now()
        review.status = request.decision.name
        review.reviewedAt = now
        review.reviewedBy = reviewerId
        review.decisionComment = comment
        when (request.decision) {
            ContentReviewDecision.APPROVED -> {
                content.reviewStatus = ContentReviewStatus.APPROVED.name
                content.approvedRevisionNumber = review.revisionNumber
            }
            ContentReviewDecision.CHANGES_REQUESTED -> {
                content.reviewStatus = ContentReviewStatus.CHANGES_REQUESTED.name
                content.approvedRevisionNumber = null
            }
        }
        contentRepository.save(content)
        return dto(reviewRepository.save(review))
    }

    @Transactional(readOnly = true)
    fun history(
        courseId: Long,
        contentId: Long,
        userId: Long,
        mayReview: Boolean,
    ): List<CourseContentReviewDto> {
        val course = accessService.requireRead(courseId, userId, mayReview)
        content(courseId, contentId)
        require(mayReview || course.userId == userId) { "Kontent ekspertizasi tarixi uchun vakolat yetarli emas" }
        return reviewRepository.findAllByContentIdAndDeletedFalseOrderBySubmittedAtDesc(contentId).map(::dto)
    }

    private fun content(courseId: Long, contentId: Long): CourseContent = contentRepository.findById(contentId)
        .filter { !it.deleted && it.module.course.id == courseId }
        .orElseThrow { NoSuchElementException("Kurs kontenti topilmadi: $contentId") }

    private fun dto(review: CourseContentReview): CourseContentReviewDto {
        val content = review.content
        val course = content.module.course
        val revision = requireNotNull(revisionRepository.findByContentIdAndRevisionNumberAndDeletedFalse(
            requireNotNull(content.id), review.revisionNumber,
        )) { "Ekspertiza revision snapshoti topilmadi" }
        return CourseContentReviewDto(
            id = requireNotNull(review.id),
            courseId = requireNotNull(course.id),
            courseTitle = course.title ?: "Nomsiz kurs",
            moduleId = requireNotNull(content.module.id),
            moduleTitle = content.module.title,
            contentId = requireNotNull(content.id),
            contentTitle = revision.title,
            description = revision.description,
            contentType = revision.contentType.name.lowercase(),
            contentUrl = revision.contentUrl,
            contentBody = revision.contentBody,
            asset = revision.asset?.let { asset ->
                CourseContentAssetDto(
                    id = requireNotNull(asset.id),
                    courseId = requireNotNull(asset.course.id),
                    originalFileName = asset.originalFileName,
                    mediaType = asset.mediaType,
                    sizeBytes = asset.sizeBytes,
                    sha256 = asset.sha256,
                    uploadedAt = asset.createdAt,
                )
            },
            languageCode = revision.languageCode,
            authorName = revision.authorName,
            sourceName = revision.sourceName,
            sourceUrl = revision.sourceUrl,
            validFrom = revision.validFrom,
            validUntil = revision.validUntil,
            revisionNumber = review.revisionNumber,
            contentVersion = review.contentVersion,
            status = review.status.lowercase(),
            submittedAt = review.submittedAt,
            submittedBy = review.submittedBy,
            reviewedAt = review.reviewedAt,
            reviewedBy = review.reviewedBy,
            decisionComment = review.decisionComment,
            compatibility = compatibilityService.evaluate(content),
        )
    }
}
