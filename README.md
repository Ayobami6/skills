# Agent Skills Repository

A centralized collection of custom agent skills that can be synchronized via GitHub and used across any workspace or project.

---

## Included Skills

| Skill | Description | Location |
| :--- | :--- | :--- |
| **`pr-reviewer`** | Reviews pull requests and git diffs for correctness, security, performance, test coverage, and code quality. | [`skills/pr-reviewer/SKILL.md`](./skills/pr-reviewer/SKILL.md) |

---

## How to Use Across Any Project

### Method 1: Global Setup (All Projects on your Machine)

To make all skills in this repo available in every project you work on:

1. Clone this repository (or keep your existing clone) at a fixed location, e.g. `~/projects/skills`:
   ```bash
   git clone https://github.com/Ayobami6/skills.git ~/projects/skills
   ```

2. Register the path in your global config file `~/.gemini/config/skills.json`:
   ```json
   {
     "entries": [
       {
         "path": "~/projects/skills/skills"
       }
     ]
   }
   ```

3. Whenever you add or update skills, push to GitHub. On any machine, simply run `git pull` in this folder to immediately update your agent's capabilities everywhere.

---

### Method 2: Project-Level / Team Sharing

To share this skill set with teammates in a specific repository:

1. Add this repository as a git submodule in your project:
   ```bash
   git submodule add https://github.com/Ayobami6/skills.git .agents/shared-skills
   ```

2. Create `.agents/skills.json` in your project root:
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

## Creating a New Skill

To add a new skill to this repository:

1. Create a new directory under `skills/<skill-name>/`.
2. Create a `SKILL.md` with YAML frontmatter (`name` and `description`).
3. Add any optional `references/`, `scripts/`, or `examples/`.
4. Commit and push to GitHub!
