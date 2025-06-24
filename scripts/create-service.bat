@echo off
setlocal enabledelayedexpansion

:: Colors for Windows (using ANSI escape codes if supported)
for /f %%A in ('echo prompt $E ^| cmd') do set "ESC=%%A"
set "RED=%ESC%[31m"
set "GREEN=%ESC%[32m"
set "YELLOW=%ESC%[33m"
set "BLUE=%ESC%[34m"
set "MAGENTA=%ESC%[35m"
set "CYAN=%ESC%[36m"
set "WHITE=%ESC%[37m"
set "BOLD=%ESC%[1m"
set "NC=%ESC%[0m"

echo.
echo %CYAN%  __  __                             _   
echo  ^|  \/  ^| ___  __ _  ___ _ __   ___^| ^|_ 
echo  ^| ^|\/^| ^|/ _ \/ _` ^|/ _ \ '_ \ / _ \ __^|
echo  ^| ^|  ^| ^|  __/ (_^| ^|  __/ ^| ^| ^|  __/ ^|_ 
echo  ^|_^|  ^|_^|\___^|\__, ^|\___^|_^| ^|_^|\___^|\__^|
echo                 ^|_^|                   
echo       Microservice Generator%NC%
echo.

:: Function to prompt for input with default value
:prompt_input
set "prompt_msg=%~1"
set "var_name=%~2"
set "default_val=%~3"
set "validation=%~4"

set /p "user_input=%prompt_msg% [%default_val%]: "
if "!user_input!"=="" set "user_input=%default_val%"

:: Validation
if "%validation%"=="required" (
    if "!user_input!"=="" (
        echo %RED%Error: This field is required%NC%
        goto prompt_input
    )
)

if "%validation%"=="slug" (
    echo !user_input! | findstr /r "^[a-z][a-z0-9-]*$" >nul
    if errorlevel 1 (
        echo %RED%Error: Service slug must be lowercase, start with a letter, and contain only letters, numbers, and hyphens%NC%
        goto prompt_input
    )
)

if "%validation%"=="port" (
    if !user_input! LSS 1000 (
        echo %RED%Error: Port must be >= 1000%NC%
        goto prompt_input
    )
    if !user_input! GTR 65535 (
        echo %RED%Error: Port must be <= 65535%NC%
        goto prompt_input
    )
)

if "%validation%"=="email" (
    echo !user_input! | findstr /r "@.*\." >nul
    if errorlevel 1 (
        echo %RED%Error: Please enter a valid email address%NC%
        goto prompt_input
    )
)

set "%var_name%=!user_input!"
goto :eof

:: Check if cookiecutter is installed
cookiecutter --version >nul 2>&1
if errorlevel 1 (
    echo %RED%Error: cookiecutter is not installed or not in PATH%NC%
    echo %YELLOW%Please install it with: pip install cookiecutter%NC%
    exit /b 1
)

:: Check if we're in the Meqenet repository root
if not exist "templates\microservice\cookiecutter.json" (
    echo %RED%Error: Please run this script from the Meqenet repository root%NC%
    echo %YELLOW%The templates/microservice directory was not found%NC%
    exit /b 1
)

echo %BOLD%%BLUE%=== Meqenet Microservice Generator ===%NC%
echo.
echo %YELLOW%This will create a new microservice using our standard template.%NC%
echo %YELLOW%Press Ctrl+C at any time to cancel.%NC%
echo.

:: Gather service information
call :prompt_input "Service name (e.g., 'User Authentication Service')" SERVICE_NAME "" "required"
call :prompt_input "Service slug (e.g., 'auth-service')" SERVICE_SLUG "" "slug"
call :prompt_input "Service description" SERVICE_DESCRIPTION "A microservice for %SERVICE_NAME%" ""
call :prompt_input "Author name" AUTHOR_NAME "%USERNAME%" "required"
call :prompt_input "Author email" AUTHOR_EMAIL "" "email"
call :prompt_input "Service port" SERVICE_PORT "3000" "port"

echo.
echo %CYAN%=== Service Configuration ===%NC%

:ask_database
set /p "NEEDS_DATABASE=Does this service need a database? (y/n) [n]: "
if "!NEEDS_DATABASE!"=="" set "NEEDS_DATABASE=n"
if /i "!NEEDS_DATABASE!"=="y" goto :database_yes
if /i "!NEEDS_DATABASE!"=="n" goto :database_no
echo %RED%Please enter 'y' or 'n'%NC%
goto ask_database

:database_yes
set "NEEDS_DATABASE=y"
goto ask_grpc

:database_no
set "NEEDS_DATABASE=n"
goto ask_grpc

:ask_grpc
set /p "IS_GRPC_SERVICE=Is this a gRPC service? (y/n) [n]: "
if "!IS_GRPC_SERVICE!"=="" set "IS_GRPC_SERVICE=n"
if /i "!IS_GRPC_SERVICE!"=="y" goto :grpc_yes
if /i "!IS_GRPC_SERVICE!"=="n" goto :grpc_no
echo %RED%Please enter 'y' or 'n'%NC%
goto ask_grpc

:grpc_yes
set "IS_GRPC_SERVICE=y"
goto ask_events

:grpc_no
set "IS_GRPC_SERVICE=n"
goto ask_events

:ask_events
set /p "IS_EVENT_DRIVEN=Is this an event-driven service? (y/n) [n]: "
if "!IS_EVENT_DRIVEN!"=="" set "IS_EVENT_DRIVEN=n"
if /i "!IS_EVENT_DRIVEN!"=="y" goto :events_yes
if /i "!IS_EVENT_DRIVEN!"=="n" goto :events_no
echo %RED%Please enter 'y' or 'n'%NC%
goto ask_events

:events_yes
set "IS_EVENT_DRIVEN=y"
goto summary

:events_no
set "IS_EVENT_DRIVEN=n"
goto summary

:summary
echo.
echo %BOLD%%MAGENTA%=== Service Summary ===%NC%
echo %CYAN%Name:%NC% !SERVICE_NAME!
echo %CYAN%Slug:%NC% !SERVICE_SLUG!
echo %CYAN%Description:%NC% !SERVICE_DESCRIPTION!
echo %CYAN%Author:%NC% !AUTHOR_NAME! ^<!AUTHOR_EMAIL!^>
echo %CYAN%Port:%NC% !SERVICE_PORT!
echo %CYAN%Database:%NC% !NEEDS_DATABASE!
echo %CYAN%gRPC:%NC% !IS_GRPC_SERVICE!
echo %CYAN%Event-driven:%NC% !IS_EVENT_DRIVEN!
echo.

:confirm
set /p "CONFIRM=Create this service? (y/n) [y]: "
if "!CONFIRM!"=="" set "CONFIRM=y"
if /i "!CONFIRM!"=="y" goto :create_service
if /i "!CONFIRM!"=="n" (
    echo %YELLOW%Service creation cancelled.%NC%
    exit /b 0
)
echo %RED%Please enter 'y' or 'n'%NC%
goto confirm

:create_service
echo.
echo %YELLOW%Creating service...%NC%

:: Create temporary cookiecutter config
set "TEMP_CONFIG=%TEMP%\cookiecutter_config.json"
(
echo {
echo   "service_name": "!SERVICE_NAME!",
echo   "service_slug": "!SERVICE_SLUG!",
echo   "service_description": "!SERVICE_DESCRIPTION!",
echo   "author_name": "!AUTHOR_NAME!",
echo   "author_email": "!AUTHOR_EMAIL!",
echo   "service_port": "!SERVICE_PORT!",
echo   "needs_database": "!NEEDS_DATABASE!",
echo   "is_grpc_service": "!IS_GRPC_SERVICE!",
echo   "is_event_driven": "!IS_EVENT_DRIVEN!"
echo }
) > "!TEMP_CONFIG!"

:: Create backend services directory if it doesn't exist
if not exist "backend\services" mkdir "backend\services"

:: Run cookiecutter
cd "backend\services"
cookiecutter "..\..\templates\microservice" --config-file "!TEMP_CONFIG!" --no-input
set "COOKIECUTTER_EXIT_CODE=!ERRORLEVEL!"

:: Clean up
del "!TEMP_CONFIG!" 2>nul

:: Check if cookiecutter succeeded
if !COOKIECUTTER_EXIT_CODE! neq 0 (
    echo %RED%Error: Failed to create service with cookiecutter%NC%
    exit /b !COOKIECUTTER_EXIT_CODE!
)

echo.
echo %GREEN%✅ Service created successfully!%NC%
echo.
echo %BOLD%%BLUE%=== Next Steps ===%NC%
echo %CYAN%1.%NC% cd backend\services\!SERVICE_SLUG!
echo %CYAN%2.%NC% yarn install
echo %CYAN%3.%NC% yarn start:dev
echo.
echo %YELLOW%📚 Documentation:%NC% http://localhost:!SERVICE_PORT!/api/docs
echo %YELLOW%🏥 Health Check:%NC% http://localhost:!SERVICE_PORT!/health
echo %YELLOW%📊 Metrics:%NC% http://localhost:!SERVICE_PORT!/metrics
echo.
echo %GREEN%Happy coding! 🚀%NC% 