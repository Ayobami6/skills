# Contributing to Agent Skills

Thank you for your interest in contributing! This project is an open-source collection of reusable AI agent skills designed for Google Antigravity and compatible AI coding agents.

---

## 🛠️ How to Add a New Skill

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/skills.git
   cd skills
   git checkout -b feat/add-my-awesome-skill
   ```

2. **Create the skill directory**:
   Create a folder under `skills/<skill-name>/` (use lowercase, hyphen-separated naming):
   ```text
   skills/<skill-name>/
   ├── SKILL.md                 # Required: Main instruction file with YAML frontmatter
   ├── references/              # Optional: Deep dive documentation, checklists, templates
   └── scripts/                 # Optional: Helper shell/python scripts
   ```

3. **Author the `SKILL.md`**:
   The `SKILL.md` must start with YAML frontmatter containing `name` and `description`:
   ```markdown
   ---
   name: your-skill-name
   description: >-
     A clear, specific description of what the skill does AND the exact trigger scenarios
     (e.g., "Use whenever the user asks to deploy to Kubernetes, debug Helm charts, etc.").
   ---

   # Your Skill Title

   Clear step-by-step instructions for the agent...
   ```

4. **Follow Best Practices**:
   - **Progressive Disclosure**: Keep `SKILL.md` focused on core procedures. Move extensive manuals or reference checklists to `references/` files.
   - **Actionable & Specific**: Provide concrete command shapes, tool schemas, or verification steps.
   - **No Redundancy**: Avoid generic coding advice the model already knows; focus on domain-specific rules, edge cases, and runbooks.

5. **Update the Root `README.md`**:
   Add your new skill to the table in `README.md`.

6. **Submit a Pull Request**:
   Push your branch and open a PR with a clear description of the new skill and its use cases.

---

## 📜 Code of Conduct

Please treat all contributors and users with respect. Follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

