# Meqenet Android Application - Developer Guide

## Prerequisites

### Required Software

- **Node.js**: Version 20.x (specified in project)
- **pnpm**: Package manager for monorepo
- **Java JDK**: Version 17 (Temurin/AdoptOpenJDK recommended)
- **Android SDK**: API Level 35, Build Tools 36.0.0
- **Git Bash**: For running scripts on Windows

### Java Setup (Windows)

#### Option 1: Quick Setup (Current Session)

Run one of these scripts from the project root:

```bash
# For Git Bash
source scripts/setup-java-home.sh

# For Command Prompt / PowerShell
scripts\setup-java-home.bat
```

#### Option 2: Permanent Setup (Recommended)

1. Open **System Properties** → **Advanced** → **Environment Variables**
2. Under "System variables", click **"New"**
3. Set:
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot`
4. Edit the `Path` variable and add: `%JAVA_HOME%\bin`
5. Click **OK** and **restart your terminal**

#### Verify Java Installation

```bash
echo $JAVA_HOME
# Expected: C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot (or similar)

java -version
# Expected: openjdk version "17.0.16" 2025-07-15
```

## Project Structure

```
android/
├── app/                          # Main Android application module
│   ├── build.gradle             # App-level Gradle configuration
│   ├── src/
│   │   └── main/
│   │       ├── java/com/app/    # Kotlin/Java source files
│   │       ├── res/             # Android resources
│   │       └── AndroidManifest.xml
│   └── proguard-rules.pro       # ProGuard configuration
├── gradle/                       # Gradle configuration
│   ├── wrapper/                 # Gradle wrapper files
│   ├── dependency-locking.gradle
│   └── enterprise-repositories.gradle
├── build.gradle                 # Project-level Gradle configuration
├── settings.gradle              # Gradle settings (plugin resolution)
└── gradle.properties            # Gradle properties
```

## Building the Android App

### 1. Install Dependencies

From the project root:

```bash
pnpm install
```

This installs all required packages including:
- `react-native@0.74.5`
- `@react-native/gradle-plugin@0.74.87`
- `@react-native-community/cli-platform-android@13.6.9`

### 2. Navigate to Android Directory

```bash
cd frontend/apps/app/android
```

### 3. Run Gradle Commands

#### Check Gradle Version
```bash
./gradlew --version
```

#### Clean Build
```bash
./gradlew clean
```

#### Build Debug APK
```bash
./gradlew assembleDebug
```

#### Build Release APK (requires signing)
```bash
./gradlew assembleRelease
```

#### Check Dependencies
```bash
./gradlew dependencies
```

#### Run Tests
```bash
./gradlew test
```

## React Native 0.74 Gradle Configuration

### Plugin Resolution

This project uses React Native 0.74's **composite build** pattern. The React Native Gradle plugin is included from `node_modules` rather than Maven repositories.

**Key Configuration in `settings.gradle`:**
```gradle
// Includes @react-native/gradle-plugin from node_modules
def gradlePluginPath = new File([
    "../../node_modules/@react-native/gradle-plugin",
    "../../../node_modules/@react-native/gradle-plugin",
    "../../../../node_modules/@react-native/gradle-plugin"
].find { new File(rootDir, it).exists() })

if (gradlePluginPath.exists()) {
    includeBuild(gradlePluginPath)
}
```

**Plugin Application in `app/build.gradle`:**
```gradle
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"
```

### Monorepo Path Resolution

The configuration automatically detects the correct `node_modules` path for:
- **Local development**: `../../node_modules`
- **Workspace root**: `../../../node_modules`
- **CI environment**: `../../../../node_modules`

## Common Issues & Troubleshooting

### 1. "JAVA_HOME is set to an invalid directory"

**Solution:** Follow the Java Setup instructions above.

### 2. "Plugin com.facebook.react was not found"

**Causes:**
- Missing `@react-native/gradle-plugin` dependency
- Incorrect path resolution in `settings.gradle`

**Solutions:**
```bash
# Reinstall dependencies
cd ../../../  # Navigate to project root
pnpm install

# Verify the plugin exists
ls -la node_modules/@react-native/gradle-plugin
```

### 3. "React Native Android directory not found"

**Solution:**
```bash
cd ../../../  # Navigate to project root
pnpm install react-native --ignore-scripts -w
```

### 4. Gradle Build Fails with "SDK location not found"

**Solution:** Create `local.properties` file:
```bash
echo "sdk.dir=C:\\Users\\<YourUsername>\\AppData\\Local\\Android\\Sdk" > local.properties
```

Replace `<YourUsername>` with your actual Windows username.

### 5. Dependency Resolution Failures

**Solution:**
```bash
# Clear Gradle caches
./gradlew clean
rm -rf ~/.gradle/caches/

# Rebuild
./gradlew assembleDebug
```

## Security & Compliance

### ProGuard Configuration

Release builds use ProGuard for code obfuscation and optimization:
- Configuration: `app/proguard-rules.pro`
- Enabled in: `app/build.gradle` → `buildTypes.release.minifyEnabled = true`

### Dependency Scanning

The CI pipeline runs OWASP Dependency Check on all Android dependencies:
- Workflow: `.github/workflows/ci.yml` → "Android Dependency Vulnerability Scan"
- Reports: Uploaded as CI artifacts

### Code Signing

- **Debug builds**: Use `app/debug.keystore` (included in repo)
- **Release builds**: Require production keystore (not in repo)

**To generate a production keystore:**
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore meqenet-release.keystore \
  -alias meqenet \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

## Development Workflow

### 1. Start Metro Bundler

From project root:
```bash
cd frontend/apps/app
npx react-native start
```

### 2. Run on Android Device/Emulator

In a separate terminal:
```bash
cd frontend/apps/app
npx react-native run-android
```

### 3. Enable Hot Reload

Shake the device or press `Ctrl+M` (emulator) to open the dev menu:
- Enable **Fast Refresh**
- Enable **Hot Reloading**

## CI/CD Integration

### GitHub Actions Workflow

The Android app is built and tested in CI via `.github/workflows/ci.yml`:

**Steps:**
1. Install Node.js and pnpm
2. Install dependencies (`pnpm install`)
3. Set up Java 17
4. Set up Android SDK (API 35)
5. Cache Gradle dependencies
6. Run Gradle builds and dependency checks
7. Run OWASP vulnerability scans

### Artifacts Generated

- **Dependency reports**: `dependency-report.txt`
- **OWASP reports**: Multiple formats (HTML, JSON, XML)
- **Build outputs**: APK files (in CI artifacts)

## References

- [React Native 0.74 Documentation](https://reactnative.dev/docs/0.74/)
- [React Native New Architecture](https://reactnative.dev/docs/new-architecture-app-setup)
- [Gradle Documentation](https://docs.gradle.org/current/userguide/userguide.html)
- [Android Developer Guide](https://developer.android.com/guide)
- Project Personas: `docs/Stage 2 -Development/14-Roles.md`
  - **Persona 2**: Senior Mobile Developer (React Native Focus)
  - **Persona 5**: FinTech DevOps Engineer

## Support

For issues or questions:
1. Check this README's troubleshooting section
2. Review the fix documentation: `docs/fixes/android-ci-gradle-plugin-fix.md`
3. Contact the Mobile Development team

---

**Last Updated:** 2025-01-10  
**React Native Version:** 0.74.5  
**Gradle Version:** 8.13  
**Android Target SDK:** 35

