# 🤖 Antigravity Agent Skills

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](./CONTRIBUTING.md)
[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://opensource.org/)

An open-source, curated collection of modular skills for **Google Antigravity** and compatible AI coding agents.

Equip your AI agents with specialized workflows, review checklists, and automated procedures across all your projects.

---

## ⚡ Instant Install via `npx`

You can add skills directly to any project without cloning or installing anything:

### Directly from GitHub (No NPM Publish Needed)
```bash
# List all available skills
npx github:Ayobami6/skills list

# Add a skill to your current project (.agents/skills/)
npx github:Ayobami6/skills add pr-reviewer

# Add all skills to your project
npx github:Ayobami6/skills add --all

# Add a skill globally for all projects on your machine (~/.gemini/config/skills/)
npx github:Ayobami6/skills add --global pr-reviewer
```

### From NPM Registry (If Published)
```bash
npx @ayobami6/skills add pr-reviewer
```

---

## 📦 Available Skills

| Skill | Description | Location |
| :--- | :--- | :--- |
| **`pr-reviewer`** | Reviews pull requests and git diffs for correctness, security vulnerabilities (OWASP), performance, test coverage, and code design. Discovers open PRs and submits reviews with approvals, change requests, and inline code suggestions directly via GitHub MCP tools. | [`skills/pr-reviewer/SKILL.md`](./skills/pr-reviewer/SKILL.md) |

---

## 🛠️ Alternative Installation Methods

### Method 1: Global Setup via Git (Always in sync)

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
   ```bash
   cd ~/projects/skills && git pull
   ```

---

### Method 2: Git Submodule (For Teams)

1. **Add as a Git Submodule** in your project:
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

## 🚀 Publishing to NPM

To make `npx @ayobami6/skills` work directly:

```bash
# 1. Log in to your npm account (free)
npm login

# 2. Publish the package publicly
npm publish --access public
```

---

## 🤝 Contributing

We welcome community contributions! Whether it's adding a new skill, refining checklists, or fixing typos:

1. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for skill authoring guidelines and formatting standards.
2. Use the [`templates/skill-template`](./templates/skill-template) as a starting boilerplate.
3. Open a Pull Request!

---

## 📄 License

This repository is distributed under the [MIT License](./LICENSE).
