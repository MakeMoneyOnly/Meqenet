@echo off
REM =============================================================================
REM Script: Setup JAVA_HOME for Meqenet Android Development
REM Description: Sets JAVA_HOME environment variable for the current session
REM Required for: Android Gradle builds
REM =============================================================================

echo ========================================
echo Setting up JAVA_HOME for Android builds
echo ========================================

REM Set JAVA_HOME to the detected Eclipse Adoptium JDK 17 installation
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot

REM Add Java bin directory to PATH
set PATH=%JAVA_HOME%\bin;%PATH%

echo.
echo ✅ JAVA_HOME set to: %JAVA_HOME%
echo ✅ Java Version:
java -version

echo.
echo ========================================
echo JAVA_HOME setup complete!
echo ========================================
echo.
echo To make this permanent, add JAVA_HOME to your Windows environment variables:
echo 1. Open System Properties ^> Advanced ^> Environment Variables
echo 2. Under "System variables", click "New"
echo 3. Variable name: JAVA_HOME
echo 4. Variable value: C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot
echo 5. Click OK and restart your terminal
echo.
echo For now, this script has set JAVA_HOME for your current terminal session.
echo You can now run: cd frontend\apps\app\android ^&^& gradlew --version
echo.

