// Meqenet.et - Enterprise BNPL Platform
// Main application entry point
// NBE Compliant Ethiopian Financial Services Platform

package main

import (
	"fmt"
	"log"
	"os"
	"runtime"

	"github.com/meqenet/meqenet/internal/app"
	"github.com/meqenet/meqenet/internal/config"
	"github.com/meqenet/meqenet/internal/logging"
)

const (
	AppName    = "Meqenet"
	AppVersion = "1.0.0"
	AppDescription = "Ethiopian BNPL (Buy Now Pay Later) Platform"
)

func main() {
	// Initialize structured logging
	logger := logging.NewLogger()
	defer logger.Sync()

	logger.Info("Starting Meqenet BNPL Platform",
		"version", AppVersion,
		"go_version", runtime.Version(),
		"platform", fmt.Sprintf("%s/%s", runtime.GOOS, runtime.GOARCH),
	)

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("Failed to load configuration", "error", err)
	}

	// Initialize application
	application, err := app.New(cfg, logger)
	if err != nil {
		logger.Fatal("Failed to initialize application", "error", err)
	}

	// Display startup banner
	displayBanner()

	// Start the application
	if err := application.Start(); err != nil {
		logger.Fatal("Application failed to start", "error", err)
	}
}

func displayBanner() {
	banner := `
███╗░░░███╗███████╗░██████╗░███████╗███╗░░██╗███████╗████████╗
████╗░████║██╔════╝██╔═══██╗██╔════╝████╗░██║██╔════╝╚══██╔══╝
██╔████╔██║█████╗░░██║██╗██║█████╗░░██╔██╗██║█████╗░░░░░██║░░░
██║╚██╔╝██║██╔══╝░░╚██████╔╝██╔══╝░░██║╚████║██╔══╝░░░░░██║░░░
██║░╚═╝░██║███████╗░╚═██╔═╝░███████╗██║░╚███║███████╗░░░██║░░░
╚═╝░░░░░╚═╝╚══════╝░░░╚═╝░░░╚══════╝╚═╝░░╚══╝╚══════╝░░░╚═╝░░░

═══════════════════════════════════════════════════════════════════
🇪🇹 Ethiopian BNPL Platform - Enterprise Edition
🇪🇹 NBE Compliant Financial Services
🇪🇹 Built for Ethiopian Market Excellence
═══════════════════════════════════════════════════════════════════

Features:
• Pay in 4 - Flexible installment payments
• Pay in 30 - Extended payment terms
• Pay in Full - Immediate settlement
• Pay Over Time - Interest-bearing loans
• Merchant Marketplace - Integrated e-commerce
• Cashback Rewards - Loyalty program
• Real-time Analytics - Business intelligence
• Multi-language Support - Amharic & English

Security:
• End-to-end encryption
• NBE regulatory compliance
• Real-time fraud detection
• Audit trail logging
• Ethiopian data residency

═══════════════════════════════════════════════════════════════════
`
	fmt.Println(banner)
}

// Version returns the application version
func Version() string {
	return AppVersion
}

// Name returns the application name
func Name() string {
	return AppName
}

// Description returns the application description
func Description() string {
	return AppDescription
}
