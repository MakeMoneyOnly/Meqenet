#!/bin/bash

# Docker Build Resilience Script for Meqenet
# This script provides enhanced error handling and retry logic for Docker builds
# to handle disk space issues, network problems, and other build failures.

set -euo pipefail

# Configuration
MAX_RETRIES=3
RETRY_DELAY=10
CLEANUP_ON_FAILURE=true
PROGRESS_MODE="plain"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to check disk space
check_disk_space() {
    log_info "Checking disk space..."
    
    # Get disk usage for current directory
    local available_space
    available_space=$(df -h . | awk 'NR==2 {print $4}' | sed 's/G//')
    
    # Convert to numeric value (assuming GB)
    local available_gb
    available_gb=$(echo "$available_space" | sed 's/[^0-9.]//g')
    
    if (( $(echo "$available_gb < 5" | bc -l) )); then
        log_warn "Low disk space detected: ${available_space} available"
        log_warn "Consider running: docker system prune -a -f --volumes"
        return 1
    fi
    
    log_info "Disk space OK: ${available_space} available"
    return 0
}

# Function to check Docker daemon status
check_docker_daemon() {
    log_info "Checking Docker daemon status..."
    
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running or accessible"
        return 1
    fi
    
    log_info "Docker daemon is running"
    return 0
}

# Function to clean up Docker resources
cleanup_docker() {
    log_info "Cleaning up Docker resources..."
    
    # Remove dangling images
    docker image prune -f >/dev/null 2>&1 || true
    
    # Remove unused build cache (keep recent)
    docker builder prune -f --keep-storage=10GB >/dev/null 2>&1 || true
    
    log_info "Docker cleanup completed"
}

# Function to build with retry logic
build_with_retry() {
    local service_name="$1"
    local dockerfile_path="$2"
    local context_path="${3:-.}"
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log_info "Build attempt $attempt/$MAX_RETRIES for $service_name"
        
        # Build command with enhanced options
        if docker-compose build \
            --no-cache \
            --progress="$PROGRESS_MODE" \
            --build-arg BUILDKIT_INLINE_CACHE=1 \
            "$service_name"; then
            
            log_success "Build successful for $service_name"
            return 0
        else
            log_error "Build attempt $attempt failed for $service_name"
            
            if [ $attempt -lt $MAX_RETRIES ]; then
                if [ "$CLEANUP_ON_FAILURE" = true ]; then
                    log_info "Cleaning up before retry..."
                    cleanup_docker
                fi
                
                log_info "Waiting ${RETRY_DELAY}s before retry..."
                sleep $RETRY_DELAY
            fi
            
            ((attempt++))
        fi
    done
    
    log_error "All build attempts failed for $service_name"
    return 1
}

# Function to show Docker system info
show_docker_info() {
    log_info "Docker system information:"
    echo "----------------------------------------"
    docker system df
    echo "----------------------------------------"
}

# Main function
main() {
    local service_name="${1:-}"
    
    if [ -z "$service_name" ]; then
        echo "Usage: $0 <service-name>"
        echo "Example: $0 auth-service"
        echo "         $0 api-gateway"
        exit 1
    fi
    
    log_info "Starting resilient Docker build for: $service_name"
    
    # Pre-build checks
    if ! check_docker_daemon; then
        log_error "Docker daemon check failed"
        exit 1
    fi
    
    if ! check_disk_space; then
        log_warn "Disk space is low, but continuing..."
        log_info "You may want to run: docker system prune -a -f --volumes"
    fi
    
    # Show current Docker system state
    show_docker_info
    
    # Determine dockerfile path based on service
    local dockerfile_path
    case "$service_name" in
        "auth-service")
            dockerfile_path="./backend/services/auth-service/Dockerfile"
            ;;
        "api-gateway")
            dockerfile_path="./backend/services/api-gateway/Dockerfile"
            ;;
        *)
            log_error "Unknown service: $service_name"
            log_info "Supported services: auth-service, api-gateway"
            exit 1
            ;;
    esac
    
    # Verify dockerfile exists
    if [ ! -f "$dockerfile_path" ]; then
        log_error "Dockerfile not found: $dockerfile_path"
        exit 1
    fi
    
    # Perform the build with retry logic
    if build_with_retry "$service_name" "$dockerfile_path"; then
        log_success "Build completed successfully for $service_name"
        
        # Show final Docker system state
        log_info "Final Docker system state:"
        show_docker_info
        
        exit 0
    else
        log_error "Build failed for $service_name after $MAX_RETRIES attempts"
        
        # Show troubleshooting info
        echo ""
        log_info "Troubleshooting tips:"
        echo "1. Check disk space: df -h"
        echo "2. Clean Docker: docker system prune -a -f --volumes"
        echo "3. Restart Docker daemon"
        echo "4. Check Docker logs: docker logs <container-name>"
        
        exit 1
    fi
}

# Run main function with all arguments
main "$@"
