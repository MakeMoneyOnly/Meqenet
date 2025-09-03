@echo off

ECHO Starting E2E test environment...

REM Start services in detached mode and wait for them to be healthy
docker-compose -f docker-compose.e2e.yml up -d --build --wait

ECHO Running E2E tests...

REM Run the E2E tests
pnpm test:e2e

REM Capture exit code from test run
SET EXIT_CODE=%ERRORLEVEL%

ECHO Tearing down E2E test environment...

REM Stop and remove the containers
docker-compose -f docker-compose.e2e.yml down

exit /b %EXIT_CODE%
