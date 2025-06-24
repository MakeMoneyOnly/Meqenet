#!/bin/bash

# Meqenet Microservice Creation Script
# This script creates a new microservice using our standard cookiecutter template

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ASCII Art Banner
echo -e "${BLUE}"
cat << "EOF"
 __  __                                _   
|  \/  | ___  __ _  ___ _ __   ___| |_ 
| |\/| |/ _ \/ _` |/ _ \ '_ \ / _ \ __|
| |  | |  __/ (_| |  __/ | | |  __/ |_ 
|_|  |_|\___|\__, |\___|_| |_|\___|\__|
                |_|                   
    Microservice Generator
EOF
echo -e "${NC}"

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if cookiecutter is installed
if ! command -v cookiecutter &> /dev/null; then
    print_error "cookiecutter is not installed. Installing..."
    pip install cookiecutter
fi

# Check if we're in the correct directory
if [[ ! -f "package.json" ]]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Create templates directory if it doesn't exist
TEMPLATE_DIR="templates/microservice"
if [[ ! -d "$TEMPLATE_DIR" ]]; then
    print_info "Creating template directory structure..."
    mkdir -p "$TEMPLATE_DIR"
fi

print_info "🚀 Creating new Meqenet microservice..."
print_info "This will generate a production-ready NestJS microservice with:"
echo "   • Feature-Sliced Design architecture"
echo "   • Security configurations (mTLS, JWT, encryption)"
echo "   • Observability (Prometheus, OpenTelemetry, health checks)"
echo "   • Database integration with Prisma"
echo "   • CI/CD pipeline configuration"
echo "   • Ethiopian localization support"
echo "   • Testing infrastructure"
echo ""

# Get service information from user
read -p "Enter service name (e.g., payment-service): " SERVICE_NAME
read -p "Enter service description: " SERVICE_DESCRIPTION
read -p "Enter service port (default: 3000): " SERVICE_PORT
SERVICE_PORT=${SERVICE_PORT:-3000}

read -p "Database required? (y/n): " NEEDS_DATABASE
read -p "gRPC service? (y/n): " IS_GRPC_SERVICE
read -p "Event-driven? (y/n): " IS_EVENT_DRIVEN
read -p "Author name: " AUTHOR_NAME
read -p "Author email: " AUTHOR_EMAIL

print_info "Generating microservice: $SERVICE_NAME"

# Create the service using cookiecutter
BACKEND_DIR="backend/apps"
if [[ ! -d "$BACKEND_DIR" ]]; then
    mkdir -p "$BACKEND_DIR"
fi

# Generate the service
cookiecutter "$TEMPLATE_DIR" \
    --output-dir "$BACKEND_DIR" \
    --no-input \
    service_name="$SERVICE_NAME" \
    service_description="$SERVICE_DESCRIPTION" \
    service_port="$SERVICE_PORT" \
    needs_database="$NEEDS_DATABASE" \
    is_grpc_service="$IS_GRPC_SERVICE" \
    is_event_driven="$IS_EVENT_DRIVEN" \
    author_name="$AUTHOR_NAME" \
    author_email="$AUTHOR_EMAIL" || {
    
    print_warning "Cookiecutter template not found. Creating template first..."
    
    # If template doesn't exist, create it
    ./scripts/setup-cookiecutter-template.sh
    
    # Try again
    cookiecutter "$TEMPLATE_DIR" \
        --output-dir "$BACKEND_DIR" \
        --no-input \
        service_name="$SERVICE_NAME" \
        service_description="$SERVICE_DESCRIPTION" \
        service_port="$SERVICE_PORT" \
        needs_database="$NEEDS_DATABASE" \
        is_grpc_service="$IS_GRPC_SERVICE" \
        is_event_driven="$IS_EVENT_DRIVEN" \
        author_name="$AUTHOR_NAME" \
        author_email="$AUTHOR_EMAIL"
}

SERVICE_PATH="$BACKEND_DIR/$SERVICE_NAME"

print_success "Microservice '$SERVICE_NAME' created successfully!"
print_info "Location: $SERVICE_PATH"

# Install dependencies
print_info "Installing dependencies..."
cd "$SERVICE_PATH"
yarn install

print_info "Setting up development environment..."

# Generate initial database migration if database is needed
if [[ "$NEEDS_DATABASE" == "y" ]]; then
    print_info "Setting up database..."
    yarn prisma generate
    yarn prisma db push
fi

# Run initial tests
print_info "Running initial tests..."
yarn test

cd - > /dev/null

print_success "🎉 Microservice setup complete!"
echo ""
print_info "Next steps:"
echo "1. cd $SERVICE_PATH"
echo "2. Review the generated code"
echo "3. Update the schema.prisma file (if using database)"
echo "4. Implement your business logic in src/features/"
echo "5. Add your service to the main docker-compose.yml"
echo "6. Update the API Gateway configuration"
echo ""
print_info "Happy coding! 🚀" 