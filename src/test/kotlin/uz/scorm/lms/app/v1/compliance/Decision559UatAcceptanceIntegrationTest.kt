package uz.scorm.lms.app.v1.compliance

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.mock.web.MockMultipartFile
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.header
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import uz.scorm.lms.app.v1.compliance.uat.CreateDecision559UatRunRequest
import uz.scorm.lms.app.v1.compliance.uat.BulkCoordinateDecision559UatManualTasksRequest
import uz.scorm.lms.app.v1.compliance.uat.Decision559UatOutcome
import uz.scorm.lms.app.v1.compliance.uat.Decision559UatManualEvidenceStatus
import uz.scorm.lms.app.v1.compliance.uat.Decision559UatReviewStatus
import uz.scorm.lms.app.v1.compliance.uat.Decision559UatRequirementCatalog
import uz.scorm.lms.app.v1.compliance.uat.Decision559UatRunRepository
import uz.scorm.lms.app.v1.compliance.uat.Decision559UatBundleService
import uz.scorm.lms.app.v1.compliance.uat.Decision559UatRunStatus
import uz.scorm.lms.app.v1.compliance.uat.Decision559UatService
import uz.scorm.lms.app.v1.compliance.uat.RejectDecision559UatRunRequest
import uz.scorm.lms.app.v1.compliance.uat.ReviewDecision559UatEvidenceRequest
import uz.scorm.lms.app.v1.compliance.uat.UpdateDecision559UatManualTaskCoordinationRequest
import uz.scorm.lms.app.security.RolePermissions
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.nio.file.Files
import java.nio.file.Path
import java.security.MessageDigest
import java.time.LocalDate
import java.io.ByteArrayInputStream
import java.util.zip.ZipInputStream

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = ["uat.private-storage-dir=build/test-uat-559-evidence"])
@Transactional
class Decision559UatAcceptanceIntegrationTest {
    @Autowired private lateinit var service: Decision559UatService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var runRepository: Decision559UatRunRepository
    @Autowired private lateinit var bundleService: Decision559UatBundleService
    @Autowired private lateinit var requirementCatalog: Decision559UatRequirementCatalog
    @Autowired private lateinit var mockMvc: MockMvc

    @Test
    @WithMockUser(username = "uat-runtime-manifest-export", authorities = ["UAT_READ", "UAT_WRITE"])
    fun `27 band mustaqil review va imzolangan protokolsiz tasdiqlanmaydi`() {
        val suffix = System.nanoTime()
        val submitter = userRepository.save(User(
            username = "uat-submitter-$suffix",
            password = "test",
            fullName = "UAT dalil muallifi",
        ))
        val approver = userRepository.save(User(
            username = "uat-approver-$suffix",
            password = "test",
            fullName = "Mustaqil UAT tasdiqlovchi",
        ))
        userRepository.save(User(
            username = "uat-runtime-manifest-export",
            password = "test",
            fullName = "UAT arxiv eksportchisi",
        ))
        val run = service.create(
            CreateDecision559UatRunRequest("559 qaror <script>alert(1)</script> qabul testi", Decision559UatService.SOURCE_SHA256),
            submitter.id!!,
        )
        assertEquals(43, run.manualEvidenceRequiredCount)
        assertEquals(0, run.manualEvidenceCoveredCount)
        assertEquals(0, run.manualEvidenceAcceptedCount)
        val initialManualProgress = service.manualEvidenceProgress(run.id)
        assertEquals(43, initialManualProgress.requiredCount)
        assertEquals(43, initialManualProgress.pendingCount)
        assertEquals(0, initialManualProgress.collectedCount)
        assertEquals(0, initialManualProgress.acceptedCount)
        assertEquals(0, initialManualProgress.coordinatedCount)
        assertEquals(43, initialManualProgress.uncoordinatedCount)
        assertEquals(0, initialManualProgress.overdueCount)
        assertEquals(43, initialManualProgress.items.size)
        assertTrue(initialManualProgress.items.all { it.status == Decision559UatManualEvidenceStatus.PENDING })
        assertEquals(8, initialManualProgress.items.first().band)
        val evidenceSetBeforeCoordination = service.manifest(run.id).evidenceSetSha256
        val initialProgressCsv = service.manualEvidenceProgressCsv(run.id)
        assertEquals("text/csv;charset=UTF-8", initialProgressCsv.contentType)
        assertEquals(sha256(initialProgressCsv.bytes), initialProgressCsv.sha256)
        assertEquals(44, initialProgressCsv.bytes.toString(Charsets.UTF_8).lineSequence().filter { it.isNotEmpty() }.count())
        val coordinationDueDate = LocalDate.now().plusDays(7)
        val coordinatedProgress = service.updateManualTaskCoordination(
            run.id,
            "UAT-559-08",
            0,
            UpdateDecision559UatManualTaskCoordinationRequest(
                assigneeName = "IT va universitet rahbariyati",
                dueDate = coordinationDueDate,
                note = "Inventar va infratuzilma dalillari muddatida taqdim etiladi",
            ),
            submitter.id!!,
        )
        val coordinatedItem = coordinatedProgress.items.first()
        assertEquals(Decision559UatManualEvidenceStatus.PENDING, coordinatedItem.status)
        assertEquals("IT va universitet rahbariyati", coordinatedItem.coordinationAssigneeName)
        assertEquals(coordinationDueDate, coordinatedItem.coordinationDueDate)
        assertFalse(coordinatedItem.coordinationOverdue)
        assertEquals(0, coordinatedProgress.collectedCount)
        assertEquals(1, coordinatedProgress.coordinatedCount)
        assertEquals(42, coordinatedProgress.uncoordinatedCount)
        assertThrows(IllegalArgumentException::class.java) {
            service.updateManualTaskCoordination(
                run.id,
                "UAT-559-08",
                0,
                UpdateDecision559UatManualTaskCoordinationRequest(
                    "IT", LocalDate.now().minusDays(1), "Eski muddat qabul qilinmaydi",
                ),
                submitter.id!!,
            )
        }
        assertThrows(IllegalArgumentException::class.java) {
            service.updateManualTaskCoordination(
                run.id,
                "UAT-559-03",
                0,
                UpdateDecision559UatManualTaskCoordinationRequest(
                    "Metodika", coordinationDueDate, "Automated band manual task emas",
                ),
                submitter.id!!,
            )
        }
        mockMvc.post("/api/v1/compliance/559/uat/runs/${run.id}/manual-evidence-progress/UAT-559-08/0/coordination") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"assigneeName":"IT bo'limi","dueDate":"$coordinationDueDate","note":"Endpoint orqali muddat yangilandi"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.data.items[0].status") { value("PENDING") }
            jsonPath("$.data.items[0].coordinationAssigneeName") { value("IT bo'limi") }
            jsonPath("$.data.items[0].coordinationDueDate") { value(coordinationDueDate.toString()) }
        }
        val coordinatedCsv = service.manualEvidenceProgressCsv(run.id).bytes.toString(Charsets.UTF_8)
        assertTrue(coordinatedCsv.contains("\"IT bo'limi\""))
        assertTrue(coordinatedCsv.contains("\"$coordinationDueDate\""))
        mockMvc.post("/api/v1/compliance/559/uat/runs/${run.id}/manual-evidence-progress/coordination/bulk") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"dueDate":"$coordinationDueDate","note":"Qolgan topshiriqlar tavsiya etilgan bo'limlarga taqsimlandi"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.data.coordinatedCount") { value(43) }
            jsonPath("$.data.uncoordinatedCount") { value(0) }
            jsonPath("$.data.overdueCount") { value(0) }
            jsonPath("$.data.items[0].coordinationAssigneeName") { value("IT bo'limi") }
            jsonPath("$.data.items[1].coordinationAssigneeName") { value("IT va universitet rahbariyati") }
        }
        assertThrows(IllegalArgumentException::class.java) {
            service.bulkCoordinateManualTasks(
                run.id,
                BulkCoordinateDecision559UatManualTasksRequest(
                    coordinationDueDate,
                    "Takroriy ommaviy taqsimlash bloklanadi",
                ),
                submitter.id!!,
            )
        }
        assertEquals(evidenceSetBeforeCoordination, service.manifest(run.id).evidenceSetSha256)
        assertThrows(IllegalArgumentException::class.java) { service.protocolDraft(run.id) }

        assertTrue(RolePermissions.UAT_APPROVE in RolePermissions.forRole("admin"))
        assertTrue(RolePermissions.UAT_WRITE in RolePermissions.forRole("metodist"))
        assertFalse(RolePermissions.UAT_APPROVE in RolePermissions.forRole("metodist"))
        assertTrue(RolePermissions.UAT_READ in RolePermissions.forRole("monitoring"))
        assertFalse(RolePermissions.UAT_WRITE in RolePermissions.forRole("monitoring"))
        assertThrows(IllegalArgumentException::class.java) {
            service.saveEvidence(
                run.id, 3, "UAT-559-03", Decision559UatOutcome.MANUAL_PASS,
                "Qabul komissiyasi", "PDF deb nomlangan soxta matnli dalil",
                "FAKE-3", MockMultipartFile("file", "fake.pdf", "application/pdf", "not-a-pdf".toByteArray()),
                submitter.id!!,
            )
        }

        val partial = service.saveEvidence(
            run.id,
            3,
            "UAT-559-03",
            Decision559UatOutcome.PARTIAL,
            "Qabul komissiyasi",
            "Tashqi dalil hali to'liq shakllanmagan holat",
            null,
            null,
            submitter.id!!,
        )
        assertThrows(IllegalArgumentException::class.java) { service.submit(run.id, submitter.id!!) }
        assertThrows(IllegalArgumentException::class.java) {
            service.reviewEvidence(
                partial.id,
                ReviewDecision559UatEvidenceRequest(Decision559UatReviewStatus.ACCEPTED, "Muallif review qilmoqda"),
                submitter.id!!,
            )
        }
        assertThrows(IllegalArgumentException::class.java) {
            service.reviewEvidence(
                partial.id,
                ReviewDecision559UatEvidenceRequest(Decision559UatReviewStatus.ACCEPTED, "Qisman natijani final qabul qilish"),
                approver.id!!,
            )
        }

        val evidencePdf = pdf("manual-band-3")
        var first = service.saveEvidence(
            run.id,
            3,
            "UAT-559-03",
            Decision559UatOutcome.MANUAL_PASS,
            "Qabul komissiyasi",
            "3-band bo'yicha komissiya tekshirgan haqiqiy dalil",
            "PROTOKOL-3",
            evidencePdf,
            submitter.id!!,
        )
        first = service.saveEvidence(
            run.id,
            3,
            "UAT-559-03",
            Decision559UatOutcome.MANUAL_PASS,
            "Qabul komissiyasi",
            "3-band bo'yicha bir nechta original dalil alohida SHA bilan saqlandi",
            "PROTOKOL-3",
            null,
            submitter.id!!,
            listOf(png("infrastructure-photo"), jpeg("inventory-photo")),
        )
        assertEquals(3, first.files.size)
        assertThrows(IllegalArgumentException::class.java) {
            service.saveEvidence(
                run.id,
                3,
                "UAT-559-03",
                Decision559UatOutcome.MANUAL_PASS,
                "Qabul komissiyasi",
                "Bir xil fayl SHA qiymatini takroran yuklash bloklanadi",
                "PROTOKOL-3",
                evidencePdf,
                submitter.id!!,
            )
        }
        first = service.deleteEvidenceAttachment(first.files.last().id, submitter.id!!)
        assertEquals(2, first.files.size)
        assertThrows(IllegalArgumentException::class.java) {
            service.saveEvidence(
                run.id,
                3,
                "UAT-559-03",
                Decision559UatOutcome.MANUAL_PASS,
                "Qabul komissiyasi",
                "Banddagi jami fayllar soni o'ndan oshmasligi serverda tekshiriladi",
                "PROTOKOL-3",
                null,
                submitter.id!!,
                (1..9).map { pdf("limit-overflow-$it") },
            )
        }
        service.reviewEvidence(
            first.id,
            ReviewDecision559UatEvidenceRequest(Decision559UatReviewStatus.ACCEPTED, "Dalil va rekvizit tekshirildi"),
            approver.id!!,
        )

        for (band in Decision559UatService.REQUIRED_BANDS.sorted().filterNot { it == 3 }) {
            val guidance = requirementCatalog.requirement(band, "UAT-559-${band.toString().padStart(2, '0')}")
            if (guidance.baselineStatus == "PARTIAL") {
                if (band == 8) {
                    var collected = service.saveEvidence(
                        run.id, band, guidance.id, Decision559UatOutcome.PARTIAL,
                        guidance.owner, "$band-band real dalillarining bir qismi yig'ildi",
                        "PARTIAL-COLLECTION-$band", pdf("partial-band-$band"), submitter.id!!,
                        manualEvidenceIndexes = listOf(0, 1),
                    )
                    assertEquals(guidance.manualEvidence.take(2), collected.manualEvidenceCoverage)
                    assertEquals(2, service.detail(run.id).run.manualEvidenceCoveredCount)
                    val partialProgress = service.manualEvidenceProgress(run.id)
                    assertEquals(41, partialProgress.pendingCount)
                    assertEquals(2, partialProgress.collectedCount)
                    assertEquals(0, partialProgress.acceptedCount)
                    assertEquals(
                        listOf(Decision559UatManualEvidenceStatus.COLLECTED, Decision559UatManualEvidenceStatus.COLLECTED),
                        partialProgress.items.filter { it.band == band }.take(2).map { it.status },
                    )
                    assertTrue(partialProgress.items.filter { it.band == band }.take(2).all { it.fileCount == 1 })
                    assertThrows(IllegalArgumentException::class.java) {
                        service.reviewEvidence(
                            collected.id,
                            ReviewDecision559UatEvidenceRequest(Decision559UatReviewStatus.ACCEPTED, "Qisman qamrov final emas"),
                            approver.id!!,
                        )
                    }
                    collected = service.deleteEvidenceAttachment(collected.files.single().id, submitter.id!!)
                    assertEquals(emptyList<String>(), collected.manualEvidenceCoverage)
                    assertEquals(0, service.manualEvidenceProgress(run.id).collectedCount)
                    collected = service.saveEvidence(
                        run.id, band, guidance.id, Decision559UatOutcome.BLOCKED_EXTERNAL,
                        guidance.owner, "$band-band ikki dalili yig'ildi, qolganlari tashqi mas'ulda",
                        "PARTIAL-COLLECTION-$band", pdf("partial-band-$band-reloaded"), submitter.id!!,
                        manualEvidenceIndexes = listOf(0, 1),
                    )
                    assertEquals(2, collected.manualEvidenceCoverage.size)
                    assertThrows(IllegalArgumentException::class.java) {
                        service.saveEvidence(
                            run.id, band, guidance.id, Decision559UatOutcome.NOT_APPLICABLE,
                            guidance.owner, "$band-band partial talabini N/A bilan chetlab o'tish urinishi",
                            "N-A-BYPASS-$band", null, submitter.id!!,
                        )
                    }
                }
                assertThrows(IllegalArgumentException::class.java) {
                    service.saveEvidence(
                        run.id,
                        band,
                        guidance.id,
                        Decision559UatOutcome.MANUAL_PASS,
                        guidance.owner,
                        "$band-band barcha real dalillari bilan tekshirildi",
                        "MANUAL-REPORT-V51-BAND-$band",
                        pdf("manual-band-$band-incomplete"),
                        submitter.id!!,
                        manualEvidenceIndexes = guidance.manualEvidence.indices.toList().dropLast(1),
                    )
                }
            }
            val evidence = service.saveEvidence(
                run.id,
                band,
                guidance.id,
                if (guidance.baselineStatus == "PARTIAL") Decision559UatOutcome.MANUAL_PASS else Decision559UatOutcome.AUTOMATED_PASS,
                if (guidance.baselineStatus == "PARTIAL") guidance.owner else "Avtomatlashtirilgan test egasi",
                if (guidance.baselineStatus == "PARTIAL") "$band-band barcha real dalillari bilan tekshirildi"
                else "$band-band avtomatlashtirilgan regression hisoboti bilan tekshirildi",
                if (guidance.baselineStatus == "PARTIAL") "MANUAL-REPORT-V51-BAND-$band" else "TEST-REPORT-V45-BAND-$band",
                if (guidance.baselineStatus == "PARTIAL") pdf("manual-band-$band") else null,
                submitter.id!!,
                manualEvidenceIndexes = if (guidance.baselineStatus == "PARTIAL") guidance.manualEvidence.indices.toList() else emptyList(),
            )
            assertEquals(guidance.manualEvidence, evidence.manualEvidenceCoverage)
            service.reviewEvidence(
                evidence.id,
                ReviewDecision559UatEvidenceRequest(Decision559UatReviewStatus.ACCEPTED, "Test hisoboti mustaqil tekshirildi"),
                approver.id!!,
            )
        }
        assertThrows(IllegalArgumentException::class.java) { service.submit(run.id, submitter.id!!) }

        val protocolPdf = pdf("signed-acceptance-protocol")
        val ready = service.detail(run.id)
        assertEquals(27, ready.run.evidenceCount)
        assertEquals(27, ready.run.acceptedCount)
        assertEquals(0, ready.run.blockingCount)
        assertEquals(43, ready.run.manualEvidenceRequiredCount)
        assertEquals(43, ready.run.manualEvidenceCoveredCount)
        assertEquals(43, ready.run.manualEvidenceAcceptedCount)
        val acceptedProgress = service.manualEvidenceProgress(run.id)
        assertEquals(0, acceptedProgress.pendingCount)
        assertEquals(43, acceptedProgress.collectedCount)
        assertEquals(43, acceptedProgress.acceptedCount)
        assertTrue(acceptedProgress.items.all { it.status == Decision559UatManualEvidenceStatus.ACCEPTED })
        assertFalse(ready.run.readyToSubmit)

        val evidenceManifest = service.manifest(run.id)
        assertEquals(5, evidenceManifest.schemaVersion)
        assertEquals(27, evidenceManifest.requirements.size)
        assertEquals(Decision559UatService.SOURCE_SHA256, evidenceManifest.source.sha256)
        assertEquals(64, evidenceManifest.evidenceSetSha256.length)
        val band3Manifest = evidenceManifest.requirements.single { it.band == 3 }
        assertEquals(null, band3Manifest.file)
        assertEquals(2, band3Manifest.files.size)
        assertEquals(43, evidenceManifest.requirements.sumOf { it.manualEvidenceCoverage.size })
        assertEquals(43, evidenceManifest.manualEvidenceRequiredCount)
        assertEquals(43, evidenceManifest.manualEvidenceCoveredCount)
        assertEquals(43, evidenceManifest.manualEvidenceAcceptedCount)
        assertFalse(evidenceManifest.protocol.signed)

        val protocolDraft = service.protocolDraft(run.id)
        val protocolDraftHtml = protocolDraft.bytes.toString(Charsets.UTF_8)
        assertEquals("text/html;charset=UTF-8", protocolDraft.contentType)
        assertEquals("decision-559-uat-run-${run.id}-protocol-draft.html", protocolDraft.originalName)
        assertEquals(sha256(protocolDraft.bytes), protocolDraft.sha256)
        assertTrue(protocolDraftHtml.contains("data-run-id=\"${run.id}\""))
        assertTrue(protocolDraftHtml.contains("data-evidence-set-sha256=\"${evidenceManifest.evidenceSetSha256}\""))
        assertTrue(protocolDraftHtml.contains("&lt;script&gt;alert(1)&lt;/script&gt;"))
        assertFalse(protocolDraftHtml.contains("<script>alert(1)</script>"))
        assertEquals(27, Regex("data-requirement-id=").findAll(protocolDraftHtml).count())

        val protocolDraftResponse = mockMvc.get("/api/v1/compliance/559/uat/runs/${run.id}/protocol/draft")
            .andExpect {
                status { isOk() }
                content { contentTypeCompatibleWith(MediaType.TEXT_HTML) }
                header { string("Cache-Control", "private, no-store") }
                header { string("X-Content-SHA256", protocolDraft.sha256) }
            }
            .andReturn().response
        assertEquals(protocolDraft.bytes.toList(), protocolDraftResponse.contentAsByteArray.toList())

        assertThrows(IllegalArgumentException::class.java) {
            service.uploadProtocol(
                run.id,
                "UAT-559/V47-WRONG-HASH",
                LocalDate.now(),
                "Komissiya raisi; axborot xavfsizligi; LMS biznes egasi",
                "b".repeat(64),
                protocolPdf,
                submitter.id!!,
            )
        }
        assertThrows(IllegalArgumentException::class.java) {
            service.uploadProtocol(
                run.id,
                "UAT-559/V45-INVALID",
                LocalDate.now(),
                "Faqat rais; FAQAT RAIS; faqat kotib",
                evidenceManifest.evidenceSetSha256,
                protocolPdf,
                submitter.id!!,
            )
        }

        service.uploadProtocol(
            run.id,
            "UAT-559/V45-01",
            LocalDate.now(),
            "Komissiya raisi; axborot xavfsizligi; LMS biznes egasi",
            evidenceManifest.evidenceSetSha256,
            protocolPdf,
            submitter.id!!,
        )
        val signedManifest = service.manifest(run.id)
        assertEquals(evidenceManifest.evidenceSetSha256, signedManifest.evidenceSetSha256)
        assertEquals(3, signedManifest.protocol.signatories.size)
        assertTrue(signedManifest.protocol.signed)
        assertEquals(evidenceManifest.evidenceSetSha256, signedManifest.protocol.evidenceSetSha256)
        assertTrue(signedManifest.readyToSubmit)

        val tamperedBindingRun = requireNotNull(runRepository.findByIdAndDeletedFalse(run.id))
        tamperedBindingRun.protocolEvidenceSetSha256 = "c".repeat(64)
        runRepository.saveAndFlush(tamperedBindingRun)
        assertFalse(service.detail(run.id).run.readyToSubmit)
        assertThrows(IllegalArgumentException::class.java) { service.submit(run.id, submitter.id!!) }
        tamperedBindingRun.protocolEvidenceSetSha256 = evidenceManifest.evidenceSetSha256
        runRepository.saveAndFlush(tamperedBindingRun)
        assertTrue(service.detail(run.id).run.readyToSubmit)

        val submitted = service.submit(run.id, submitter.id!!)
        assertEquals(Decision559UatRunStatus.IN_REVIEW, submitted.status)
        assertThrows(IllegalArgumentException::class.java) { service.approve(run.id, submitter.id!!) }

        val approved = service.approve(run.id, approver.id!!)
        assertEquals(Decision559UatRunStatus.APPROVED, approved.status)
        assertNotNull(approved.approvedAt)
        assertEquals("Mustaqil UAT tasdiqlovchi", approved.approvedByName)
        assertEquals(evidenceManifest.evidenceSetSha256, service.manifest(run.id).evidenceSetSha256)

        val downloadedEvidence = service.evidenceFile(first.id)
        assertEquals(evidencePdf.bytes.toList(), downloadedEvidence.bytes.toList())
        assertEquals(sha256(evidencePdf.bytes), downloadedEvidence.sha256)
        val secondAttachment = service.evidenceAttachmentFile(first.files.last().id)
        assertEquals(first.files.last().sha256, secondAttachment.sha256)
        assertThrows(IllegalArgumentException::class.java) {
            service.deleteEvidenceAttachment(first.files.first().id, submitter.id!!)
        }
        val downloadedProtocol = service.protocolFile(run.id)
        assertEquals(protocolPdf.bytes.toList(), downloadedProtocol.bytes.toList())
        assertEquals(sha256(protocolPdf.bytes), downloadedProtocol.sha256)

        mockMvc.get("/api/v1/compliance/559/uat/runs/${run.id}/manual-evidence-progress")
            .andExpect {
                status { isOk() }
                jsonPath("$.data.runId") { value(run.id) }
                jsonPath("$.data.requiredCount") { value(43) }
                jsonPath("$.data.pendingCount") { value(0) }
                jsonPath("$.data.collectedCount") { value(43) }
                jsonPath("$.data.acceptedCount") { value(43) }
                jsonPath("$.data.items.length()") { value(43) }
                jsonPath("$.data.items[0].status") { value("ACCEPTED") }
            }
        val progressCsvResponse = mockMvc.get(
            "/api/v1/compliance/559/uat/runs/${run.id}/manual-evidence-progress.csv",
        ).andExpect {
            status { isOk() }
            header { string("Cache-Control", "private, no-store") }
            header { exists("X-Content-SHA256") }
        }.andReturn().response
        assertEquals(sha256(progressCsvResponse.contentAsByteArray), progressCsvResponse.getHeader("X-Content-SHA256"))
        assertTrue(progressCsvResponse.contentAsString.contains("\"UAT-559-08\",\"8\",\"0\",\"ACCEPTED\""))

        val manifestResponse = mockMvc.get("/api/v1/compliance/559/uat/runs/${run.id}/manifest")
            .andExpect {
                status { isOk() }
                header { string("Cache-Control", "private, no-store") }
                jsonPath("$.status") { value("APPROVED") }
                jsonPath("$.readyToSubmit") { value(true) }
                jsonPath("$.requirements.length()") { value(27) }
            }
            .andReturn().response
        assertEquals(
            sha256(manifestResponse.contentAsByteArray),
            manifestResponse.getHeader("X-Content-SHA256"),
        )
        val runtimeManifest = Path.of("build", "test-results", "uat", "decision-559-runtime-manifest.json")
        Files.createDirectories(runtimeManifest.parent)
        Files.write(runtimeManifest, manifestResponse.contentAsByteArray)
        Files.writeString(
            runtimeManifest.resolveSibling("decision-559-runtime-manifest.sha256"),
            "${manifestResponse.getHeader("X-Content-SHA256")}  ${runtimeManifest.fileName}\n",
        )

        val pendingBundle = mockMvc.get("/api/v1/compliance/559/uat/runs/${run.id}/bundle")
            .andExpect { request { asyncStarted() } }
            .andReturn()
        val bundleResponse = mockMvc.perform(asyncDispatch(pendingBundle))
            .andExpect(status().isOk)
            .andExpect(header().string("Cache-Control", "private, no-store"))
            .andExpect(header().exists("X-Content-SHA256"))
            .andReturn().response
        assertEquals("application/zip", bundleResponse.contentType)
        assertEquals(sha256(bundleResponse.contentAsByteArray), bundleResponse.getHeader("X-Content-SHA256"))

        val bundleEntries = zipEntries(bundleResponse.contentAsByteArray)
        val expectedBundleEntries = mutableSetOf("manifest.json", "protocol/signed-protocol.pdf", "SHA256SUMS")
        expectedBundleEntries += evidenceManifest.requirements.flatMap { requirement ->
            requirement.files.map { requireNotNull(it.bundlePath) }
        }
        assertEquals(expectedBundleEntries, bundleEntries.keys)
        val sums = bundleEntries.getValue("SHA256SUMS").toString(Charsets.UTF_8).lineSequence()
            .filter(String::isNotBlank)
            .associate { line -> line.substringBefore("  ") to line.substringAfter("  ") }
        assertEquals(bundleEntries.keys - "SHA256SUMS", sums.values.toSet())
        sums.forEach { (hash, name) -> assertEquals(hash, sha256(bundleEntries.getValue(name))) }

        val runtimeBundle = Path.of("build", "test-results", "uat", "decision-559-acceptance-bundle.zip")
        Files.write(runtimeBundle, bundleResponse.contentAsByteArray)
        Files.writeString(
            runtimeBundle.resolveSibling("decision-559-acceptance-bundle.sha256"),
            "${bundleResponse.getHeader("X-Content-SHA256")}  ${runtimeBundle.fileName}\n",
        )

        val repeatedPending = mockMvc.get("/api/v1/compliance/559/uat/runs/${run.id}/bundle")
            .andExpect { request { asyncStarted() } }
            .andReturn()
        val repeatedBundle = mockMvc.perform(asyncDispatch(repeatedPending))
            .andExpect(status().isOk)
            .andReturn().response
        assertEquals(bundleResponse.getHeader("X-Content-SHA256"), repeatedBundle.getHeader("X-Content-SHA256"))
        assertEquals(bundleResponse.contentAsByteArray.toList(), repeatedBundle.contentAsByteArray.toList())
    }

    @Test
    @WithMockUser(username = "uat-manifest-reader", authorities = ["UAT_READ"])
    fun `read vakolati deterministik manifestni yuklaydi ammo run yarata olmaydi`() {
        val guidance = requirementCatalog.list()
        assertEquals(27, guidance.size)
        assertEquals(Decision559UatService.REQUIRED_BANDS, guidance.map { it.band }.toSet())
        assertEquals(14, guidance.count { it.baselineStatus == "PARTIAL" })
        assertTrue(guidance.filter { it.baselineStatus == "PARTIAL" }.all { it.manualEvidence.isNotEmpty() })
        assertTrue(guidance.filter { it.baselineStatus == "AUTOMATED_PASS" }.all { it.manualEvidence.isEmpty() })
        assertEquals(43, guidance.sumOf { it.manualEvidence.size })
        assertEquals("IT va universitet rahbariyati", guidance.single { it.band == 8 }.owner)
        assertEquals(listOf("DEP-07"), guidance.single { it.band == 8 }.blockedBy)

        mockMvc.get("/api/v1/compliance/559/uat/requirements")
            .andExpect {
                status { isOk() }
                jsonPath("$.data.length()") { value(27) }
                jsonPath("$.data[0].id") { value("UAT-559-03") }
                jsonPath("$.data[1].band") { value(8) }
                jsonPath("$.data[1].baselineStatus") { value("PARTIAL") }
                jsonPath("$.data[1].manualEvidence.length()") { value(5) }
            }

        val manualPack = requirementCatalog.manualEvidencePack()
        val manualPackHtml = manualPack.bytes.toString(Charsets.UTF_8)
        assertEquals("decision-559-manual-evidence-intake-pack.html", manualPack.originalName)
        assertEquals(sha256(manualPack.bytes), manualPack.sha256)
        assertEquals(14, Regex("data-requirement-id=").findAll(manualPackHtml).count())
        assertEquals(43, Regex("<li>").findAll(manualPackHtml).count() - 4)
        assertTrue(manualPackHtml.contains("data-partial-count=\"14\""))

        mockMvc.get("/api/v1/compliance/559/uat/requirements/manual-evidence-pack")
            .andExpect {
                status { isOk() }
                content { contentTypeCompatibleWith(MediaType.TEXT_HTML) }
                header { string("Cache-Control", "private, no-store") }
                header { string("X-Content-SHA256", manualPack.sha256) }
            }

        val actor = userRepository.save(User(
            username = "uat-manifest-reader",
            password = "test",
            fullName = "Manifest Actor",
        ))
        val run = service.create(
            CreateDecision559UatRunRequest("559 manifest endpoint testi", Decision559UatService.SOURCE_SHA256),
            actor.id!!,
        )
        val response = mockMvc.get("/api/v1/compliance/559/uat/runs/${run.id}/manifest")
            .andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                header { string("Cache-Control", "private, no-store") }
                header { exists("X-Content-SHA256") }
                jsonPath("$.schemaVersion") { value(5) }
                jsonPath("$.decisionNumber") { value(559) }
                jsonPath("$.runId") { value(run.id) }
                jsonPath("$.source.sha256") { value(Decision559UatService.SOURCE_SHA256) }
                jsonPath("$.evidenceSetSha256") { value(sha256(byteArrayOf())) }
                jsonPath("$.manualEvidenceRequiredCount") { value(43) }
                jsonPath("$.manualEvidenceCoveredCount") { value(0) }
                jsonPath("$.manualEvidenceAcceptedCount") { value(0) }
            }
            .andReturn().response
        assertEquals(sha256(response.contentAsByteArray), response.getHeader("X-Content-SHA256"))

        mockMvc.get("/api/v1/compliance/559/uat/runs/${run.id}/bundle")
            .andExpect { status { isBadRequest() } }

        mockMvc.post("/api/v1/compliance/559/uat/runs") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"title":"Ruxsatsiz run","sourceSha256":"${Decision559UatService.SOURCE_SHA256}"}"""
        }.andExpect { status { isForbidden() } }
        mockMvc.post("/api/v1/compliance/559/uat/runs/${run.id}/manual-evidence-progress/UAT-559-08/0/coordination") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"assigneeName":"IT","dueDate":"${LocalDate.now().plusDays(1)}","note":"Ruxsatsiz koordinatsiya"}"""
        }.andExpect { status { isForbidden() } }
        mockMvc.post("/api/v1/compliance/559/uat/runs/${run.id}/manual-evidence-progress/coordination/bulk") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"dueDate":"${LocalDate.now().plusDays(1)}","note":"Ruxsatsiz bulk koordinatsiya"}"""
        }.andExpect { status { isForbidden() } }
    }

    @Test
    fun `migratsiyadan qolgan schema v2 run eski bitta faylli manifest kontraktini saqlaydi`() {
        val suffix = System.nanoTime()
        val author = userRepository.save(User(username = "uat-v2-author-$suffix", password = "test", fullName = "V2 muallif"))
        val reviewer = userRepository.save(User(username = "uat-v2-reviewer-$suffix", password = "test", fullName = "V2 reviewer"))
        val run = service.create(
            CreateDecision559UatRunRequest("Legacy schema v2 qabul runi", Decision559UatService.SOURCE_SHA256),
            author.id!!,
        )
        val legacy = requireNotNull(runRepository.findByIdAndDeletedFalse(run.id))
        legacy.manifestSchemaVersion = 2
        runRepository.save(legacy)

        for (band in Decision559UatService.REQUIRED_BANDS.sorted()) {
            val manual = band == 3
            val item = service.saveEvidence(
                run.id,
                band,
                "UAT-559-${band.toString().padStart(2, '0')}",
                if (manual) Decision559UatOutcome.MANUAL_PASS else Decision559UatOutcome.AUTOMATED_PASS,
                "Legacy qabul komissiyasi",
                "$band-band schema v2 backward compatibility dalili",
                "V2-REPORT-$band",
                if (manual) pdf("legacy-v2-band-3") else null,
                author.id!!,
            )
            service.reviewEvidence(
                item.id,
                ReviewDecision559UatEvidenceRequest(Decision559UatReviewStatus.ACCEPTED, "Legacy dalil tekshirildi"),
                reviewer.id!!,
            )
        }
        val legacyEvidenceSetSha256 = service.manifest(run.id).evidenceSetSha256
        service.uploadProtocol(
            run.id,
            "UAT-559/V2-LEGACY",
            LocalDate.now(),
            "Komissiya raisi; metodika vakili; axborot xavfsizligi vakili",
            legacyEvidenceSetSha256,
            pdf("legacy-v2-protocol"),
            author.id!!,
        )
        service.submit(run.id, author.id!!)
        service.approve(run.id, reviewer.id!!)

        val manifest = service.manifest(run.id)
        assertEquals(2, manifest.schemaVersion)
        assertTrue(manifest.readyToSubmit)
        assertEquals(64, manifest.evidenceSetSha256.length)
        val manualRequirement = manifest.requirements.single { it.band == 3 }
        assertNotNull(manualRequirement.file)
        assertEquals(emptyList<Any>(), manualRequirement.files)
        val bundle = bundleService.create(run.id, reviewer.id!!)
        try {
            val entries = zipEntries(Files.readAllBytes(bundle.path))
            assertTrue("evidence/UAT-559-03/evidence.pdf" in entries)
            assertEquals(bundle.sha256, sha256(Files.readAllBytes(bundle.path)))
        } finally {
            Files.deleteIfExists(bundle.path)
        }
    }

    @Test
    fun `rad etilgan legacy run dalili tuzatilsa schema v5ga o'tadi va partial reviewlar qayta ochiladi`() {
        val suffix = System.nanoTime()
        val author = userRepository.save(User(username = "uat-rework-author-$suffix", password = "test", fullName = "Qayta ish muallifi"))
        val reviewer = userRepository.save(User(username = "uat-rework-reviewer-$suffix", password = "test", fullName = "Qayta ish revieweri"))
        val run = service.create(
            CreateDecision559UatRunRequest("Legacy run qayta ishlash", Decision559UatService.SOURCE_SHA256),
            author.id!!,
        )
        val legacy = requireNotNull(runRepository.findByIdAndDeletedFalse(run.id))
        legacy.manifestSchemaVersion = 2
        runRepository.save(legacy)
        val evidence = service.saveEvidence(
            run.id, 3, "UAT-559-03", Decision559UatOutcome.MANUAL_PASS,
            "Qabul komissiyasi", "Legacy band dastlab mustaqil qabul qilindi", "LEGACY-3",
            pdf("legacy-before-rejection"), author.id!!,
        )
        service.reviewEvidence(
            evidence.id,
            ReviewDecision559UatEvidenceRequest(Decision559UatReviewStatus.ACCEPTED, "Dastlabki dalil qabul qilindi"),
            reviewer.id!!,
        )
        for (band in Decision559UatService.REQUIRED_BANDS.sorted().filterNot { it == 3 }) {
            val automated = service.saveEvidence(
                run.id, band, "UAT-559-${band.toString().padStart(2, '0')}", Decision559UatOutcome.AUTOMATED_PASS,
                "Avtomatik test egasi", "$band-band legacy regression hisoboti bilan tekshirildi", "LEGACY-TEST-$band",
                null, author.id!!,
            )
            service.reviewEvidence(
                automated.id,
                ReviewDecision559UatEvidenceRequest(Decision559UatReviewStatus.ACCEPTED, "Legacy test dalili qabul qilindi"),
                reviewer.id!!,
            )
        }
        service.uploadProtocol(
            run.id, "UAT-559/REWORK-OLD", LocalDate.now(),
            "Komissiya raisi; metodika vakili; axborot xavfsizligi vakili",
            service.manifest(run.id).evidenceSetSha256,
            pdf("obsolete-protocol"), author.id!!,
        )
        val inReview = requireNotNull(runRepository.findByIdAndDeletedFalse(run.id))
        inReview.status = Decision559UatRunStatus.IN_REVIEW
        runRepository.save(inReview)
        service.reject(
            run.id,
            RejectDecision559UatRunRequest("3-band daliliga qo'shimcha asl hujjat talab qilinadi"),
            reviewer.id!!,
        )

        val corrected = service.saveEvidence(
            run.id, 3, "UAT-559-03", Decision559UatOutcome.MANUAL_PASS,
            "Qabul komissiyasi", "Rad etilgan bandga qo'shimcha asl hujjat biriktirildi", "LEGACY-3-REWORK",
            null, author.id!!, listOf(png("additional-proof")),
        )
        assertEquals(Decision559UatReviewStatus.PENDING, corrected.reviewStatus)
        assertEquals(2, corrected.files.size)
        val detail = service.detail(run.id)
        assertEquals(Decision559UatRunStatus.DRAFT, detail.run.status)
        assertEquals(5, detail.run.manifestSchemaVersion)
        assertEquals(null, detail.run.protocolOriginalName)
        assertFalse(detail.run.readyToSubmit)
        assertThrows(IllegalArgumentException::class.java) { service.protocolFile(run.id) }
        assertEquals(5, service.manifest(run.id).schemaVersion)

        service.reviewEvidence(
            corrected.id,
            ReviewDecision559UatEvidenceRequest(Decision559UatReviewStatus.ACCEPTED, "Tuzatilgan dalil qabul qilindi"),
            reviewer.id!!,
        )
        val migratedDetail = service.detail(run.id)
        assertEquals(14, migratedDetail.run.blockingCount)
        assertEquals(14, migratedDetail.evidence.count {
            requirementCatalog.requirement(it.band, it.requirementId).baselineStatus == "PARTIAL" &&
                it.reviewStatus == Decision559UatReviewStatus.PENDING
        })
        assertThrows(IllegalArgumentException::class.java) {
            service.uploadProtocol(
                run.id, "UAT-559/REWORK-SECOND", LocalDate.now(),
                "Komissiya raisi; metodika vakili; axborot xavfsizligi vakili",
                service.manifest(run.id).evidenceSetSha256,
                pdf("second-obsolete-protocol"), author.id!!,
            )
        }
    }

    private fun pdf(label: String) = MockMultipartFile(
        "file",
        "$label.pdf",
        "application/pdf",
        "%PDF-1.4\n% $label\n%%EOF".toByteArray(),
    )

    private fun png(label: String) = MockMultipartFile(
        "files",
        "$label.png",
        "image/png",
        byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A) + label.toByteArray(),
    )

    private fun jpeg(label: String) = MockMultipartFile(
        "files",
        "$label.jpg",
        "image/jpeg",
        byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0xFF.toByte()) + label.toByteArray(),
    )

    private fun sha256(bytes: ByteArray): String =
        MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }

    private fun zipEntries(bytes: ByteArray): Map<String, ByteArray> = buildMap {
        ZipInputStream(ByteArrayInputStream(bytes)).use { zip ->
            while (true) {
                val entry = zip.nextEntry ?: break
                require(!entry.isDirectory)
                put(entry.name, zip.readAllBytes())
                zip.closeEntry()
            }
        }
    }
}
