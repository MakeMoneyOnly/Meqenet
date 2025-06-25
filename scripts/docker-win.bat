@echo off
REM Meqenet.et Docker Management Script for Windows
REM This script provides Docker operations optimized for Windows environments
REM Usage: docker-win.bat [build|up|down|logs|clean]

setlocal

REM Set colors for output
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

REM Change to project root directory
cd /d "%~dp0\.."

if "%1"=="" (
    echo %YELLOW%Meqenet.et Docker Management for Windows%NC%
    echo.
    echo Usage: %0 [command]
    echo.
    echo Commands:
    echo   build      - Build all services
    echo   build-nc   - Build all services without cache
    echo   up         - Start all services
    echo   dev        - Start development environment
    echo   down       - Stop all services
    echo   logs       - Show logs from all services
    echo   clean      - Clean up containers and volumes
    echo   test       - Test Docker setup
    echo.
    goto :end
)

if "%1"=="build" (
    echo %BLUE%Building Meqenet services...%NC%
    docker-compose build
    if %ERRORLEVEL% EQU 0 (
        echo %GREEN%Build completed successfully!%NC%
    ) else (
        echo %RED%Build failed with error code %ERRORLEVEL%%NC%
    )
    goto :end
)

if "%1"=="build-nc" (
    echo %BLUE%Building Meqenet services without cache...%NC%
    docker-compose build --no-cache
    if %ERRORLEVEL% EQU 0 (
        echo %GREEN%Build completed successfully!%NC%
    ) else (
        echo %RED%Build failed with error code %ERRORLEVEL%%NC%
    )
    goto :end
)

if "%1"=="up" (
    echo %BLUE%Starting Meqenet services...%NC%
    docker-compose up -d
    if %ERRORLEVEL% EQU 0 (
        echo %GREEN%Services started successfully!%NC%
        echo.
        echo %YELLOW%Available services:%NC%
        echo   - API Gateway: http://localhost:3000
        echo   - Auth Service: http://localhost:3001
        echo   - PostgreSQL: localhost:5432
        echo   - Redis: localhost:6379
    ) else (
        echo %RED%Failed to start services with error code %ERRORLEVEL%%NC%
    )
    goto :end
)

if "%1"=="dev" (
    echo %BLUE%Starting Meqenet development environment...%NC%
    docker-compose up --build
    goto :end
)

if "%1"=="down" (
    echo %BLUE%Stopping Meqenet services...%NC%
    docker-compose down
    if %ERRORLEVEL% EQU 0 (
        echo %GREEN%Services stopped successfully!%NC%
    ) else (
        echo %RED%Failed to stop services with error code %ERRORLEVEL%%NC%
    )
    goto :end
)

if "%1"=="logs" (
    echo %BLUE%Showing logs from all services...%NC%
    docker-compose logs -f
    goto :end
)

if "%1"=="clean" (
    echo %YELLOW%Cleaning up Docker containers and volumes...%NC%
    echo This will remove all containers, networks, and volumes for this project.
    set /p confirm="Are you sure? (y/N): "
    if /i "%confirm%"=="y" (
        docker-compose down -v --remove-orphans
        docker system prune -f
        echo %GREEN%Cleanup completed!%NC%
    ) else (
        echo %YELLOW%Cleanup cancelled.%NC%
    )
    goto :end
)

if "%1"=="test" (
    echo %BLUE%Testing Docker setup...%NC%
    echo.
    
    echo Checking Docker version...
    docker --version
    if %ERRORLEVEL% NEQ 0 (
        echo %RED%Docker is not installed or not in PATH%NC%
        goto :end
    )
    
    echo Checking Docker Compose version...
    docker-compose --version
    if %ERRORLEVEL% NEQ 0 (
        echo %RED%Docker Compose is not installed or not in PATH%NC%
        goto :end
    )
    
    echo Checking if Docker daemon is running...
    docker info >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo %RED%Docker daemon is not running. Please start Docker Desktop.%NC%
        goto :end
    )
    
    echo %GREEN%Docker setup is working correctly!%NC%
    echo.
    echo %YELLOW%FinTech Security Note:%NC%
    echo - Windows paths are handled without COMPOSE_BAKE to avoid path conflicts
    echo - BuildKit is still enabled for individual builds
    echo - All security standards are maintained
    goto :end
)

echo %RED%Unknown command: %1%NC%
echo Use "%0" without arguments to see available commands.

:end
endlocal 