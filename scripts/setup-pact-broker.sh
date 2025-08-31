#!/bin/bash

# Meqenet.et - Pact Broker Setup Script
# Sets up Pact Broker for contract testing infrastructure

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*" >&2
}

success() {
    echo -e "${GREEN}✅ $*" >&2
}

error() {
    echo -e "${RED}❌ $*" >&2
}

warn() {
    echo -e "${YELLOW}⚠️  $*" >&2
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running or not accessible"
        exit 1
    fi
    success "Docker is running"
}

# Start Pact Broker
start_pact_broker() {
    log "Starting Pact Broker..."

    cd "$PROJECT_ROOT"

    # Start Pact Broker services
    docker-compose -f docker-compose.pact.yml up -d

    # Wait for Pact Broker to be ready
    log "Waiting for Pact Broker to be ready..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://localhost:9292/diagnostic/status/heartbeat" >/dev/null 2>&1; then
            success "Pact Broker is ready!"
            break
        fi

        log "Attempt $attempt/$max_attempts: Pact Broker not ready yet..."
        sleep 10
        ((attempt++))
    done

    if [ $attempt -gt $max_attempts ]; then
        error "Pact Broker failed to start within timeout"
        exit 1
    fi
}

# Create Pact Broker configuration
create_pact_config() {
    log "Creating Pact Broker configuration..."

    # Create .pact directory if it doesn't exist
    mkdir -p "$PROJECT_ROOT/.pact"

    # Create pact-broker.config.js
    cat > "$PROJECT_ROOT/.pact/pact-broker.config.js" << 'EOF'
module.exports = {
  pactBroker: 'http://localhost:9292',
  pactBrokerUsername: 'admin',
  pactBrokerPassword: 'password',
  pactFilesOrDirs: ['./pacts'],
  consumerVersion: process.env.GITHUB_SHA || '1.0.0',
  publishVerificationResult: true,
  enablePending: true,
  includeWipPactsSince: '2024-01-01',
};
EOF

    success "Pact Broker configuration created"
}

# Test Pact Broker connection
test_pact_broker() {
    log "Testing Pact Broker connection..."

    # Test basic connectivity
    if ! curl -s -f "http://localhost:9292" >/dev/null 2>&1; then
        error "Cannot connect to Pact Broker"
        exit 1
    fi

    # Test with authentication
    local response=$(curl -s -u admin:password "http://localhost:9292/pacts/provider/auth-service/consumer/api-gateway/latest" || echo "error")

    if [[ "$response" == "error" ]]; then
        warn "No existing pacts found (this is normal for first setup)"
    else
        success "Pact Broker connection successful"
    fi
}

# Display setup information
display_info() {
    echo ""
    echo "=================================================="
    echo "🎯 Pact Broker Setup Complete!"
    echo "=================================================="
    echo ""
    echo "📊 Pact Broker Dashboard:"
    echo "   URL: http://localhost:9292"
    echo "   Username: admin"
    echo "   Password: password"
    echo ""
    echo "📝 Configuration:"
    echo "   Config file: .pact/pact-broker.config.js"
    echo "   Docker compose: docker-compose.pact.yml"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Run contract tests: pnpm test -- --testPathPattern=contract"
    echo "   2. View contracts: http://localhost:9292"
    echo "   3. Stop services: docker-compose -f docker-compose.pact.yml down"
    echo ""
    echo "=================================================="
}

# Main execution
main() {
    log "Setting up Pact Broker for Meqenet.et..."

    check_docker
    start_pact_broker
    create_pact_config
    test_pact_broker
    display_info

    success "Pact Broker setup completed successfully!"
}

# Execute main function
main "$@"
