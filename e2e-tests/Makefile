PROJECT ?= tinlake

# Common docker-compose method and arguments
COMPOSE = docker-compose -f docker-compose.yml -p ${PROJECT}

# Tasks

.PHONY: build
build: ## Build containers
	$(COMPOSE) build

.PHONY: up
up: ## Start containers in background
	$(COMPOSE) up -d

.PHONY: down
down: ## Stop containers
	$(COMPOSE) down -v

.PHONY: logs
logs: ## Follow container logs
	$(COMPOSE) logs -f --tail 100

.PHONY: clean
clean: ## Remove volumes
	docker volume prune --filter label=${PROJECT}

.PHONY: test
test: 
	bash ./scripts/waitForTest.sh

.PHONY: start
## Prune all volumes and start containers
start: | clean up