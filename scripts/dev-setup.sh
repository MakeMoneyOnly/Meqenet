#!/bin/bash

# Meqenet 2.0 Development Environment Setup Script
# This script automates the setup of the complete development environment
# for the Meqenet BNPL platform following our tech stack requirements.
#
# Personas: FinTech DevOps Engineer, Senior Backend Developer, Senior Mobile Developer
# 
# Usage: ./scripts/dev-setup.sh [--frontend-only|--backend-only|--mobile-only]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Performance monitoring and Ethiopian timezone support
START_TIME=$(date +%s)
SETUP_LOG="dev-setup-$(date +%Y%m%d-%H%M%S).log"
export TZ="Africa/Addis_Ababa"

# Configuration
NODE_VERSION="22.17.0"  # LTS version as per tech stack requirements
PYTHON_VERSION="3.11"
GO_VERSION="1.21"
TERRAFORM_VERSION="1.6.0"
DOCKER_VERSION="24.0"

# Global flags
SETUP_ALL=true
SETUP_FRONTEND=false
SETUP_BACKEND=false
SETUP_MOBILE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend-only)
            SETUP_ALL=false
            SETUP_FRONTEND=true
            shift
            ;;
        --backend-only)
            SETUP_ALL=false
            SETUP_BACKEND=true
            shift
            ;;
        --mobile-only)
            SETUP_ALL=false
            SETUP_MOBILE=true
            shift
            ;;
        --help|-h)
            echo "Meqenet 2.0 Development Environment Setup"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --frontend-only    Setup only frontend development tools"
            echo "  --backend-only     Setup only backend development tools"
            echo "  --mobile-only      Setup only mobile development tools"
            echo "  --help, -h         Show this help message"
            echo ""
            echo "Without options, sets up complete development environment"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_performance() {
    local step_name="$1"
    local step_start_time="$2"
    local current_time=$(date +%s)
    local duration=$((current_time - step_start_time))
    echo -e "${PURPLE}[PERF]${NC} $step_name completed in ${duration}s" | tee -a "$SETUP_LOG"
}

log_ethiopian_time() {
    local current_time=$(TZ="Africa/Addis_Ababa" date '+%Y-%m-%d %H:%M:%S %Z')
    echo -e "${CYAN}[ET-TIME]${NC} Ethiopian time: $current_time"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# Main setup functions
setup_prerequisites() {
    log_info "Setting up prerequisites..."
    
    OS=$(detect_os)
    
    case $OS in
        "linux")
            # Update package manager
            sudo apt-get update -y
            
            # Install essential packages
            sudo apt-get install -y \
                curl \
                wget \
                git \
                build-essential \
                software-properties-common \
                apt-transport-https \
                ca-certificates \
                gnupg \
                lsb-release
            ;;
        "macos")
            # Check if Homebrew is installed
            if ! check_command brew; then
                log_info "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            
            # Update Homebrew
            brew update
            ;;
        "windows")
            log_info "Windows detected. Please ensure you have:"
            log_info "- Windows Subsystem for Linux (WSL2)"
            log_info "- Git for Windows"
            log_info "- Visual Studio Code"
            log_warning "Consider running this script in WSL2 for best experience"
            ;;
        *)
            log_error "Unsupported operating system: $OSTYPE"
            exit 1
            ;;
    esac
    
    log_success "Prerequisites setup completed"
}

setup_node_and_npm() {
    log_info "Setting up Node.js and npm..."
    
    # Install Node Version Manager (nvm)
    if ! check_command nvm; then
        log_info "Installing nvm..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    fi
    
    # Install and use the required Node.js version
    nvm install $NODE_VERSION
    nvm use $NODE_VERSION
    nvm alias default $NODE_VERSION
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    log_success "Node.js $node_version and npm $npm_version installed"
    
    # Install global packages required for development
    log_info "Installing global npm packages..."
    npm install -g \
        yarn \
        pnpm \
        @nestjs/cli \
        @react-native-community/cli \
        expo-cli \
        typescript \
        ts-node \
        eslint \
        prettier \
        husky \
        lint-staged
    
    log_success "Global npm packages installed"
}

setup_backend_tools() {
    if [[ "$SETUP_ALL" == true || "$SETUP_BACKEND" == true ]]; then
        log_info "Setting up backend development tools..."
        
        # Install Docker and Docker Compose
        setup_docker
        
        # Install PostgreSQL client tools
        setup_postgresql_client
        
        # Install Redis client tools
        setup_redis_client
        
        # Install Prisma CLI
        npm install -g prisma @prisma/cli
        
        # Install additional backend tools
        if [[ $(detect_os) == "macos" ]]; then
            brew install postgresql redis
        elif [[ $(detect_os) == "linux" ]]; then
            sudo apt-get install -y postgresql-client redis-tools
        fi
        
        log_success "Backend development tools setup completed"
    fi
}

setup_frontend_tools() {
    if [[ "$SETUP_ALL" == true || "$SETUP_FRONTEND" == true ]]; then
        log_info "Setting up frontend development tools..."
        
        # Install Next.js CLI
        npm install -g create-next-app
        
        # Install Tailwind CSS CLI
        npm install -g @tailwindcss/cli
        
        # Install Storybook CLI
        npm install -g @storybook/cli
        
        log_success "Frontend development tools setup completed"
    fi
}

setup_mobile_tools() {
    if [[ "$SETUP_ALL" == true || "$SETUP_MOBILE" == true ]]; then
        log_info "Setting up mobile development tools..."
        
        # Install React Native CLI
        npm install -g @react-native-community/cli
        
        # Install Expo CLI
        npm install -g @expo/cli
        
        # Platform-specific mobile setup
        OS=$(detect_os)
        case $OS in
            "macos")
                # iOS development setup
                if ! check_command xcodebuild; then
                    log_warning "Xcode not found. Please install Xcode from the App Store for iOS development"
                fi
                
                # Install iOS Simulator
                sudo xcode-select --install 2>/dev/null || true
                
                # Install Cocoapods
                if ! check_command pod; then
                    sudo gem install cocoapods
                fi
                
                # Android development setup
                setup_android_development
                ;;
            "linux")
                # Android development setup
                setup_android_development
                ;;
            "windows")
                log_info "For mobile development on Windows, please install:"
                log_info "- Android Studio"
                log_info "- Java JDK 11"
                log_info "- Android SDK"
                ;;
        esac
        
        log_success "Mobile development tools setup completed"
    fi
}

setup_android_development() {
    log_info "Setting up Android development environment..."
    
    # Install Java JDK 11
    if [[ $(detect_os) == "macos" ]]; then
        brew install openjdk@11
    elif [[ $(detect_os) == "linux" ]]; then
        sudo apt-get install -y openjdk-11-jdk
    fi
    
    # Set JAVA_HOME
    export JAVA_HOME=$(/usr/libexec/java_home -v11) 2>/dev/null || export JAVA_HOME="/usr/lib/jvm/java-11-openjdk-amd64"
    
    # Download and install Android SDK
    ANDROID_HOME="$HOME/Android/Sdk"
    if [ ! -d "$ANDROID_HOME" ]; then
        log_info "Downloading Android command line tools..."
        mkdir -p "$ANDROID_HOME/cmdline-tools"
        cd "$ANDROID_HOME/cmdline-tools"
        
        if [[ $(detect_os) == "macos" ]]; then
            wget https://dl.google.com/android/repository/commandlinetools-mac-9477386_latest.zip
            unzip commandlinetools-mac-9477386_latest.zip
        elif [[ $(detect_os) == "linux" ]]; then
            wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
            unzip commandlinetools-linux-9477386_latest.zip
        fi
        
        mv cmdline-tools latest
        rm -f *.zip
        
        # Add to PATH
        export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
        export PATH="$ANDROID_HOME/platform-tools:$PATH"
        
        # Install required Android packages
        yes | sdkmanager --licenses
        sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
    fi
    
    log_success "Android development environment setup completed"
}

setup_docker() {
    log_info "Setting up Docker..."
    
    if ! check_command docker; then
        OS=$(detect_os)
        case $OS in
            "macos")
                log_info "Please install Docker Desktop for Mac from https://docker.com"
                log_warning "Continuing without Docker installation"
                ;;
            "linux")
                # Install Docker on Linux
                curl -fsSL https://get.docker.com -o get-docker.sh
                sudo sh get-docker.sh
                sudo usermod -aG docker $USER
                rm get-docker.sh
                
                # Install Docker Compose
                sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
                sudo chmod +x /usr/local/bin/docker-compose
                ;;
            "windows")
                log_info "Please install Docker Desktop for Windows from https://docker.com"
                ;;
        esac
    else
        log_success "Docker is already installed"
    fi
    
    # Configure Docker BuildKit and Compose Bake for FinTech performance standards
    log_info "Configuring Docker BuildKit and Compose Bake..."
    
    # Enable BuildKit by default
    if [[ ! -f ~/.docker/config.json ]]; then
        mkdir -p ~/.docker
        echo '{"features": {"buildkit": true}}' > ~/.docker/config.json
        log_success "Created Docker config with BuildKit enabled"
    else
        # Update existing config to enable BuildKit
        if ! grep -q '"buildkit"' ~/.docker/config.json; then
            # Simple approach: backup and recreate with BuildKit enabled
            cp ~/.docker/config.json ~/.docker/config.json.backup
            echo '{"features": {"buildkit": true}}' > ~/.docker/config.json
            log_success "Updated Docker config to enable BuildKit"
        fi
    fi
    
    # Add COMPOSE_BAKE to shell profile for persistent environment variable
    local shell_profile=""
    if [[ -n "$BASH_VERSION" ]]; then
        shell_profile="$HOME/.bashrc"
    elif [[ -n "$ZSH_VERSION" ]]; then
        shell_profile="$HOME/.zshrc"
    fi
    
    if [[ -n "$shell_profile" ]]; then
        if ! grep -q "COMPOSE_BAKE" "$shell_profile"; then
            echo "" >> "$shell_profile"
            echo "# Meqenet Docker BuildKit Bake Configuration" >> "$shell_profile"
            echo "export COMPOSE_BAKE=true" >> "$shell_profile"
            echo "export DOCKER_BUILDKIT=1" >> "$shell_profile"
            log_success "Added COMPOSE_BAKE=true to $shell_profile"
        fi
    fi
    
    # Set for current session
    export COMPOSE_BAKE=true
    export DOCKER_BUILDKIT=1
    
    log_success "Docker BuildKit and Compose Bake configured for optimal FinTech build performance"
}

setup_postgresql_client() {
    log_info "Setting up PostgreSQL client..."
    
    OS=$(detect_os)
    case $OS in
        "macos")
            if ! check_command psql; then
                brew install postgresql
            fi
            ;;
        "linux")
            if ! check_command psql; then
                sudo apt-get install -y postgresql-client
            fi
            ;;
    esac
    
    log_success "PostgreSQL client setup completed"
}

setup_redis_client() {
    log_info "Setting up Redis client..."
    
    OS=$(detect_os)
    case $OS in
        "macos")
            if ! check_command redis-cli; then
                brew install redis
            fi
            ;;
        "linux")
            if ! check_command redis-cli; then
                sudo apt-get install -y redis-tools
            fi
            ;;
    esac
    
    log_success "Redis client setup completed"
}

setup_development_tools() {
    log_info "Setting up additional development tools..."
    
    # Install AWS CLI
    if ! check_command aws; then
        log_info "Installing AWS CLI..."
        if [[ $(detect_os) == "macos" ]]; then
            brew install awscli
        elif [[ $(detect_os) == "linux" ]]; then
            curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
            unzip awscliv2.zip
            sudo ./aws/install
            rm -rf aws awscliv2.zip
        fi
    fi
    
    # Install Terraform
    if ! check_command terraform; then
        log_info "Installing Terraform..."
        if [[ $(detect_os) == "macos" ]]; then
            brew install terraform
        elif [[ $(detect_os) == "linux" ]]; then
            wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip
            unzip terraform_${TERRAFORM_VERSION}_linux_amd64.zip
            sudo mv terraform /usr/local/bin/
            rm terraform_${TERRAFORM_VERSION}_linux_amd64.zip
        fi
    fi
    
    # Install Git hooks setup
    if check_command yarn; then
        yarn global add husky lint-staged
    fi
    
    log_success "Additional development tools setup completed"
}

setup_environment_files() {
    log_info "Setting up environment configuration files..."
    
    # Create environment files if they don't exist
    if [ ! -f ".env.local" ]; then
        cat > .env.local << 'EOF'
# Meqenet 2.0 Local Development Environment Configuration
# Copy this file and customize the values for your local setup

# Database Configuration
DATABASE_URL="postgresql://meqenet:password@localhost:5432/meqenet_dev"
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_SECRET="${JWT_SECRET:-your-super-secure-jwt-secret-for-development}"
JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-24h}"

# External Services (Development)
FAYDA_API_URL="${FAYDA_API_URL:-https://staging-api.fayda.gov.et}"
FAYDA_API_KEY="${FAYDA_API_KEY:-your-fayda-development-api-key}"

TELEBIRR_API_URL="${TELEBIRR_API_URL:-https://sandbox.telebirr.et}"
TELEBIRR_MERCHANT_ID="${TELEBIRR_MERCHANT_ID:-your-test-merchant-id}"
TELEBIRR_API_KEY="${TELEBIRR_API_KEY:-your-telebirr-development-api-key}"

# AWS Configuration (Local Development)
AWS_REGION="${AWS_REGION:-eu-west-1}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-your-aws-access-key}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-your-aws-secret-key}"
AWS_S3_BUCKET="meqenet-dev-uploads"

# Email Service
SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-your-dev-email@gmail.com}"
SMTP_PASS="${SMTP_PASS:-your-app-password}"

# SMS Service
SMS_PROVIDER="${SMS_PROVIDER:-twilio}"
TWILIO_ACCOUNT_SID="${TWILIO_ACCOUNT_SID:-your-twilio-account-sid}"
TWILIO_AUTH_TOKEN="${TWILIO_AUTH_TOKEN:-your-twilio-auth-token}"
TWILIO_PHONE_NUMBER="${TWILIO_PHONE_NUMBER:-+1234567890}"

# Application Configuration
NODE_ENV="development"
PORT="3000"
API_VERSION="v1"

# Security Configuration
BCRYPT_ROUNDS="10"
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# Monitoring and Logging
LOG_LEVEL="debug"
ENABLE_REQUEST_LOGGING="true"

# Feature Flags
ENABLE_REGISTRATION="true"
ENABLE_KYC_VERIFICATION="true"
ENABLE_SANDBOX_MODE="true"
EOF
        log_success "Created .env.local file"
    else
        log_info ".env.local already exists, skipping creation"
    fi
    
    # Create database setup script
    cat > scripts/setup-database.sh << 'EOF'
#!/bin/bash

# Meqenet 2.0 Database Setup Script
# This script sets up local PostgreSQL and Redis instances for development

set -e

log_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

log_info "Setting up local development databases..."

# Create network for Meqenet services
docker network create meqenet-dev 2>/dev/null || true

# Start PostgreSQL container
log_info "Starting PostgreSQL container..."
docker run -d \
    --name meqenet-postgres \
    --network meqenet-dev \
    -p 5432:5432 \
    -e POSTGRES_DB=meqenet_dev \
    -e POSTGRES_USER=meqenet \
    -e POSTGRES_PASSWORD=password \
    -v meqenet-postgres-data:/var/lib/postgresql/data \
    postgres:15

# Start Redis container
log_info "Starting Redis container..."
docker run -d \
    --name meqenet-redis \
    --network meqenet-dev \
    -p 6379:6379 \
    -v meqenet-redis-data:/data \
    redis:7-alpine

# Wait for databases to be ready
log_info "Waiting for databases to be ready..."
sleep 10

# Test database connections
log_info "Testing database connections..."
docker exec meqenet-postgres pg_isready -U meqenet
docker exec meqenet-redis redis-cli ping

log_success "Development databases are ready!"
log_info "PostgreSQL: postgresql://meqenet:password@localhost:5432/meqenet_dev"
log_info "Redis: redis://localhost:6379"
EOF
    
    chmod +x scripts/setup-database.sh
    log_success "Created database setup script"
}

create_development_documentation() {
    log_info "Creating development documentation..."
    
    # Create docs directory if it doesn't exist
    mkdir -p docs/development
    
    # Create comprehensive development guide
    cat > docs/development/LOCAL_DEVELOPMENT.md << 'EOF'
# Meqenet 2.0 Local Development Guide

This guide will help you set up and run the Meqenet 2.0 platform locally for development.

## Prerequisites

- Node.js 18.19.0 (LTS)
- Docker and Docker Compose
- Git
- Visual Studio Code (recommended)

## Quick Start

1. **Run the setup script:**
   ```bash
   ./scripts/dev-setup.sh
   ```

2. **Set up databases:**
   ```bash
   ./scripts/setup-database.sh
   ```

3. **Install dependencies:**
   ```bash
   yarn install
   ```

4. **Run database migrations:**
   ```bash
   yarn prisma:migrate:dev
   ```

5. **Start the development server:**
   ```bash
   yarn dev
   ```

## Project Structure

```
meqenet/
├── apps/
│   ├── backend/          # NestJS backend services
│   ├── web/             # Next.js web application
│   └── mobile/          # React Native mobile app
├── libs/
│   ├── shared/          # Shared utilities and types
│   ├── ui/              # Shared UI components
│   └── api-client/      # API client library
├── infrastructure/      # Terraform infrastructure code
├── scripts/            # Development and deployment scripts
└── docs/               # Documentation
```

## Development Workflow

### Backend Development

1. **Start backend services:**
   ```bash
   cd apps/backend
   yarn dev
   ```

2. **Run tests:**
   ```bash
   yarn test
   yarn test:e2e
   ```

3. **Database operations:**
   ```bash
   # Generate Prisma client
   yarn prisma:generate
   
   # Run migrations
   yarn prisma:migrate:dev
   
   # Seed database
   yarn prisma:seed
   
   # Open Prisma Studio
   yarn prisma:studio
   ```

### Frontend Development

1. **Start web application:**
   ```bash
   cd apps/web
   yarn dev
   ```

2. **Start Storybook:**
   ```bash
   yarn storybook
   ```

3. **Run tests:**
   ```bash
   yarn test
   yarn test:e2e
   ```

### Mobile Development

1. **Start Metro bundler:**
   ```bash
   cd apps/mobile
   yarn start
   ```

2. **Run on iOS:**
   ```bash
   yarn ios
   ```

3. **Run on Android:**
   ```bash
   yarn android
   ```

## Environment Configuration

Copy `.env.local` to `.env` and update the values according to your setup:

```bash
cp .env.local .env
```

Key configuration options:
- Database URLs
- External API keys (Fayda, Telebirr)
- AWS credentials
- JWT secrets

## Code Quality

### Linting and Formatting

```bash
# Run ESLint
yarn lint

# Fix linting issues
yarn lint:fix

# Format code with Prettier
yarn format
```

### Pre-commit Hooks

Husky is configured to run linting and tests before commits:

```bash
# Install git hooks
yarn husky:install
```

## Testing

### Unit Tests
```bash
yarn test
```

### Integration Tests
```bash
yarn test:integration
```

### End-to-End Tests
```bash
yarn test:e2e
```

## Debugging

### Backend Debugging

1. Start the backend in debug mode:
   ```bash
   yarn dev:debug
   ```

2. Attach VS Code debugger to port 9229

### Frontend Debugging

Use Chrome DevTools or VS Code debugger with source maps.

### Mobile Debugging

1. **React Native Debugger:**
   ```bash
   yarn debug:mobile
   ```

2. **Flipper:** Use Flipper for advanced debugging

## Database Management

### Viewing Data
- Use Prisma Studio: `yarn prisma:studio`
- Connect with any PostgreSQL client to `localhost:5432`

### Migrations
- Create migration: `yarn prisma:migrate:dev --name migration_name`
- Reset database: `yarn prisma:migrate:reset`

### Seeding
```bash
yarn prisma:seed
```

## API Development

### OpenAPI Documentation
- API docs are auto-generated from OpenAPI spec
- View at: `http://localhost:3000/api/docs`

### Testing APIs
- Use provided Postman collection in `docs/api/`
- Or use REST clients like Insomnia or Thunder Client

## Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Node Version Issues
```bash
# Use correct Node version
nvm use
```

### Database Connection Issues
```bash
# Restart database containers
docker restart meqenet-postgres meqenet-redis
```

### Clear Cache
```bash
# Clear all caches
yarn clean
```

## Performance

### Bundle Analysis
```bash
# Analyze web bundle
yarn analyze

# Analyze mobile bundle
yarn analyze:mobile
```

### Monitoring
- Use built-in performance monitoring
- Check metrics at `http://localhost:3000/metrics`

## Security

### Local HTTPS
```bash
# Generate self-signed certificates
yarn dev:https
```

### Secrets Management
- Never commit real secrets
- Use AWS Secrets Manager for staging/production
- Use `.env.local` for development secrets

## Contribution Guidelines

1. Create feature branch from `develop`
2. Follow conventional commit format
3. Write tests for new features
4. Update documentation
5. Submit pull request

## Getting Help

- Check the troubleshooting guide in `docs/TROUBLESHOOTING.md`
- Ask questions in the team Slack channel
- Review existing issues on GitHub

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Ethiopian Development Guidelines](./ETHIOPIAN_DEVELOPMENT.md)
EOF

    log_success "Development documentation created"
}

verify_installation() {
    log_info "Verifying installation..."
    
    local errors=0
    
    # Check Node.js
    if check_command node; then
        log_success "Node.js: $(node --version)"
    else
        log_error "Node.js not found"
        errors=$((errors + 1))
    fi
    
    # Check npm/yarn
    if check_command npm; then
        log_success "npm: $(npm --version)"
    else
        log_error "npm not found"
        errors=$((errors + 1))
    fi
    
    if check_command yarn; then
        log_success "Yarn: $(yarn --version)"
    else
        log_warning "Yarn not found (optional)"
    fi
    
    # Check Docker
    if check_command docker; then
        log_success "Docker: $(docker --version)"
    else
        log_warning "Docker not found (required for database setup)"
    fi
    
    # Check platform-specific tools
    if [[ "$SETUP_ALL" == true || "$SETUP_BACKEND" == true ]]; then
        if check_command psql; then
            log_success "PostgreSQL client available"
        else
            log_warning "PostgreSQL client not found"
        fi
        
        if check_command redis-cli; then
            log_success "Redis client available"
        else
            log_warning "Redis client not found"
        fi
    fi
    
    if [[ "$SETUP_ALL" == true || "$SETUP_MOBILE" == true ]]; then
        if [[ $(detect_os) == "macos" ]]; then
            if check_command xcodebuild; then
                log_success "Xcode available"
            else
                log_warning "Xcode not found (required for iOS development)"
            fi
        fi
        
        if check_command java; then
            log_success "Java: $(java -version 2>&1 | head -n 1)"
        else
            log_warning "Java not found (required for Android development)"
        fi
    fi
    
    if [ $errors -eq 0 ]; then
        log_success "All core tools installed successfully!"
    else
        log_error "$errors critical tools missing. Please check the installation."
        return 1
    fi
}

# Main execution
main() {
    echo "=============================================="
    echo "  Meqenet 2.0 Development Environment Setup  "
    echo "=============================================="
    echo ""
    echo "This script will set up your development environment"
    echo "according to the Meqenet tech stack requirements."
    echo ""
    
    # Detect setup mode
    if [[ "$SETUP_ALL" == true ]]; then
        log_info "Setting up complete development environment..."
    else
        if [[ "$SETUP_FRONTEND" == true ]]; then
            log_info "Setting up frontend development tools only..."
        fi
        if [[ "$SETUP_BACKEND" == true ]]; then
            log_info "Setting up backend development tools only..."
        fi
        if [[ "$SETUP_MOBILE" == true ]]; then
            log_info "Setting up mobile development tools only..."
        fi
    fi
    
    echo ""
    read -p "Continue? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Setup cancelled"
        exit 0
    fi
    
    # Run setup steps
    setup_prerequisites
    setup_node_and_npm
    setup_backend_tools
    setup_frontend_tools
    setup_mobile_tools
    setup_development_tools
    setup_environment_files
    create_development_documentation
    
    # Verify installation
    echo ""
    log_info "Verifying installation..."
    if verify_installation; then
        echo ""
        echo "=============================================="
        log_success "Development environment setup completed!"
        echo "=============================================="
        echo ""
        log_info "Next steps:"
        echo "1. Copy .env.local to .env and configure your settings"
        echo "2. Run './scripts/setup-database.sh' to start local databases"
        echo "3. Install project dependencies with 'yarn install'"
        echo "4. Run 'yarn dev' to start development"
        echo ""
        log_info "Documentation: docs/development/LOCAL_DEVELOPMENT.md"
        echo ""
    else
        echo ""
        log_error "Setup completed with some issues. Please check the logs above."
        exit 1
    fi
}

# Run main function
main "$@" 