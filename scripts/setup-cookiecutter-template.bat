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
echo    Cookiecutter Template Setup%NC%
echo.

:: Check if we're in the Meqenet repository root
if not exist "templates\microservice" (
    echo %RED%Error: Please run this script from the Meqenet repository root%NC%
    echo %YELLOW%The templates/microservice directory was not found%NC%
    exit /b 1
)

echo %BOLD%%BLUE%=== Setting up Cookiecutter Template Structure ===%NC%
echo.

set "TEMPLATE_DIR=templates\microservice\{{cookiecutter.service_slug}}"

:: Create core source directories
echo %CYAN%Creating core source directories...%NC%
if not exist "%TEMPLATE_DIR%\src\shared\config" mkdir "%TEMPLATE_DIR%\src\shared\config"
if not exist "%TEMPLATE_DIR%\src\shared\guards" mkdir "%TEMPLATE_DIR%\src\shared\guards"
if not exist "%TEMPLATE_DIR%\src\shared\filters" mkdir "%TEMPLATE_DIR%\src\shared\filters"
if not exist "%TEMPLATE_DIR%\src\shared\interceptors" mkdir "%TEMPLATE_DIR%\src\shared\interceptors"
if not exist "%TEMPLATE_DIR%\src\shared\decorators" mkdir "%TEMPLATE_DIR%\src\shared\decorators"
if not exist "%TEMPLATE_DIR%\src\shared\pipes" mkdir "%TEMPLATE_DIR%\src\shared\pipes"
if not exist "%TEMPLATE_DIR%\src\shared\dto" mkdir "%TEMPLATE_DIR%\src\shared\dto"
if not exist "%TEMPLATE_DIR%\src\shared\interfaces" mkdir "%TEMPLATE_DIR%\src\shared\interfaces"
if not exist "%TEMPLATE_DIR%\src\shared\utils" mkdir "%TEMPLATE_DIR%\src\shared\utils"
if not exist "%TEMPLATE_DIR%\src\shared\constants" mkdir "%TEMPLATE_DIR%\src\shared\constants"
if not exist "%TEMPLATE_DIR%\src\shared\observability" mkdir "%TEMPLATE_DIR%\src\shared\observability"

:: Create feature directories (Feature-Sliced Design)
echo %CYAN%Creating feature directories...%NC%
if not exist "%TEMPLATE_DIR%\src\features\auth" mkdir "%TEMPLATE_DIR%\src\features\auth"

:: Create infrastructure directories
echo %CYAN%Creating infrastructure directories...%NC%
if not exist "%TEMPLATE_DIR%\src\infrastructure\database" mkdir "%TEMPLATE_DIR%\src\infrastructure\database"
if not exist "%TEMPLATE_DIR%\src\infrastructure\messaging" mkdir "%TEMPLATE_DIR%\src\infrastructure\messaging"
if not exist "%TEMPLATE_DIR%\src\infrastructure\external" mkdir "%TEMPLATE_DIR%\src\infrastructure\external"

:: Create test directories
echo %CYAN%Creating test directories...%NC%
if not exist "%TEMPLATE_DIR%\test\unit" mkdir "%TEMPLATE_DIR%\test\unit"
if not exist "%TEMPLATE_DIR%\test\integration" mkdir "%TEMPLATE_DIR%\test\integration"
if not exist "%TEMPLATE_DIR%\test\e2e" mkdir "%TEMPLATE_DIR%\test\e2e"
if not exist "%TEMPLATE_DIR%\test\fixtures" mkdir "%TEMPLATE_DIR%\test\fixtures"

:: Create other directories
echo %CYAN%Creating additional directories...%NC%
if not exist "%TEMPLATE_DIR%\prisma" mkdir "%TEMPLATE_DIR%\prisma"
if not exist "%TEMPLATE_DIR%\proto" mkdir "%TEMPLATE_DIR%\proto"
if not exist "%TEMPLATE_DIR%\docs" mkdir "%TEMPLATE_DIR%\docs"
if not exist "%TEMPLATE_DIR%\scripts" mkdir "%TEMPLATE_DIR%\scripts"
if not exist "%TEMPLATE_DIR%\i18n\en" mkdir "%TEMPLATE_DIR%\i18n\en"
if not exist "%TEMPLATE_DIR%\i18n\am" mkdir "%TEMPLATE_DIR%\i18n\am"

:: Create essential empty files with basic content
echo %CYAN%Creating essential template files...%NC%

:: Create shared module
if not exist "%TEMPLATE_DIR%\src\shared\shared.module.ts" (
    (
        echo import { Module } from '@nestjs/common'^;
        echo.
        echo @Module^({
        echo   imports: [],
        echo   providers: [],
        echo   exports: [],
        echo }^)
        echo export class SharedModule {}
    ) > "%TEMPLATE_DIR%\src\shared\shared.module.ts"
)

:: Create auth module
if not exist "%TEMPLATE_DIR%\src\features\auth\auth.module.ts" (
    (
        echo import { Module } from '@nestjs/common'^;
        echo.
        echo @Module^({
        echo   imports: [],
        echo   providers: [],
        echo   controllers: [],
        echo   exports: [],
        echo }^)
        echo export class AuthModule {}
    ) > "%TEMPLATE_DIR%\src\features\auth\auth.module.ts"
)

:: Create basic configuration files
if not exist "%TEMPLATE_DIR%\src\shared\config\winston.config.ts" (
    (
        echo import { ConfigService } from '@nestjs/config'^;
        echo import { WinstonModuleAsyncOptions } from 'nest-winston'^;
        echo import * as winston from 'winston'^;
        echo.
        echo export const winstonConfig: WinstonModuleAsyncOptions = {
        echo   inject: [ConfigService],
        echo   useFactory: ^(configService: ConfigService^) =^> ^({
        echo     transports: [
        echo       new winston.transports.Console^({
        echo         format: winston.format.combine^(
        echo           winston.format.timestamp^(^),
        echo           winston.format.errors^({ stack: true }^),
        echo           winston.format.json^(^),
        echo         ^),
        echo       }^),
        echo     ],
        echo   }^),
        echo }^;
    ) > "%TEMPLATE_DIR%\src\shared\config\winston.config.ts"
)

if not exist "%TEMPLATE_DIR%\src\shared\config\throttler.config.ts" (
    (
        echo import { ConfigService } from '@nestjs/config'^;
        echo import { ThrottlerAsyncOptions } from '@nestjs/throttler'^;
        echo.
        echo export const throttlerConfig: ThrottlerAsyncOptions = {
        echo   inject: [ConfigService],
        echo   useFactory: ^(configService: ConfigService^) =^> ^([
        echo     {
        echo       name: 'short',
        echo       ttl: 1000,
        echo       limit: 3,
        echo     },
        echo     {
        echo       name: 'medium',
        echo       ttl: 10000,
        echo       limit: 20,
        echo     },
        echo     {
        echo       name: 'long',
        echo       ttl: 60000,
        echo       limit: 100,
        echo     },
        echo   ]^),
        echo }^;
    ) > "%TEMPLATE_DIR%\src\shared\config\throttler.config.ts"
)

:: Create basic filters, guards, interceptors (placeholder files)
echo %CYAN%Creating shared components...%NC%

if not exist "%TEMPLATE_DIR%\src\shared\filters\global-exception.filter.ts" (
    echo // TODO: Implement GlobalExceptionFilter > "%TEMPLATE_DIR%\src\shared\filters\global-exception.filter.ts"
)

if not exist "%TEMPLATE_DIR%\src\shared\guards\jwt-auth.guard.ts" (
    echo // TODO: Implement JwtAuthGuard > "%TEMPLATE_DIR%\src\shared\guards\jwt-auth.guard.ts"
)

if not exist "%TEMPLATE_DIR%\src\shared\interceptors\logging.interceptor.ts" (
    echo // TODO: Implement LoggingInterceptor > "%TEMPLATE_DIR%\src\shared\interceptors\logging.interceptor.ts"
)

if not exist "%TEMPLATE_DIR%\src\shared\interceptors\transform-response.interceptor.ts" (
    echo // TODO: Implement TransformResponseInterceptor > "%TEMPLATE_DIR%\src\shared\interceptors\transform-response.interceptor.ts"
)

if not exist "%TEMPLATE_DIR%\src\shared\observability\tracing.ts" (
    echo // TODO: Implement OpenTelemetry tracing setup > "%TEMPLATE_DIR%\src\shared\observability\tracing.ts"
)

if not exist "%TEMPLATE_DIR%\src\shared\observability\metrics.ts" (
    echo // TODO: Implement Prometheus metrics setup > "%TEMPLATE_DIR%\src\shared\observability\metrics.ts"
)

:: Create infrastructure modules
echo %CYAN%Creating infrastructure modules...%NC%

if not exist "%TEMPLATE_DIR%\src\infrastructure\database\database.module.ts" (
    (
        echo import { Module } from '@nestjs/common'^;
        echo.
        echo @Module^({
        echo   imports: [],
        echo   providers: [],
        echo   exports: [],
        echo }^)
        echo export class DatabaseModule {}
    ) > "%TEMPLATE_DIR%\src\infrastructure\database\database.module.ts"
)

if not exist "%TEMPLATE_DIR%\src\infrastructure\messaging\messaging.module.ts" (
    (
        echo import { Module } from '@nestjs/common'^;
        echo.
        echo @Module^({
        echo   imports: [],
        echo   providers: [],
        echo   exports: [],
        echo }^)
        echo export class MessagingModule {}
    ) > "%TEMPLATE_DIR%\src\infrastructure\messaging\messaging.module.ts"
)

:: Create test configuration files
echo %CYAN%Creating test configurations...%NC%

if not exist "%TEMPLATE_DIR%\test\jest-integration.json" (
    (
        echo {
        echo   "moduleFileExtensions": ["js", "json", "ts"],
        echo   "rootDir": ".",
        echo   "testEnvironment": "node",
        echo   "testRegex": ".integration-spec.ts$",
        echo   "transform": {
        echo     "^.+\\.^(t^|j^)s$": "ts-jest"
        echo   }
        echo }
    ) > "%TEMPLATE_DIR%\test\jest-integration.json"
)

if not exist "%TEMPLATE_DIR%\test\jest-e2e.json" (
    (
        echo {
        echo   "moduleFileExtensions": ["js", "json", "ts"],
        echo   "rootDir": ".",
        echo   "testEnvironment": "node",
        echo   "testRegex": ".e2e-spec.ts$",
        echo   "transform": {
        echo     "^.+\\.^(t^|j^)s$": "ts-jest"
        echo   }
        echo }
    ) > "%TEMPLATE_DIR%\test\jest-e2e.json"
)

:: Create localization files
echo %CYAN%Creating localization files...%NC%

if not exist "%TEMPLATE_DIR%\i18n\en\common.json" (
    (
        echo {
        echo   "hello": "Hello",
        echo   "welcome": "Welcome to {{cookiecutter.service_name}}",
        echo   "error": {
        echo     "internal": "An internal error occurred",
        echo     "validation": "Validation failed",
        echo     "unauthorized": "Unauthorized access"
        echo   }
        echo }
    ) > "%TEMPLATE_DIR%\i18n\en\common.json"
)

if not exist "%TEMPLATE_DIR%\i18n\am\common.json" (
    (
        echo {
        echo   "hello": "ሰላም",
        echo   "welcome": "እንኳን ወደ {{cookiecutter.service_name}} በደህና መጡ",
        echo   "error": {
        echo     "internal": "የውስጥ ስህተት ተከስቷል",
        echo     "validation": "ማረጋገጫ አልተሳካም",
        echo     "unauthorized": "ፈቃድ የሌለው መዳረሻ"
        echo   }
        echo }
    ) > "%TEMPLATE_DIR%\i18n\am\common.json"
)

:: Create app controller and service
echo %CYAN%Creating app controller and service...%NC%

if not exist "%TEMPLATE_DIR%\src\app\app.controller.ts" (
    (
        echo import { Controller, Get } from '@nestjs/common'^;
        echo import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'^;
        echo import { AppService } from './app.service'^;
        echo.
        echo @ApiTags^('Health'^)
        echo @Controller^(^)
        echo export class AppController {
        echo   constructor^(private readonly appService: AppService^) {}
        echo.
        echo   @Get^('/health'^)
        echo   @ApiOperation^({ summary: 'Health check endpoint' }^)
        echo   @ApiResponse^({ status: 200, description: 'Service is healthy' }^)
        echo   getHealth^(^): object {
        echo     return this.appService.getHealth^(^)^;
        echo   }
        echo }
    ) > "%TEMPLATE_DIR%\src\app\app.controller.ts"
)

if not exist "%TEMPLATE_DIR%\src\app\app.service.ts" (
    (
        echo import { Injectable } from '@nestjs/common'^;
        echo.
        echo @Injectable^(^)
        echo export class AppService {
        echo   getHealth^(^): object {
        echo     return {
        echo       status: 'ok',
        echo       timestamp: new Date^(^).toISOString^(^),
        echo       service: '{{cookiecutter.service_name}}',
        echo       version: '{{cookiecutter.version}}',
        echo     }^;
        echo   }
        echo }
    ) > "%TEMPLATE_DIR%\src\app\app.service.ts"
)

:: Create environment example
if not exist "%TEMPLATE_DIR%\.env.example" (
    (
        echo # {{cookiecutter.service_name}} Configuration
        echo NODE_ENV=development
        echo PORT={{cookiecutter.service_port}}
        echo HOST=0.0.0.0
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=your-super-secure-jwt-secret-key
        echo JWT_EXPIRES_IN=1d
        echo.
        echo # Database Configuration ^(if enabled^)
        echo DATABASE_URL=postgresql://username:password@localhost:5432/{{cookiecutter.service_slug}}
        echo.
        echo # Redis Configuration
        echo REDIS_URL=redis://localhost:6379
        echo.
        echo # Logging
        echo LOG_LEVEL=info
        echo.
        echo # Ethiopian Services
        echo FAYDA_API_URL=https://api.fayda.et
        echo FAYDA_API_KEY=your-fayda-api-key
        echo TELEBIRR_API_URL=https://api.telebirr.et
        echo TELEBIRR_MERCHANT_ID=your-merchant-id
        echo.
        echo # Observability
        echo JAEGER_ENDPOINT=http://localhost:14268/api/traces
        echo METRICS_ENABLED=true
        echo.
        echo # Security
        echo ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
        echo RATE_LIMIT_TTL=60
        echo RATE_LIMIT_LIMIT=100
    ) > "%TEMPLATE_DIR%\.env.example"
)

:: Create TypeScript configuration
if not exist "%TEMPLATE_DIR%\tsconfig.json" (
    (
        echo {
        echo   "compilerOptions": {
        echo     "module": "commonjs",
        echo     "declaration": true,
        echo     "removeComments": true,
        echo     "emitDecoratorMetadata": true,
        echo     "experimentalDecorators": true,
        echo     "allowSyntheticDefaultImports": true,
        echo     "target": "es2020",
        echo     "sourceMap": true,
        echo     "outDir": "./dist",
        echo     "baseUrl": "./",
        echo     "incremental": true,
        echo     "strict": true,
        echo     "skipLibCheck": true,
        echo     "strictNullChecks": false,
        echo     "noImplicitAny": false,
        echo     "strictBindCallApply": false,
        echo     "forceConsistentCasingInFileNames": false,
        echo     "noFallthroughCasesInSwitch": false,
        echo     "resolveJsonModule": true,
        echo     "esModuleInterop": true
        echo   }
        echo }
    ) > "%TEMPLATE_DIR%\tsconfig.json"
)

:: Create ESLint configuration
if not exist "%TEMPLATE_DIR%\.eslintrc.js" (
    (
        echo module.exports = {
        echo   parser: '@typescript-eslint/parser',
        echo   parserOptions: {
        echo     project: 'tsconfig.json',
        echo     tsconfigRootDir: __dirname,
        echo     sourceType: 'module',
        echo   },
        echo   plugins: ['@typescript-eslint/eslint-plugin', 'security'],
        echo   extends: [
        echo     '@typescript-eslint/recommended',
        echo     'plugin:security/recommended',
        echo     'prettier',
        echo   ],
        echo   root: true,
        echo   env: {
        echo     node: true,
        echo     jest: true,
        echo   },
        echo   ignorePatterns: ['.eslintrc.js', 'dist/**/*', 'node_modules/**/*'],
        echo   rules: {
        echo     '@typescript-eslint/interface-name-prefix': 'off',
        echo     '@typescript-eslint/explicit-function-return-type': 'off',
        echo     '@typescript-eslint/explicit-module-boundary-types': 'off',
        echo     '@typescript-eslint/no-explicit-any': 'warn',
        echo     'security/detect-object-injection': 'off',
        echo   },
        echo }^;
    ) > "%TEMPLATE_DIR%\.eslintrc.js"
)

:: Create Prettier configuration
if not exist "%TEMPLATE_DIR%\.prettierrc" (
    (
        echo {
        echo   "singleQuote": true,
        echo   "trailingComma": "all",
        echo   "semi": true,
        echo   "printWidth": 100,
        echo   "tabWidth": 2,
        echo   "useTabs": false,
        echo   "bracketSpacing": true,
        echo   "arrowParens": "always"
        echo }
    ) > "%TEMPLATE_DIR%\.prettierrc"
)

echo.
echo %GREEN%✅ Cookiecutter template structure created successfully!%NC%
echo.
echo %BOLD%%BLUE%=== Template Structure ===%NC%
echo %CYAN%📁 Core directories created:%NC%
echo   - src/shared/^{config,guards,filters,interceptors,etc.^}
echo   - src/features/auth
echo   - src/infrastructure/^{database,messaging,external^}
echo   - test/^{unit,integration,e2e,fixtures^}
echo   - i18n/^{en,am^}
echo.
echo %CYAN%📄 Essential files created:%NC%
echo   - package.json, Dockerfile, README.md
echo   - TypeScript, ESLint, Prettier configurations
echo   - Basic NestJS modules and services
echo   - Environment and localization files
echo.
echo %YELLOW%ℹ️  Note:%NC% Some files contain placeholder content that will be
echo    expanded when implementing the full cookiecutter template.
echo.
echo %GREEN%Ready to create microservices! 🚀%NC% 