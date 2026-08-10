package uz.scorm.lms.app.v1.classifier.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.BaseEntity

@Entity
@Table(name = "country_classifiers", uniqueConstraints = [UniqueConstraint(name = "uk_country_classifier_code", columnNames = ["code"])])
class CountryClassifier(
    @Column(nullable = false, length = 2) var code: String,
    @Column(name = "name_uz", nullable = false, length = 150) var nameUz: String,
    @Column(nullable = false) var active: Boolean = true,
    @Column(name = "sort_order", nullable = false) var sortOrder: Int = 0,
    @Column(name = "managed_source", length = 30) var managedSource: String? = null,
    @Column(name = "source_code", length = 30) var sourceCode: String? = null,
    @Column(name = "source_version", length = 150) var sourceVersion: String? = null,
) : BaseEntity()

@Entity
@Table(name = "region_classifiers", uniqueConstraints = [UniqueConstraint(name = "uk_region_classifier_code", columnNames = ["code"])])
class RegionClassifier(
    @Column(nullable = false, length = 20) var code: String,
    @Column(name = "name_uz", nullable = false, length = 150) var nameUz: String,
    @Column(nullable = false) var active: Boolean = true,
    @Column(name = "sort_order", nullable = false) var sortOrder: Int = 0,
    @Column(name = "managed_source", length = 30) var managedSource: String? = null,
    @Column(name = "source_code", length = 30) var sourceCode: String? = null,
    @Column(name = "source_version", length = 150) var sourceVersion: String? = null,
) : BaseEntity()

@Entity
@Table(name = "district_classifiers", uniqueConstraints = [UniqueConstraint(name = "uk_district_classifier_code", columnNames = ["code"])])
class DistrictClassifier(
    @Column(nullable = false, length = 30) var code: String,
    @Column(name = "name_uz", nullable = false, length = 150) var nameUz: String,
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "region_id", nullable = false) var region: RegionClassifier,
    @Column(nullable = false) var active: Boolean = true,
    @Column(name = "sort_order", nullable = false) var sortOrder: Int = 0,
    @Column(name = "managed_source", length = 30) var managedSource: String? = null,
    @Column(name = "source_code", length = 30) var sourceCode: String? = null,
    @Column(name = "source_version", length = 150) var sourceVersion: String? = null,
) : BaseEntity()
