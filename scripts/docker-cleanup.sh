#!/bin/bash

# Docker Cleanup Script for Meqenet
# This script helps free up disk space by cleaning Docker resources

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

show_disk_usage() {
    log_info "Current disk usage:"
    df -h
    echo ""
    log_info "Docker system usage:"
    docker system df
    echo ""
}

cleanup_docker() {
    local aggressive="${1:-false}"
    
    log_info "Starting Docker cleanup..."
    
    if [ "$aggressive" = "true" ]; then
        log_warn "Performing aggressive cleanup (removes all unused resources)"
        
        # Stop all containers
        log_info "Stopping all containers..."
        docker stop $(docker ps -q) 2>/dev/null || true
        
        # Remove all containers, networks, images, and build cache
        log_info "Removing all unused Docker resources..."
        docker system prune -a -f --volumes
        
        # Remove all images
        log_info "Removing all images..."
        docker rmi $(docker images -q) 2>/dev/null || true
        
    else
        log_info "Performing standard cleanup"
        
        # Remove stopped containers
        log_info "Removing stopped containers..."
        docker container prune -f
        
        # Remove dangling images
        log_info "Removing dangling images..."
        docker image prune -f
        
        # Remove unused networks
        log_info "Removing unused networks..."
        docker network prune -f
        
        # Remove unused volumes
        log_info "Removing unused volumes..."
        docker volume prune -f
        
        # Remove build cache (keep some recent cache)
        log_info "Cleaning build cache..."
        docker builder prune -f --keep-storage=5GB
    fi
    
    log_success "Docker cleanup completed"
}

main() {
    local mode="${1:-standard}"
    
    echo "Docker Cleanup Script for Meqenet"
    echo "=================================="
    echo ""
    
    # Show current usage
    show_disk_usage
    
    case "$mode" in
        "aggressive"|"--aggressive"|"-a")
            log_warn "This will remove ALL Docker resources including images!"
            read -p "Are you sure? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cleanup_docker true
            else
                log_info "Cleanup cancelled"
                exit 0
            fi
            ;;
        "standard"|"--standard"|"-s"|"")
            cleanup_docker false
            ;;
        "help"|"--help"|"-h")
            echo "Usage: $0 [mode]"
            echo ""
            echo "Modes:"
            echo "  standard     - Remove stopped containers, dangling images, unused networks/volumes"
            echo "  aggressive   - Remove ALL Docker resources (requires confirmation)"
            echo "  help         - Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Standard cleanup"
            echo "  $0 standard           # Standard cleanup"
            echo "  $0 aggressive         # Aggressive cleanup (with confirmation)"
            exit 0
            ;;
        *)
            log_warn "Unknown mode: $mode"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
    
    echo ""
    log_info "Cleanup completed. New disk usage:"
    show_disk_usage
}

main "$@"
