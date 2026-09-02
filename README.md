# 🤖 Antigravity Agent Skills

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](./CONTRIBUTING.md)
[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://opensource.org/)

An open-source, curated collection of modular skills for **Google Antigravity** and compatible AI coding agents.

Keep your AI agent equipped with the same specialized workflows, review checklists, and automated procedures across all your projects and machines.

---

## 📦 Available Skills

| Skill | Description | Location |
| :--- | :--- | :--- |
| **`pr-reviewer`** | Reviews pull requests and git diffs for correctness, security vulnerabilities (OWASP), performance, test coverage, and code design. Discovers open PRs and submits reviews with approvals, change requests, and inline code suggestions directly via GitHub MCP tools. | [`skills/pr-reviewer/SKILL.md`](./skills/pr-reviewer/SKILL.md) |

---

## ⚡ Quickstart: Use Across Any Project

### Method 1: Global Setup (Recommended)
Make all skills in this repo globally available to your agent across **every project and workspace** on your machine:

1. **Clone this repository** to a local directory (e.g., `~/projects/skills`):
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
   Whenever new skills or updates are published, pull the latest changes:
   ```bash
   cd ~/projects/skills && git pull
   ```

---

### Method 2: Project-Level / Team Sharing
If you want to bundle these skills inside a specific project repository so your entire team automatically shares them:

1. **Add as a Git Submodule**:
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

## 🛠️ Contributing

We welcome community contributions! Whether it's adding a new skill, refining checklists, or fixing typos:

1. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for skill authoring guidelines and formatting standards.
2. Use the [`templates/skill-template`](./templates/skill-template) as a starting boilerplate.
3. Open a Pull Request!

---

## 📄 License

This repository is distributed under the [MIT License](./LICENSE).
