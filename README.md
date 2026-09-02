# 🤖 Antigravity Agent Skills

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](./CONTRIBUTING.md)
[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://opensource.org/)

An open-source, curated collection of modular skills for **Google Antigravity** and compatible AI coding agents.

Equip your AI coding agent with specialized workflows, code review checklists, and automated procedures across any workspace or project.

---

## ⚡ Quickstart: Instant Install via `npx skills`

Install skills directly into your project using the universal `skills` package manager:

### Install to Current Project (`.agents/skills/`)
```bash
# Interactive selection of skills from this repository
npx skills add Ayobami6/skills

# Install a specific skill directly
npx skills add Ayobami6/skills --skill pr-reviewer
```

### Install Globally Across All Projects (`~/.gemini/config/skills/`)
```bash
npx skills add Ayobami6/skills --global
```

### Update Installed Skills
```bash
# Keep all your installed skills up to date with the latest upstream revisions
npx skills update
```

---

## 📦 Available Skills

| Skill | Description | Direct Install Command | Location |
| :--- | :--- | :--- | :--- |
| **`clean-code`** | Enforces software craftsmanship and programming best practices: SOLID principles, design patterns, TDD, defensive error handling, refactoring code smells, and modular architecture across TypeScript, Python, Go, Rust, and Java. | `npx skills add Ayobami6/skills --skill clean-code` | [`skills/clean-code/SKILL.md`](./skills/clean-code/SKILL.md) |
| **`pr-reviewer`** | Reviews pull requests and git diffs for correctness, security vulnerabilities (OWASP), performance bottlenecks, test coverage, and code architecture. Discovers open PRs and submits reviews with approvals, change requests, and inline code suggestions directly via GitHub MCP tools. | `npx skills add Ayobami6/skills --skill pr-reviewer` | [`skills/pr-reviewer/SKILL.md`](./skills/pr-reviewer/SKILL.md) |

---

## 🛠️ Alternative Installation Methods

### Method 1: Global Setup via Git (Always in sync)

1. **Clone this repository** to a local directory:
   ```bash
   git clone https://github.com/Ayobami6/skills.git ~/projects/skills
   ```

2. **Register the skills in your Antigravity global config**:
   Create or edit `~/.gemini/config/skills.json`:
   ```json
   {
     "entries": [
       {
         "path": "~/projects/skills/skills"
       }
     ]
   }
   ```

3. **Stay Updated**:
   ```bash
   cd ~/projects/skills && git pull
   ```

---

### Method 2: Git Submodule (For Teams)

1. **Add as a Git Submodule** in your project repository:
   ```bash
   git submodule add https://github.com/Ayobami6/skills.git .agents/shared-skills
   ```

2. **Configure `.agents/skills.json`** at the root of your project:
   ```json
   {
     "entries": [
       {
         "path": ".agents/shared-skills/skills"
       }
     ]
   }
   ```

---

## 🤝 Contributing

We welcome community contributions! Whether it's adding a new skill, refining checklists, or fixing typos:

1. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for authoring guidelines and formatting standards.
2. Use the [`templates/skill-template`](./templates/skill-template) as a starting boilerplate.
3. Open a Pull Request!

---

## 📄 License

This repository is distributed under the [MIT License](./LICENSE).
