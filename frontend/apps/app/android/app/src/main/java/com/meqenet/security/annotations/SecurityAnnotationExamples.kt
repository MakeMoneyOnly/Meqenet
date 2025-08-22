package com.meqenet.security.annotations

/**
 * Security Annotation Usage Examples
 * Demonstrates how to use Meqenet security annotations in practice
 */

import android.content.Context
import androidx.biometric.BiometricPrompt
import javax.crypto.Cipher
import javax.crypto.KeyGenerator

// ============================================================================
// EXAMPLE USAGE OF SECURITY ANNOTATIONS
// ============================================================================

class SecurityAnnotationExamples {

    // Example 1: Cryptographic Operations
    @EncryptionOperation(
        algorithm = "AES-256-GCM",
        keySize = 256,
        purpose = "Encrypt user payment data"
    )
    fun encryptPaymentData(data: ByteArray, key: ByteArray): ByteArray {
        // Implementation here
        return ByteArray(0)
    }

    @DecryptionOperation(
        algorithm = "AES-256-GCM",
        purpose = "Decrypt user payment data"
    )
    fun decryptPaymentData(encryptedData: ByteArray, key: ByteArray): ByteArray {
        // Implementation here
        return ByteArray(0)
    }

    @KeyGeneration(
        algorithm = "AES",
        keySize = 256,
        purpose = "Generate encryption key for user data"
    )
    fun generateEncryptionKey(): ByteArray {
        // Implementation here
        return ByteArray(0)
    }

    // Example 2: Data Handling
    @HandlesPII(
        type = "Personal Information",
        encryption = true,
        retention = "Until user deletion"
    )
    class UserProfile(
        @SensitiveData(reason = "Contains PII", exposureRisk = "high")
        val personalInfo: String,

        @SensitiveData(reason = "Financial data", exposureRisk = "critical")
        val accountBalance: Double
    )

    @HandlesFinancialData(
        type = "Transaction Data",
        sensitivity = "high",
        encryption = true
    )
    fun processTransaction(
        @UserInput(source = "user_form", validation = true, sanitization = true)
        amount: Double,

        @UserInput(source = "user_form", validation = true, sanitization = true)
        recipientId: String
    ) {
        // Implementation here
    }

    // Example 3: Network Operations
    @SecureNetworkOperation(
        protocol = "https",
        encryption = true,
        authentication = true
    )
    @RequiresAuthentication(method = "JWT", tokenType = "bearer")
    fun makeSecureApiCall(
        @UserInput(source = "user_input", validation = true)
        endpoint: String
    ) {
        // Implementation here
    }

    @SSLConfiguration(
        minVersion = "TLSv1.3",
        cipherSuites = ["TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256"]
    )
    fun configureSecureConnection() {
        // Implementation here
    }

    // Example 4: Storage Operations
    @SecureStorage(
        type = "Encrypted SharedPreferences",
        encryption = true,
        accessControl = true
    )
    fun storeSensitiveData(
        @SensitiveData(reason = "User credentials", exposureRisk = "critical")
        data: String
    ) {
        // Implementation here
    }

    @EncryptedStorageAccess(
        encryptionType = "AES-256",
        keyManagement = "Android Keystore"
    )
    fun retrieveSensitiveData(): String {
        // Implementation here
        return ""
    }

    // Example 5: Authentication
    @AuthenticationMethod(
        type = "Biometric + PIN",
        strength = "high",
        factors = 2
    )
    @BiometricAuthentication(
        type = "Fingerprint/Face",
        fallback = true,
        strength = "strong"
    )
    fun authenticateUser(context: Context): Boolean {
        // Implementation here
        return false
    }

    @AuthorizationCheck(
        resource = "user_account",
        action = "transfer_money",
        scope = "user"
    )
    fun authorizeMoneyTransfer(
        @UserInput(source = "user_input", validation = true)
        amount: Double
    ): Boolean {
        // Implementation here
        return false
    }

    // Example 6: Input Validation
    @InputValidation(
        type = "Financial Amount",
        sanitization = true,
        boundsCheck = true
    )
    fun validateTransactionAmount(
        @UserInput(source = "user_input", validation = true, sanitization = true)
        amount: String
    ): Double {
        // Implementation here
        return 0.0
    }

    // Example 7: Audit & Compliance
    @RequiresAuditLog(
        event = "Money Transfer",
        sensitivity = "high",
        retention = "7years"
    )
    @RegulatoryCompliance(
        regulation = "PSD2",
        requirement = "Strong Customer Authentication",
        auditFrequency = "quarterly"
    )
    fun transferMoney(
        @UserInput(source = "user_form", validation = true)
        amount: Double,

        @UserInput(source = "user_form", validation = true)
        recipientId: String
    ) {
        // Implementation here
    }

    // Example 8: Security Testing
    @SecurityTestRequired(
        testType = "Penetration Testing",
        threatModel = ["Injection", "Authentication Bypass", "Data Exposure"],
        priority = "high"
    )
    fun processHighRiskOperation() {
        // Implementation here
    }

    // Example 9: Runtime Security
    @RequiresSecureContext(
        reason = "Handles sensitive cryptographic operations",
        minimumApiLevel = 23
    )
    @RuntimeSecurityCheck(
        checkType = "Root Detection",
        failureMode = "exception",
        logging = true
    )
    fun performSecureOperation() {
        // Implementation here
    }

    // Example 10: Security Bypass (requires review)
    @SecurityBypass(
        reason = "Legacy API compatibility",
        approvedBy = "Security Team",
        reviewDate = "2024-12-31",
        riskLevel = "low"
    )
    fun legacySecureOperation() {
        // Implementation here
    }

    @SecurityBestPractice(
        practice = "Defense in Depth",
        benefit = "Multiple security layers",
        reference = "OWASP Top 10"
    )
    fun secureImplementation() {
        // Implementation here
    }
}

// ============================================================================
// ANNOTATION PROCESSOR EXAMPLE
// ============================================================================

/**
 * Example of how to create annotation processors for compile-time security checks
 */
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.SOURCE)
annotation class SecurityReview(
    val reviewer: String = "",
    val date: String = "",
    val status: String = "pending"
)

@SecurityReview(
    reviewer = "Security Team",
    date = "2024-01-15",
    status = "approved"
)
class ReviewedSecurityClass {
    // This class has been reviewed for security compliance
}
