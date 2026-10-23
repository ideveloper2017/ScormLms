package uz.scorm.lms.app.config

import kotlin.test.Test
import kotlin.test.assertFailsWith

class ProductionSecretsGuardTest {

    private val strongSecret = "a".repeat(MIN_HMAC_SECRET_BYTES)

    @Test
    fun `strong random secrets are accepted`() {
        ProductionSecretsGuard(strongSecret, strongSecret + "b", "Str0ng-Db-Passw0rd")
    }

    @Test
    fun `development jwt fallback is rejected`() {
        assertFailsWith<IllegalArgumentException> {
            requireProductionSecret(
                "JWT_SECRET",
                "dev-only-secret-do-not-use-in-production-0123456789abcdefghijklmnop",
                MIN_HMAC_SECRET_BYTES,
            )
        }
    }

    @Test
    fun `env example placeholder is rejected`() {
        assertFailsWith<IllegalArgumentException> {
            requireProductionSecret(
                "JWT_SECRET",
                "CHANGE_ME_WITH_A_RANDOM_SECRET_OF_AT_LEAST_64_BYTES_NEVER_COMMIT_REAL_VALUE",
                MIN_HMAC_SECRET_BYTES,
            )
        }
    }

    @Test
    fun `short secrets are rejected`() {
        assertFailsWith<IllegalArgumentException> {
            requireProductionSecret("JWT_SECRET", "a".repeat(MIN_HMAC_SECRET_BYTES - 1), MIN_HMAC_SECRET_BYTES)
        }
        assertFailsWith<IllegalArgumentException> {
            ProductionSecretsGuard(strongSecret, strongSecret, "short")
        }
    }
}
