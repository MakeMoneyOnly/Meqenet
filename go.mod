module github.com/meqenet/meqenet

go 1.21

require (
	github.com/sirupsen/logrus v1.9.3
	github.com/spf13/viper v1.17.0
	gopkg.in/yaml.v3 v3.0.1
)

// Enterprise security and compliance dependencies
require (
	github.com/sigstore/cosign/v2 v2.2.3
	github.com/slsa-framework/slsa-github-generator-go v0.0.1
	github.com/in-toto/in-toto-golang v0.9.0
)

// Ethiopian localization
require (
	github.com/kljensen/snowball v0.0.0-20230428015230-3a1bcee1c18b // Amharic text processing
)

// Financial compliance
require (
	github.com/shopspring/decimal v1.3.1 // Precise decimal calculations for financial operations
	github.com/robfig/cron/v3 v3.0.1   // Scheduled financial operations
)
