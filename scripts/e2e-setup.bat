@echo off

ECHO Setting up E2E test database...

ECHO Running database migrations...
pnpm db:migrate

ECHO Seeding database...
pnpm db:seed

ECHO Database setup complete.
