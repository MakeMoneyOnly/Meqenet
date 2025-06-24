#!/bin/bash

# Setup Cookiecutter Template for Meqenet Microservices
# This script creates the cookiecutter template structure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

TEMPLATE_DIR="templates/microservice"

print_info "Setting up Cookiecutter template for Meqenet microservices..."

# Create template directory structure
mkdir -p "$TEMPLATE_DIR"
cd "$TEMPLATE_DIR"

# Create cookiecutter.json configuration
cat > cookiecutter.json << 'EOF'
{
    "service_name": "example-service",
    "service_description": "A microservice for Meqenet platform",
    "service_port": "3000",
    "needs_database": "y",
    "is_grpc_service": "n",
    "is_event_driven": "y",
    "author_name": "Meqenet Developer",
    "author_email": "dev@meqenet.et",
    "year": "2024"
}
EOF

# Create the main service template directory
SERVICE_TEMPLATE_DIR="{{cookiecutter.service_name}}"
mkdir -p "$SERVICE_TEMPLATE_DIR"
cd "$SERVICE_TEMPLATE_DIR"

print_info "Creating template files..."

# Create directory structure
mkdir -p src/{app,features,shared,infrastructure}
mkdir -p src/features/{auth,shared}
mkdir -p src/shared/{config,database,utils,types,decorators,guards,interceptors,filters}
mkdir -p src/infrastructure/{database,messaging,external-services}
mkdir -p test/{unit,integration,e2e}
mkdir -p docs
mkdir -p .github/workflows

print_success "Template structure created successfully!"
print_info "Template location: $TEMPLATE_DIR"

cd - > /dev/null 