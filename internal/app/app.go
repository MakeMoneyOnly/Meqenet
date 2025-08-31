// Package app provides the main application structure
package app

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/meqenet/meqenet/internal/config"
	"go.uber.org/zap"
)

// App represents the main application
type App struct {
	config *config.Config
	logger *zap.Logger
}

// New creates a new application instance
func New(cfg *config.Config, logger *zap.Logger) (*App, error) {
	return &App{
		config: cfg,
		logger: logger,
	}, nil
}

// Start starts the application
func (a *App) Start() error {
	a.logger.Info("Meqenet BNPL Platform starting",
		zap.String("version", "1.0.0"),
		zap.String("environment", a.config.Environment),
	)

	// Set up graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle shutdown signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Start core services
	if err := a.startServices(ctx); err != nil {
		return fmt.Errorf("failed to start services: %w", err)
	}

	a.logger.Info("Meqenet BNPL Platform started successfully")

	// Wait for shutdown signal
	<-sigChan
	a.logger.Info("Shutdown signal received, stopping services...")

	// Graceful shutdown
	if err := a.stopServices(ctx); err != nil {
		a.logger.Error("Error during shutdown", zap.Error(err))
		return err
	}

	a.logger.Info("Meqenet BNPL Platform stopped gracefully")
	return nil
}

// startServices starts all core services
func (a *App) startServices(ctx context.Context) error {
	a.logger.Info("Starting core services...")

	// TODO: Initialize database connections
	// TODO: Initialize Redis cache
	// TODO: Initialize message queue
	// TODO: Initialize HTTP server
	// TODO: Initialize payment processors
	// TODO: Initialize fraud detection
	// TODO: Initialize analytics

	a.logger.Info("Core services started successfully")
	return nil
}

// stopServices stops all core services
func (a *App) stopServices(ctx context.Context) error {
	a.logger.Info("Stopping core services...")

	// TODO: Gracefully shutdown services in reverse order

	a.logger.Info("Core services stopped successfully")
	return nil
}
