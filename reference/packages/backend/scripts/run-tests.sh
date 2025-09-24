#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting test suite for Meqenet backend...${NC}"

# Run unit tests
echo -e "\n${YELLOW}Running unit tests...${NC}"
npm run test

# Check if unit tests passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Unit tests passed${NC}"
else
  echo -e "${RED}✗ Unit tests failed${NC}"
  exit 1
fi

# Run e2e tests
echo -e "\n${YELLOW}Running end-to-end tests...${NC}"
npm run test:e2e

# Check if e2e tests passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ End-to-end tests passed${NC}"
else
  echo -e "${RED}✗ End-to-end tests failed${NC}"
  exit 1
fi

# Run test coverage
echo -e "\n${YELLOW}Generating test coverage report...${NC}"
npm run test:cov

# Check if coverage report was generated
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Coverage report generated${NC}"
else
  echo -e "${RED}✗ Failed to generate coverage report${NC}"
  exit 1
fi

echo -e "\n${GREEN}All tests completed successfully!${NC}"
