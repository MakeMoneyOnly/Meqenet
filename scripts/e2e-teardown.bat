@echo off

ECHO Tearing down E2E test database...

pnpm db:reset

ECHO Database teardown complete.
