install_node:
	@echo "Installing npm dependencies"
	@npm install

install_uv:
	@echo "Running local uv install"
	@if [ -f "uv" ]; then echo "Downloading uv" && curl -LsSf https://astral.sh/uv/install.sh | sh; else echo "uv already installed"; fi
	@uv self update || true
	@uv python install
	@uv sync

install_precommit:
	@pre-commit install

precommit:
	pre-commit run --all-files

prod:
	rm -rf dist && npm run build

blog:
	npm run dev

summary:
	uv run builder/summary_generator.py

og:
	npx tsx scripts/generate-og.ts

install: install_uv install_skills install_precommit install_node precommit

# ----- skills -----
# Authoritative skills live in skills/. Project them into the tool-specific
# directories as symlinks so Claude Code and Cursor share one source of truth.
SKILLS_SRC := skills

.PHONY: install_skills
install_skills:
	@echo "Symlinking skills/ into .claude/skills and .cursor/skills"
	@rm -rf .claude/skills .cursor/skills
	@mkdir -p .claude/skills .cursor/skills
	@for path in $(SKILLS_SRC)/*/; do \
		name=$$(basename "$$path"); \
		ln -s "../../$(SKILLS_SRC)/$$name" ".claude/skills/$$name"; \
		ln -s "../../$(SKILLS_SRC)/$$name" ".cursor/skills/$$name"; \
	done
