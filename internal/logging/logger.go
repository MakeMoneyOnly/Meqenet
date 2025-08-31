// Package logging provides structured logging for the Meqenet platform
package logging

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// NewLogger creates a new structured logger
func NewLogger() *zap.Logger {
	config := zap.NewProductionConfig()

	// Set log level based on environment
	if os.Getenv("ENVIRONMENT") == "development" {
		config.Level = zap.NewAtomicLevelAt(zapcore.DebugLevel)
		config.Development = true
		config.Encoding = "console"
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	} else {
		config.Level = zap.NewAtomicLevelAt(zapcore.InfoLevel)
		config.Encoding = "json"
	}

	logger, err := config.Build(
		zap.AddCaller(),
		zap.AddStacktrace(zapcore.ErrorLevel),
		zap.Fields(
			zap.String("service", "meqenet"),
			zap.String("version", "1.0.0"),
		),
	)
	if err != nil {
		panic("Failed to initialize logger: " + err.Error())
	}

	return logger
}

// NewTestLogger creates a logger suitable for testing
func NewTestLogger() *zap.Logger {
	config := zap.NewDevelopmentConfig()
	config.Level = zap.NewAtomicLevelAt(zapcore.DebugLevel)

	logger, err := config.Build(
		zap.AddCaller(),
		zap.WithCaller(true),
	)
	if err != nil {
		panic("Failed to initialize test logger: " + err.Error())
	}

	return logger
}
