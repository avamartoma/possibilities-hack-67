.PHONY: api frontend test build

api:
	.venv/bin/uvicorn backend.main:app --reload

frontend:
	cd frontend && npm run dev

test:
	.venv/bin/python -m unittest backend.test_logic

build:
	cd frontend && npm run build
