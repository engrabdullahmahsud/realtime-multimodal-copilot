#!/bin/bash
# Makefile for Real-Time Multimodal Copilot

# Development
dev:        ## Start development servers
	@echo "Starting development environment..."
	pnpm --filter=@copilot/web dev &
	pnpm --filter=@copilot/api dev &
	wait

# Build
build:      ## Build all packages
	@echo "Building packages..."
	pnpm --recursive run build

# Test
test:       ## Run all tests
	@echo "Running tests..."
	pnpm --recursive run test

# Lint
lint:       ## Run ESLint
	@echo "Running linting..."
	pnpm --recursive run lint

# Format
format:     ## Format code
	@echo "Formatting code..."
	pnpm --recursive run format

# Type check
typecheck:  ## Run TypeScript type checking
	@echo "Running type checking..."
	pnpm --recursive run typecheck

# Database
db:         ## Run database migrations
	@echo "Running database migrations..."
	pnpm --filter=@copilot/api db:migrate

db:dev:     ## Start development database
	@echo "Starting development database..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db

# Clean
clean:      ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	rm -rf .turbo
	rm -rf node_modules
	rm -rf dist
	rm -rf build

# Start
start:      ## Start production servers
	@echo "Starting production servers..."
	pnpm --filter=@copilot/web start &
	pnpm --filter=@copilot/api start &
	wait

# Docker
docker:     ## Start all Docker containers
	@echo "Starting Docker containers..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

docker-down:  ## Stop all Docker containers
	@echo "Stopping Docker containers..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

docker-logs:  ## View Docker logs
	@echo "Viewing Docker logs..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Help
help:       ## Show this help message
	@echo "Available commands:"
	@echo "  dev          - Start development servers"
	@echo "  build        - Build all packages"
	@echo "  test         - Run all tests"
	@echo "  lint         - Run ESLint"
	@echo "  format       - Format code"
	@echo "  typecheck    - Run TypeScript type checking"
	@echo "  db           - Run database migrations"
	@echo "  db:dev       - Start development database"
	@echo "  clean        - Clean build artifacts"
	@echo "  start        - Start production servers"
	@echo "  docker       - Start all Docker containers"
	@echo "  docker-down  - Stop all Docker containers"
	@echo "  docker-logs  - View Docker logs"
	@echo "  help         - Show this help message"

.PHONY: dev build test lint format typecheck db db:dev clean start docker docker-down docker-logs help