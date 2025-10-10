#!/bin/bash
# =============================================================================
# Script: Setup JAVA_HOME for Meqenet Android Development (Git Bash)
# Description: Sets JAVA_HOME environment variable for the current session
# Required for: Android Gradle builds
# =============================================================================

echo "========================================"
echo "Setting up JAVA_HOME for Android builds"
echo "========================================"

# Set JAVA_HOME to the detected Eclipse Adoptium JDK 17 installation
# Convert Windows path to Unix-style path for Git Bash
export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-17.0.16.8-hotspot"

# Add Java bin directory to PATH
export PATH="$JAVA_HOME/bin:$PATH"

echo ""
echo "✅ JAVA_HOME set to: $JAVA_HOME"
echo "✅ Java Version:"
java -version

echo ""
echo "========================================"
echo "JAVA_HOME setup complete!"
echo "========================================"
echo ""
echo "To make this permanent, add to your ~/.bashrc or ~/.bash_profile:"
echo "  export JAVA_HOME=\"/c/Program Files/Eclipse Adoptium/jdk-17.0.16.8-hotspot\""
echo "  export PATH=\"\$JAVA_HOME/bin:\$PATH\""
echo ""
echo "For now, run this in your terminal:"
echo "  source scripts/setup-java-home.sh"
echo ""
echo "Then you can run: cd frontend/apps/app/android && ./gradlew --version"
echo ""

