# Common docker-compose method and arguments
COMPOSE = docker-compose -f docker-compose.yml -p tinlake

# Tasks
build: ## Build containers
    $(COMPOSE) build

up: ## Start containers in background
    $(COMPOSE) up -d

down: ## Stop containers
    $(COMPOSE) down

logs: ## Follow container logs
    $(COMPOSE) logs -f --tail 100

clean: ## Remove volumes
    docker volume prune

## Prune all volumes and start containers
start: | clean up

.PHONY: build up down logs clean start