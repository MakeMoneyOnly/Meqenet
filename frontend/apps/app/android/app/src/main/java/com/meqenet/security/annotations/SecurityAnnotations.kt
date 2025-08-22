package com.meqenet.security.annotations

/**
 * Meqenet Android Security Annotations
 * Comprehensive security annotations for fintech-grade Android applications
 *
 * These annotations help identify and enforce security practices throughout the codebase,
 * enabling static analysis tools and code reviews to verify security compliance.
 */

import androidx.annotation.RequiresPermission
import kotlin.annotation.AnnotationRetention.RUNTIME
import kotlin.annotation.AnnotationTarget.*

// ============================================================================
// CRYPTOGRAPHIC SECURITY ANNOTATIONS
// ============================================================================

/**
 * Marks methods that perform encryption operations
 * Use this annotation to identify and track encryption methods for security audits
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class EncryptionOperation(
    val algorithm: String = "",
    val keySize: Int = 0,
    val purpose: String = ""
)

/**
 * Marks methods that perform decryption operations
 * Use this annotation to identify and track decryption methods for security audits
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class DecryptionOperation(
    val algorithm: String = "",
    val purpose: String = ""
)

/**
 * Marks methods that generate cryptographic keys
 * Use this annotation to identify key generation methods for security validation
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class KeyGeneration(
    val algorithm: String = "",
    val keySize: Int = 0,
    val purpose: String = ""
)

/**
 * Marks methods that handle sensitive cryptographic material
 * Use this annotation to identify methods that need special protection
 */
@Target(FUNCTION, CLASS, PROPERTY)
@Retention(RUNTIME)
annotation class SensitiveCryptoMaterial(
    val type: String = "key",
    val storage: String = "memory",
    val cleanup: Boolean = true
)

// ============================================================================
// DATA SECURITY ANNOTATIONS
// ============================================================================

/**
 * Marks classes or methods that handle personally identifiable information (PII)
 * Use this annotation to identify PII handling for compliance and security audits
 */
@Target(CLASS, FUNCTION, PROPERTY)
@Retention(RUNTIME)
annotation class HandlesPII(
    val type: String = "",
    val encryption: Boolean = true,
    val retention: String = "temporary"
)

/**
 * Marks methods that handle financial data
 * Use this annotation to identify financial data processing for security validation
 */
@Target(FUNCTION, CLASS, PROPERTY)
@Retention(RUNTIME)
annotation class HandlesFinancialData(
    val type: String = "",
    val sensitivity: String = "high",
    val encryption: Boolean = true
)

/**
 * Marks methods that handle payment information
 * Use this annotation to identify payment processing for PCI compliance
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class HandlesPaymentData(
    val type: String = "",
    val pciScope: String = "internal"
)

/**
 * Marks data that should never be logged or exposed
 * Use this annotation to prevent sensitive data from appearing in logs
 */
@Target(PROPERTY, VALUE_PARAMETER, LOCAL_VARIABLE)
@Retention(RUNTIME)
annotation class SensitiveData(
    val reason: String = "",
    val exposureRisk: String = "high"
)

// ============================================================================
// NETWORK SECURITY ANNOTATIONS
// ============================================================================

/**
 * Marks network operations that transmit sensitive data
 * Use this annotation to identify secure communication requirements
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class SecureNetworkOperation(
    val protocol: String = "https",
    val encryption: Boolean = true,
    val authentication: Boolean = true
)

/**
 * Marks methods that handle SSL/TLS configuration
 * Use this annotation to identify SSL configuration for security validation
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class SSLConfiguration(
    val minVersion: String = "TLSv1.2",
    val cipherSuites: Array<String> = []
)

/**
 * Marks API endpoints or methods that require authentication
 * Use this annotation to identify authentication requirements
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class RequiresAuthentication(
    val method: String = "",
    val tokenType: String = "bearer"
)

// ============================================================================
// STORAGE SECURITY ANNOTATIONS
// ============================================================================

/**
 * Marks methods that store sensitive data
 * Use this annotation to identify secure storage requirements
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class SecureStorage(
    val type: String = "",
    val encryption: Boolean = true,
    val accessControl: Boolean = true
)

/**
 * Marks methods that access encrypted storage
 * Use this annotation to identify encrypted storage access patterns
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class EncryptedStorageAccess(
    val encryptionType: String = "AES",
    val keyManagement: String = "hardware"
)

// ============================================================================
// AUTHENTICATION & AUTHORIZATION ANNOTATIONS
// ============================================================================

/**
 * Marks methods that perform authentication
 * Use this annotation to identify authentication methods for security validation
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class AuthenticationMethod(
    val type: String = "",
    val strength: String = "high",
    val factors: Int = 1
)

/**
 * Marks methods that perform authorization checks
 * Use this annotation to identify authorization methods for security validation
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class AuthorizationCheck(
    val resource: String = "",
    val action: String = "",
    val scope: String = "user"
)

/**
 * Marks methods that handle biometric authentication
 * Use this annotation to identify biometric methods for security validation
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class BiometricAuthentication(
    val type: String = "",
    val fallback: Boolean = true,
    val strength: String = "strong"
)

// ============================================================================
// INPUT VALIDATION ANNOTATIONS
// ============================================================================

/**
 * Marks methods that perform input validation
 * Use this annotation to identify validation methods for security verification
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class InputValidation(
    val type: String = "",
    val sanitization: Boolean = true,
    val boundsCheck: Boolean = true
)

/**
 * Marks methods that handle user input
 * Use this annotation to identify input handling for security validation
 */
@Target(FUNCTION, CLASS, VALUE_PARAMETER)
@Retention(RUNTIME)
annotation class UserInput(
    val source: String = "",
    val validation: Boolean = true,
    val sanitization: Boolean = true
)

// ============================================================================
// AUDIT & COMPLIANCE ANNOTATIONS
// ============================================================================

/**
 * Marks methods that require audit logging
 * Use this annotation to identify methods that need audit trails
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class RequiresAuditLog(
    val event: String = "",
    val sensitivity: String = "medium",
    val retention: String = "7years"
)

/**
 * Marks methods that are subject to regulatory compliance
 * Use this annotation to identify compliance requirements
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class RegulatoryCompliance(
    val regulation: String = "",
    val requirement: String = "",
    val auditFrequency: String = "annual"
)

// ============================================================================
// SECURITY TESTING ANNOTATIONS
// ============================================================================

/**
 * Marks methods that require security testing
 * Use this annotation to identify methods for security test coverage
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class SecurityTestRequired(
    val testType: String = "",
    val threatModel: Array<String> = [],
    val priority: String = "medium"
)

/**
 * Marks methods that have security vulnerabilities
 * Use this annotation to track known security issues
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class SecurityVulnerability(
    val cve: String = "",
    val severity: String = "",
    val mitigation: String = "",
    val status: String = "open"
)

// ============================================================================
// RUNTIME SECURITY ANNOTATIONS
// ============================================================================

/**
 * Marks methods that should be executed in a secure context
 * Use this annotation to identify methods requiring secure execution environment
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class RequiresSecureContext(
    val reason: String = "",
    val minimumApiLevel: Int = 23
)

/**
 * Marks methods that perform security checks at runtime
 * Use this annotation to identify runtime security validation
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class RuntimeSecurityCheck(
    val checkType: String = "",
    val failureMode: String = "exception",
    val logging: Boolean = true
)

// ============================================================================
// UTILITY ANNOTATIONS FOR CODE ANALYSIS
// ============================================================================

/**
 * Marks code that temporarily bypasses security checks
 * Use this annotation to track security bypasses that need review
 */
@Target(FUNCTION, CLASS, PROPERTY)
@Retention(RUNTIME)
annotation class SecurityBypass(
    val reason: String = "",
    val approvedBy: String = "",
    val reviewDate: String = "",
    val riskLevel: String = "medium"
)

/**
 * Marks methods that implement security best practices
 * Use this annotation to identify security-positive implementations
 */
@Target(FUNCTION, CLASS)
@Retention(RUNTIME)
annotation class SecurityBestPractice(
    val practice: String = "",
    val benefit: String = "",
    val reference: String = ""
)
