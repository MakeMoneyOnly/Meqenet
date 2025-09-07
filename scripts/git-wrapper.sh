#!/bin/bash

# Meqenet.et Git Command Wrapper
# Enterprise-Grade Git Security Gate
# Prevents dangerous operations that bypass security controls

# Exit immediately if a command exits with a non-zero status
set -e

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDATOR_SCRIPT="$SCRIPT_DIR/git-command-validator.js"

# Function to check if Node.js is available
check_nodejs() {
  if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is required for git security validation"
    echo "💡 Please install Node.js or contact your system administrator"
    echo "🏛️ Contact: dev@meqenet.et"
    exit 1
  fi
}

# Function to validate git command
validate_git_command() {
  local args="$*"

  # Check for blocked flags
  if echo "$args" | grep -q -E "(^|\s)--no-verify(\s|$)" ||
     echo "$args" | grep -q -E "(^|\s)--no-verify-signatures(\s|$)" ||
     echo "$args" | grep -q -E "(^|\s)--allow-empty(\s|$)" ||
     echo "$args" | grep -q -E "(^|\s)--force-with-lease(\s|$)" ||
     echo "$args" | grep -q -E "(^|\s)--force(\s|$)"; then
    echo "🚨 SECURITY VIOLATION: --no-verify or dangerous flag detected!"
    echo ""
    echo "❌ FORBIDDEN: Using bypass flags violates enterprise security controls"
    echo "🔒 This breaks Ethiopian FinTech regulatory compliance requirements"
    echo ""
    echo "📋 BLOCKED FLAGS:"
    echo "   • --no-verify"
    echo "   • --no-verify-signatures"
    echo "   • --allow-empty"
    echo "   • --force-with-lease"
    echo "   • --force"
    echo ""
    echo "✅ REQUIRED: All git operations must pass enterprise security validation"
    echo "🏛️ Contact security team: security@meqenet.et"
    echo ""
    echo "🇪🇹 Ethiopian FinTech Security Compliance Enforced"
    exit 1
  fi

  # Check for destructive command patterns
  if echo "$args" | grep -q -E "reset.*--hard" ||
     echo "$args" | grep -q -E "push.*--force" ||
     echo "$args" | grep -q -E "push.*-f" ||
     echo "$args" | grep -q -E "clean.*-fd" ||
     echo "$args" | grep -q -E "clean.*--force"; then
    echo "🚨 DESTRUCTIVE OPERATION DETECTED!"
    echo ""
    echo "❌ FORBIDDEN: Command permanently destroys work and violates audit requirements"
    echo "💀 This breaks enterprise development standards"
    echo ""
    echo "📋 BLOCKED PATTERNS:"
    echo "   • git reset --hard"
    echo "   • git push --force"
    echo "   • git clean -fd"
    echo "   • git clean --force"
    echo ""
    echo "✅ REQUIRED: Use safe alternatives that preserve work history"
    echo "🔄 Safe alternatives: git reset --soft, git stash, git branch"
    echo "🏛️ Contact development team for destructive operations: dev@meqenet.et"
    echo ""
    echo "🇪🇹 Ethiopian FinTech Development Standards Enforced"
    exit 1
  fi
}

# Main execution
main() {
  local git_command="$*"

  # Check if Node.js is available
  check_nodejs

  # Validate the git command
  validate_git_command "$git_command"

  # Execute the validated git command
  exec git $git_command
}

# Execute main function with all arguments
main "$@"
