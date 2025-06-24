# Meqenet Microservice Generator PowerShell Script
# Compatible with Windows PowerShell and PowerShell Core

param(
    [string]$ServiceName,
    [string]$ServiceSlug,
    [string]$ServiceDescription,
    [string]$AuthorName,
    [string]$AuthorEmail,
    [int]$ServicePort = 3000,
    [switch]$NeedsDatabase,
    [switch]$IsGrpcService,
    [switch]$IsEventDriven,
    [switch]$NoInteractive
)

# Colors for console output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Magenta = "`e[35m"
$Cyan = "`e[36m"
$Bold = "`e[1m"
$Reset = "`e[0m"

function Write-ColorText {
    param([string]$Text, [string]$Color = $Reset)
    Write-Host "$Color$Text$Reset"
}

function Write-Logo {
    Write-Host ""
    Write-ColorText "  __  __                             _   " $Cyan
    Write-ColorText " |  \/  | ___  __ _  ___ _ __   ___| |_ " $Cyan
    Write-ColorText " | |\/| |/ _ \/ _\` |/ _ \ '_ \ / _ \ __|" $Cyan
    Write-ColorText " | |  | |  __/ (_| |  __/ | | |  __/ |_ " $Cyan
    Write-ColorText " |_|  |_|\___|\__, |\___|_| |_|\___|\__|" $Cyan
    Write-ColorText "                 |_|                   " $Cyan
    Write-ColorText "       Microservice Generator" $Cyan
    Write-Host ""
}

function Test-Prerequisites {
    # Check if cookiecutter is installed
    try {
        $null = Get-Command cookiecutter -ErrorAction Stop
    }
    catch {
        Write-ColorText "Error: cookiecutter is not installed or not in PATH" $Red
        Write-ColorText "Please install it with: pip install cookiecutter" $Yellow
        exit 1
    }

    # Check if we're in the Meqenet repository root
    if (-not (Test-Path "templates\microservice\cookiecutter.json")) {
        Write-ColorText "Error: Please run this script from the Meqenet repository root" $Red
        Write-ColorText "The templates/microservice directory was not found" $Yellow
        exit 1
    }
}

function Get-UserInput {
    param([string]$Prompt, [string]$Default = "", [switch]$Required)
    
    do {
        if ($Default) {
            $input = Read-Host "$Prompt [$Default]"
            if ([string]::IsNullOrWhiteSpace($input)) {
                $input = $Default
            }
        } else {
            $input = Read-Host $Prompt
        }
        
        if ($Required -and [string]::IsNullOrWhiteSpace($input)) {
            Write-ColorText "This field is required" $Red
        }
    } while ($Required -and [string]::IsNullOrWhiteSpace($input))
    
    return $input
}

function Get-YesNoInput {
    param([string]$Prompt, [bool]$Default = $false)
    
    $defaultText = if ($Default) { "Y/n" } else { "y/N" }
    
    do {
        $input = Read-Host "$Prompt [$defaultText]"
        if ([string]::IsNullOrWhiteSpace($input)) {
            return $Default
        }
        $input = $input.ToLower()
    } while ($input -notin @("y", "yes", "n", "no"))
    
    return $input -in @("y", "yes")
}

# Main script execution
Clear-Host
Write-Logo

Write-ColorText "=== Meqenet Microservice Generator ===" "$Bold$Blue"
Write-Host ""
Write-ColorText "This will create a new microservice using our standard template." $Yellow
Write-ColorText "Press Ctrl+C at any time to cancel." $Yellow
Write-Host ""

Test-Prerequisites

if (-not $NoInteractive) {
    # Gather service information interactively
    if (-not $ServiceName) {
        $ServiceName = Get-UserInput "Service name (e.g., 'User Authentication Service')" -Required
    }
    
    if (-not $ServiceSlug) {
        $ServiceSlug = Get-UserInput "Service slug (e.g., 'auth-service')" -Required
    }
    
    if (-not $ServiceDescription) {
        $ServiceDescription = Get-UserInput "Service description" "A microservice for $ServiceName"
    }
    
    if (-not $AuthorName) {
        $AuthorName = Get-UserInput "Author name" $env:USERNAME -Required
    }
    
    if (-not $AuthorEmail) {
        $AuthorEmail = Get-UserInput "Author email" -Required
    }
    
    if ($ServicePort -eq 3000) {
        $portInput = Get-UserInput "Service port" "3000"
        if ($portInput) {
            $ServicePort = [int]$portInput
        }
    }

    Write-Host ""
    Write-ColorText "=== Service Configuration ===" $Cyan

    if (-not $PSBoundParameters.ContainsKey('NeedsDatabase')) {
        $NeedsDatabase = Get-YesNoInput "Does this service need a database?"
    }

    if (-not $PSBoundParameters.ContainsKey('IsGrpcService')) {
        $IsGrpcService = Get-YesNoInput "Is this a gRPC service?"
    }

    if (-not $PSBoundParameters.ContainsKey('IsEventDriven')) {
        $IsEventDriven = Get-YesNoInput "Is this an event-driven service?"
    }
}

# Display summary
Write-Host ""
Write-ColorText "=== Service Summary ===" "$Bold$Magenta"
Write-ColorText "Name: $ServiceName" $Cyan
Write-ColorText "Slug: $ServiceSlug" $Cyan
Write-ColorText "Description: $ServiceDescription" $Cyan
Write-ColorText "Author: $AuthorName <$AuthorEmail>" $Cyan
Write-ColorText "Port: $ServicePort" $Cyan
Write-ColorText "Database: $(if ($NeedsDatabase) {'Yes'} else {'No'})" $Cyan
Write-ColorText "gRPC: $(if ($IsGrpcService) {'Yes'} else {'No'})" $Cyan
Write-ColorText "Event-driven: $(if ($IsEventDriven) {'Yes'} else {'No'})" $Cyan
Write-Host ""

if (-not $NoInteractive) {
    $confirm = Get-YesNoInput "Create this service?" $true
    if (-not $confirm) {
        Write-ColorText "Service creation cancelled." $Yellow
        exit 0
    }
}

Write-Host ""
Write-ColorText "Creating service..." $Yellow

# Create backend services directory if it doesn't exist
if (-not (Test-Path "backend\services")) {
    New-Item -ItemType Directory -Path "backend\services" -Force | Out-Null
}

# Run cookiecutter using cmd to handle arguments properly
try {
    Push-Location "backend\services"
    
    # Build the command string with proper escaping
    $templatePath = "..\..\templates\microservice"
    $cmdArgs = @(
        "cookiecutter"
        "`"$templatePath`""
        "--no-input"
        "service_name=`"$ServiceName`""
        "service_slug=$ServiceSlug"
        "service_description=`"$ServiceDescription`""
        "author_name=`"$AuthorName`""
        "author_email=$AuthorEmail"
        "service_port=$ServicePort"
        "needs_database=$(if ($NeedsDatabase) {'y'} else {'n'})"
        "is_grpc_service=$(if ($IsGrpcService) {'y'} else {'n'})"
        "is_event_driven=$(if ($IsEventDriven) {'y'} else {'n'})"
    )
    
    $cmdString = $cmdArgs -join " "
    Write-Host "Debug: Running command: $cmdString" -ForegroundColor Gray
    
    $result = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmdString -Wait -PassThru -NoNewWindow
    
    if ($result.ExitCode -ne 0) {
        throw "Cookiecutter failed with exit code $($result.ExitCode)"
    }
    
    Write-Host ""
    Write-ColorText "✅ Service created successfully!" $Green
    Write-Host ""
    Write-ColorText "=== Next Steps ===" "$Bold$Blue"
    Write-ColorText "1. cd backend\services\$ServiceSlug" $Cyan
    Write-ColorText "2. yarn install" $Cyan
    Write-ColorText "3. yarn start:dev" $Cyan
    Write-Host ""
    Write-ColorText "📚 Documentation: http://localhost:$ServicePort/api/docs" $Yellow
    Write-ColorText "🏥 Health Check: http://localhost:$ServicePort/health" $Yellow
    Write-ColorText "📊 Metrics: http://localhost:$ServicePort/metrics" $Yellow
    Write-Host ""
    Write-ColorText "Happy coding! 🚀" $Green
}
catch {
    Write-ColorText "Error: Failed to create service - $($_.Exception.Message)" $Red
    exit 1
}
finally {
    Pop-Location
} 