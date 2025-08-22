# Meqenet Android ProGuard Security Rules - FinTech Grade
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ============================================================================
# SECURITY ENHANCEMENTS FOR FINTECH APPLICATION
# ============================================================================

# Enable obfuscation to prevent reverse engineering
-obfuscationdictionary proguard-dictionary.txt
-classobfuscationdictionary proguard-dictionary.txt
-packageobfuscationdictionary proguard-dictionary.txt

# Remove debug information to prevent sensitive data exposure
-keepattributes !SourceFile, !LineNumberTable, !LocalVariableTable, !LocalVariableTypeTable
-renamesourcefileattribute SourceFile

# ============================================================================
# CRYPTOGRAPHIC SECURITY
# ============================================================================

# Keep cryptographic classes and methods
-keep class javax.crypto.** { *; }
-keep class java.security.** { *; }
-keep class com.me.qenet.security.** { *; }
-keep class com.me.qenet.crypto.** { *; }

# Preserve cryptographic algorithms
-keepclasseswithmembers class * {
    public <init>(javax.crypto.Cipher);
    public <init>(javax.crypto.KeyGenerator);
    public <init>(java.security.KeyPairGenerator);
}

# ============================================================================
# SENSITIVE DATA PROTECTION
# ============================================================================

# Keep sensitive data handling classes
-keep class com.me.qenet.data.** { *; }
-keep class com.me.qenet.model.** { *; }
-keep class com.me.qenet.api.** { *; }

# Protect sensitive methods from obfuscation
-keepclassmembers class com.me.qenet.** {
    private <fields>;
    private <methods>;
}

# ============================================================================
# NETWORK SECURITY
# ============================================================================

# Keep network and API related classes
-keep class com.me.qenet.network.** { *; }
-keep class com.me.qenet.api.** { *; }
-keep class okhttp3.** { *; }
-keep class retrofit2.** { *; }

# Preserve SSL/TLS configuration
-keep class javax.net.ssl.** { *; }
-keep class org.conscrypt.** { *; }

# ============================================================================
# BIOMETRIC & AUTHENTICATION
# ============================================================================

# Keep biometric authentication classes
-keep class androidx.biometric.** { *; }
-keep class android.hardware.biometrics.** { *; }
-keep class com.me.qenet.auth.** { *; }
-keep class com.me.qenet.biometric.** { *; }

# ============================================================================
# PAYMENT & FINANCIAL OPERATIONS
# ============================================================================

# Keep payment processing classes
-keep class com.me.qenet.payment.** { *; }
-keep class com.me.qenet.transaction.** { *; }
-keep class com.me.qenet.fintech.** { *; }

# Preserve sensitive financial data structures
-keep class com.me.qenet.model.Payment { *; }
-keep class com.me.qenet.model.Transaction { *; }
-keep class com.me.qenet.model.Account { *; }

# ============================================================================
# ENCRYPTION & SECURITY UTILITIES
# ============================================================================

# Keep encryption utility classes
-keep class com.me.qenet.utils.EncryptionUtil { *; }
-keep class com.me.qenet.utils.SecurityUtil { *; }
-keep class com.me.qenet.utils.FaydaEncryptionUtil { *; }

# Preserve cryptographic method signatures
-keepclassmembers class com.me.qenet.utils.** {
    public static *** encrypt(...);
    public static *** decrypt(...);
    public static *** hash(...);
    public static *** sign(...);
    public static *** verify(...);
}

# ============================================================================
# ANTI-REVERSE ENGINEERING
# ============================================================================

# Remove logging to prevent sensitive data exposure in logs
-assumenosideeffects class android.util.Log {
    public static *** v(...);
    public static *** d(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
    public static *** wtf(...);
}

# Remove debug-only code
-assumenosideeffects class java.lang.StringBuilder {
    public java.lang.StringBuilder append(java.lang.String);
}

# ============================================================================
# MEMORY & SECURITY HARDENING
# ============================================================================

# Optimize for security over performance
-optimizationpasses 5
-allowaccessmodification

# Remove unused code to reduce attack surface
-dontskipnonpubliclibraryclasses
-dontskipnonpubliclibraryclassmembers

# ============================================================================
# EXCEPTION HANDLING
# ============================================================================

# Keep exception handling classes
-keep class com.me.qenet.exception.** { *; }
-keep class com.me.qenet.error.** { *; }

# Preserve stack traces for debugging (remove in production)
-keepattributes Exceptions, InnerClasses, Signature, Deprecated, SourceFile, LineNumberTable, *Annotation*, EnclosingMethod

# ============================================================================
# REACT NATIVE INTEGRATION
# ============================================================================

# Keep React Native specific classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep bridge communication classes
-keep class com.me.qenet.bridge.** { *; }
-keep class com.me.qenet.native.** { *; }

# ============================================================================
# DEBUGGING & MONITORING (DISABLED IN PRODUCTION)
# ============================================================================

# Remove debug information (uncomment for production builds)
# -keepattributes !SourceFile, !LineNumberTable

# Add any project specific keep options here:
