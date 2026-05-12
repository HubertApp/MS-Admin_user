NPM = npm

.PHONY: install lint test build validate docker-build docker-up docker-down clean

install:
	$(NPM) ci

lint:
	$(NPM) run lint

test:
	$(NPM) test -- --coverage --forceExit

build:
	$(NPM) run build

validate: install lint test build

docker-build:
	docker build -t ms-admin-user:local .

docker-up:
	docker compose up -d

docker-down:
	docker compose down

clean:
	rm -rf dist coverage node_modules
