#!/bin/bash

# Meqenet 2.0 Database Setup Script
# This script sets up local PostgreSQL and Redis instances for development
# using Docker containers with proper configurations for the Meqenet platform.
#
# Personas: FinTech DevOps Engineer, Senior Backend Developer
#
# Usage: ./scripts/setup-database.sh [--reset|--stop|--status]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_VERSION="15"
REDIS_VERSION="7-alpine"
NETWORK_NAME="meqenet-dev"
POSTGRES_CONTAINER="meqenet-postgres"
REDIS_CONTAINER="meqenet-redis"
POSTGRES_PORT="5432"
REDIS_PORT="6379"

# Database configuration
POSTGRES_DB="meqenet_dev"
POSTGRES_USER="meqenet"
POSTGRES_PASSWORD="password"

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

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker and try again."
        exit 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

container_exists() {
    docker ps -a --format '{{.Names}}' | grep -q "^$1$"
}

container_running() {
    docker ps --format '{{.Names}}' | grep -q "^$1$"
}

wait_for_postgres() {
    log_info "Waiting for PostgreSQL to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec $POSTGRES_CONTAINER pg_isready -U $POSTGRES_USER -d $POSTGRES_DB > /dev/null 2>&1; then
            log_success "PostgreSQL is ready!"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts: PostgreSQL not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "PostgreSQL failed to start within the expected time"
    return 1
}

wait_for_redis() {
    log_info "Waiting for Redis to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec $REDIS_CONTAINER redis-cli ping > /dev/null 2>&1; then
            log_success "Redis is ready!"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts: Redis not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "Redis failed to start within the expected time"
    return 1
}

create_network() {
    if ! docker network ls | grep -q $NETWORK_NAME; then
        log_info "Creating Docker network: $NETWORK_NAME"
        docker network create $NETWORK_NAME
        log_success "Network created successfully"
    else
        log_info "Network $NETWORK_NAME already exists"
    fi
}

setup_postgresql() {
    log_info "Setting up PostgreSQL container..."
    
    if container_exists $POSTGRES_CONTAINER; then
        if container_running $POSTGRES_CONTAINER; then
            log_warning "PostgreSQL container is already running"
            return 0
        else
            log_info "Starting existing PostgreSQL container..."
            docker start $POSTGRES_CONTAINER
        fi
    else
        log_info "Creating new PostgreSQL container..."
        docker run -d \
            --name $POSTGRES_CONTAINER \
            --network $NETWORK_NAME \
            -p $POSTGRES_PORT:5432 \
            -e POSTGRES_DB=$POSTGRES_DB \
            -e POSTGRES_USER=$POSTGRES_USER \
            -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
            -e POSTGRES_INITDB_ARGS="--encoding=UTF8 --locale=C" \
            -v meqenet-postgres-data:/var/lib/postgresql/data \
            postgres:$POSTGRES_VERSION
    fi
    
    wait_for_postgres
    
    # Create additional databases for testing
    log_info "Creating test databases..."
    docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
        CREATE DATABASE IF NOT EXISTS meqenet_test;
        CREATE DATABASE IF NOT EXISTS meqenet_integration_test;
    " || log_warning "Test databases may already exist"
    
    log_success "PostgreSQL setup completed"
    log_info "Connection string: postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB"
}

setup_redis() {
    log_info "Setting up Redis container..."
    
    if container_exists $REDIS_CONTAINER; then
        if container_running $REDIS_CONTAINER; then
            log_warning "Redis container is already running"
            return 0
        else
            log_info "Starting existing Redis container..."
            docker start $REDIS_CONTAINER
        fi
    else
        log_info "Creating new Redis container..."
        docker run -d \
            --name $REDIS_CONTAINER \
            --network $NETWORK_NAME \
            -p $REDIS_PORT:6379 \
            -v meqenet-redis-data:/data \
            redis:$REDIS_VERSION \
            redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    fi
    
    wait_for_redis
    
    log_success "Redis setup completed"
    log_info "Connection string: redis://localhost:$REDIS_PORT"
}

show_status() {
    log_info "Database containers status:"
    echo ""
    
    if container_exists $POSTGRES_CONTAINER; then
        if container_running $POSTGRES_CONTAINER; then
            echo -e "${GREEN}✓${NC} PostgreSQL: Running (Port: $POSTGRES_PORT)"
            echo "  Connection: postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB"
        else
            echo -e "${YELLOW}⚠${NC} PostgreSQL: Stopped"
        fi
    else
        echo -e "${RED}✗${NC} PostgreSQL: Not created"
    fi
    
    if container_exists $REDIS_CONTAINER; then
        if container_running $REDIS_CONTAINER; then
            echo -e "${GREEN}✓${NC} Redis: Running (Port: $REDIS_PORT)"
            echo "  Connection: redis://localhost:$REDIS_PORT"
        else
            echo -e "${YELLOW}⚠${NC} Redis: Stopped"
        fi
    else
        echo -e "${RED}✗${NC} Redis: Not created"
    fi
    
    echo ""
    
    if docker network ls | grep -q $NETWORK_NAME; then
        echo -e "${GREEN}✓${NC} Network: $NETWORK_NAME exists"
    else
        echo -e "${RED}✗${NC} Network: $NETWORK_NAME not found"
    fi
}

stop_databases() {
    log_info "Stopping database containers..."
    
    if container_running $POSTGRES_CONTAINER; then
        docker stop $POSTGRES_CONTAINER
        log_success "PostgreSQL stopped"
    else
        log_info "PostgreSQL is not running"
    fi
    
    if container_running $REDIS_CONTAINER; then
        docker stop $REDIS_CONTAINER
        log_success "Redis stopped"
    else
        log_info "Redis is not running"
    fi
}

reset_databases() {
    log_warning "This will completely reset all database containers and data!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Reset cancelled"
        return 0
    fi
    
    log_info "Resetting database containers..."
    
    # Stop and remove containers
    if container_exists $POSTGRES_CONTAINER; then
        docker stop $POSTGRES_CONTAINER 2>/dev/null || true
        docker rm $POSTGRES_CONTAINER
        log_info "PostgreSQL container removed"
    fi
    
    if container_exists $REDIS_CONTAINER; then
        docker stop $REDIS_CONTAINER 2>/dev/null || true
        docker rm $REDIS_CONTAINER
        log_info "Redis container removed"
    fi
    
    # Remove volumes
    docker volume rm meqenet-postgres-data 2>/dev/null || true
    docker volume rm meqenet-redis-data 2>/dev/null || true
    log_info "Data volumes removed"
    
    log_success "Database reset completed"
}

create_env_template() {
    if [ ! -f ".env.database" ]; then
        log_info "Creating database environment template..."
        cat > .env.database << EOF
# Meqenet 2.0 Database Configuration
# Generated by setup-database.sh

# PostgreSQL Configuration
DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB"
POSTGRES_HOST="localhost"
POSTGRES_PORT="$POSTGRES_PORT"
POSTGRES_DB="$POSTGRES_DB"
POSTGRES_USER="$POSTGRES_USER"
POSTGRES_PASSWORD="$POSTGRES_PASSWORD"

# Test Database URLs
TEST_DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/meqenet_test"
INTEGRATION_TEST_DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/meqenet_integration_test"

# Redis Configuration
REDIS_URL="redis://localhost:$REDIS_PORT"
REDIS_HOST="localhost"
REDIS_PORT="$REDIS_PORT"

# Cache configuration
CACHE_TTL="3600"
SESSION_SECRET="your-session-secret-change-in-production"
EOF
        log_success "Database environment template created: .env.database"
        log_info "You can source this file or copy values to your main .env file"
    else
        log_info ".env.database already exists, skipping creation"
    fi
}

run_health_check() {
    log_info "Running health checks..."
    
    local postgres_ok=false
    local redis_ok=false
    
    # Check PostgreSQL
    if container_running $POSTGRES_CONTAINER; then
        if docker exec $POSTGRES_CONTAINER pg_isready -U $POSTGRES_USER -d $POSTGRES_DB > /dev/null 2>&1; then
            postgres_ok=true
            log_success "PostgreSQL health check passed"
        else
            log_error "PostgreSQL health check failed"
        fi
    else
        log_error "PostgreSQL container is not running"
    fi
    
    # Check Redis
    if container_running $REDIS_CONTAINER; then
        if docker exec $REDIS_CONTAINER redis-cli ping > /dev/null 2>&1; then
            redis_ok=true
            log_success "Redis health check passed"
        else
            log_error "Redis health check failed"
        fi
    else
        log_error "Redis container is not running"
    fi
    
    if $postgres_ok && $redis_ok; then
        log_success "All database health checks passed!"
        return 0
    else
        log_error "Some database health checks failed"
        return 1
    fi
}

show_help() {
    echo "Meqenet 2.0 Database Setup Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  (no args)     Setup databases (default)"
    echo "  --status      Show database container status"
    echo "  --stop        Stop database containers"
    echo "  --reset       Reset database containers and data"
    echo "  --health      Run health checks"
    echo "  --help, -h    Show this help message"
    echo ""
    echo "This script sets up local PostgreSQL and Redis containers"
    echo "for Meqenet development with proper Ethiopian localization support."
}

# Main execution
main() {
    case "${1:-setup}" in
        "setup"|"")
            echo "=============================================="
            echo "  Meqenet 2.0 Database Setup"
            echo "=============================================="
            echo ""
            
            check_docker
            create_network
            setup_postgresql
            setup_redis
            create_env_template
            
            echo ""
            echo "=============================================="
            log_success "Database setup completed successfully!"
            echo "=============================================="
            echo ""
            log_info "Database containers are ready for development"
            log_info "You can now run 'yarn install' and 'yarn dev' in your project"
            echo ""
            run_health_check
            ;;
        "--status")
            show_status
            ;;
        "--stop")
            stop_databases
            ;;
        "--reset")
            reset_databases
            ;;
        "--health")
            run_health_check
            ;;
        "--help"|"-h")
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 