package uz.scorm.lms.app.v1.twofactor.service

import org.apache.commons.codec.binary.Base32
import org.apache.commons.codec.binary.Hex
import org.springframework.stereotype.Service
import java.net.URLEncoder
import java.nio.ByteBuffer
import java.nio.charset.StandardCharsets
import java.security.SecureRandom
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

@Service
class TwoFactorService {
    private val random = SecureRandom()

    fun generateSecret(bytes: Int = 20): String {
        val buffer = ByteArray(bytes)
        random.nextBytes(buffer)
        val base32 = Base32()
        return base32.encodeToString(buffer).replace("=", "")
    }

    fun otpauthUri(issuer: String, accountName: String, secret: String): String {
        val iss = URLEncoder.encode(issuer, StandardCharsets.UTF_8)
        val acc = URLEncoder.encode(accountName, StandardCharsets.UTF_8)
        return "otpauth://totp/${'$'}iss:${'$'}acc?secret=${'$'}secret&issuer=${'$'}iss&digits=6&period=30"
    }

    fun verifyCode(secret: String, code: Int, window: Int = 1, timeStepSeconds: Long = 30L): Boolean {
        val base32 = Base32()
        val key = base32.decode(secret)
        val timeIndex = System.currentTimeMillis() / 1000L / timeStepSeconds
        for (i in -window..window) {
            val hash = hotp(key, timeIndex + i)
            val otp = truncate(hash) % 1_000_000
            if (otp == code) return true
        }
        return false
    }

    private fun hotp(key: ByteArray, counter: Long): ByteArray {
        val mac = Mac.getInstance("HmacSHA1")
        mac.init(SecretKeySpec(key, "HmacSHA1"))
        val data = ByteBuffer.allocate(8).putLong(counter).array()
        return mac.doFinal(data)
    }

    private fun truncate(hash: ByteArray): Int {
        val offset = hash[hash.size - 1].toInt() and 0x0F
        return ((hash[offset].toInt() and 0x7f) shl 24) or
                ((hash[offset + 1].toInt() and 0xff) shl 16) or
                ((hash[offset + 2].toInt() and 0xff) shl 8) or
                (hash[offset + 3].toInt() and 0xff)
    }
}
