// Package config provides configuration management
package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/spf13/viper"
)

// Config holds all configuration for the application
type Config struct {
	Environment string `mapstructure:"ENVIRONMENT"`
	Port        int    `mapstructure:"PORT"`

	// Database configuration
	Database DatabaseConfig `mapstructure:",squash"`

	// Redis configuration
	Redis RedisConfig `mapstructure:",squash"`

	// Security configuration
	Security SecurityConfig `mapstructure:",squash"`

	// Ethiopian localization
	Localization LocalizationConfig `mapstructure:",squash"`
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host     string `mapstructure:"DB_HOST"`
	Port     int    `mapstructure:"DB_PORT"`
	User     string `mapstructure:"DB_USER"`
	Password string `mapstructure:"DB_PASSWORD"`
	Name     string `mapstructure:"DB_NAME"`
	SSLMode  string `mapstructure:"DB_SSL_MODE"`
}

// RedisConfig holds Redis configuration
type RedisConfig struct {
	Host     string `mapstructure:"REDIS_HOST"`
	Port     int    `mapstructure:"REDIS_PORT"`
	Password string `mapstructure:"REDIS_PASSWORD"`
	DB       int    `mapstructure:"REDIS_DB"`
}

// SecurityConfig holds security configuration
type SecurityConfig struct {
	JWTSecret     string `mapstructure:"JWT_SECRET"`
	JWTExpiry     string `mapstructure:"JWT_EXPIRY"`
	EncryptionKey string `mapstructure:"ENCRYPTION_KEY"`
}

// LocalizationConfig holds localization configuration
type LocalizationConfig struct {
	DefaultLanguage string `mapstructure:"DEFAULT_LANGUAGE"`
	TimeZone        string `mapstructure:"TIMEZONE"`
}

// Load loads configuration from environment variables and config files
func Load() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")

	// Enable reading from environment variables
	viper.AutomaticEnv()

	// Set defaults
	setDefaults()

	// Read config file (optional)
	if err := viper.ReadInConfig(); err != nil {
		// Config file is optional, so we ignore the error if the file doesn't exist
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	// Validate configuration
	if err := validateConfig(&config); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return &config, nil
}

// setDefaults sets default configuration values
func setDefaults() {
	// Application defaults
	viper.SetDefault("ENVIRONMENT", "development")
	viper.SetDefault("PORT", 8080)

	// Database defaults
	viper.SetDefault("DB_HOST", "localhost")
	viper.SetDefault("DB_PORT", 5432)
	viper.SetDefault("DB_USER", "meqenet")
	viper.SetDefault("DB_NAME", "meqenet")
	viper.SetDefault("DB_SSL_MODE", "require")

	// Redis defaults
	viper.SetDefault("REDIS_HOST", "localhost")
	viper.SetDefault("REDIS_PORT", 6379)
	viper.SetDefault("REDIS_DB", 0)

	// Security defaults
	viper.SetDefault("JWT_EXPIRY", "24h")

	// Localization defaults
	viper.SetDefault("DEFAULT_LANGUAGE", "en")
	viper.SetDefault("TIMEZONE", "Africa/Addis_Ababa")
}

// validateConfig validates the configuration
func validateConfig(config *Config) error {
	if config.JWTSecret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}

	if config.Database.Host == "" {
		return fmt.Errorf("DB_HOST is required")
	}

	if config.Database.User == "" {
		return fmt.Errorf("DB_USER is required")
	}

	if config.Database.Name == "" {
		return fmt.Errorf("DB_NAME is required")
	}

	if config.EncryptionKey == "" {
		return fmt.Errorf("ENCRYPTION_KEY is required")
	}

	return nil
}

// LoadFromEnv loads configuration from environment variables
func LoadFromEnv() (*Config, error) {
	config := &Config{
		Environment: getEnvString("ENVIRONMENT", "development"),
		Port:        getEnvInt("PORT", 8080),
		Database: DatabaseConfig{
			Host:     getEnvString("DB_HOST", "localhost"),
			Port:     getEnvInt("DB_PORT", 5432),
			User:     getEnvString("DB_USER", "meqenet"),
			Password: getEnvString("DB_PASSWORD", ""),
			Name:     getEnvString("DB_NAME", "meqenet"),
			SSLMode:  getEnvString("DB_SSL_MODE", "require"),
		},
		Redis: RedisConfig{
			Host:     getEnvString("REDIS_HOST", "localhost"),
			Port:     getEnvInt("REDIS_PORT", 6379),
			Password: getEnvString("REDIS_PASSWORD", ""),
			DB:       getEnvInt("REDIS_DB", 0),
		},
		Security: SecurityConfig{
			JWTSecret:     getEnvString("JWT_SECRET", ""),
			JWTExpiry:     getEnvString("JWT_EXPIRY", "24h"),
			EncryptionKey: getEnvString("ENCRYPTION_KEY", ""),
		},
		Localization: LocalizationConfig{
			DefaultLanguage: getEnvString("DEFAULT_LANGUAGE", "en"),
			TimeZone:        getEnvString("TIMEZONE", "Africa/Addis_Ababa"),
		},
	}

	if err := validateConfig(config); err != nil {
		return nil, err
	}

	return config, nil
}

// Helper functions for environment variable parsing
func getEnvString(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
