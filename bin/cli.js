#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const LOCAL_SKILLS_DIR = path.join(REPO_ROOT, 'skills');

const GITHUB_REPO = 'Ayobami6/skills';
const GITHUB_BRANCH = 'main';
const RAW_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`;
const API_BASE_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/skills`;

// ANSI Color Helpers
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function log(msg = '') {
  console.log(msg);
}

function success(msg) {
  console.log(`${colors.green}✔${colors.reset} ${msg}`);
}

function info(msg) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
}

function warn(msg) {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function error(msg) {
  console.error(`${colors.red}✖${colors.reset} ${msg}`);
}

// HTTPS Fetch Helper
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'skills-cli' } }, (res) => {
      let data = '';
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'skills-cli' } }, (res) => {
      let data = '';
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Copy Directory Recursively
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Download Directory from GitHub
async function downloadGitHubDir(remoteSubPath, destDir) {
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${remoteSubPath}`;
  const contents = await fetchJson(apiUrl);

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  for (const item of contents) {
    const destPath = path.join(destDir, item.name);
    if (item.type === 'dir') {
      await downloadGitHubDir(`${remoteSubPath}/${item.name}`, destPath);
    } else if (item.type === 'file') {
      const text = await fetchText(item.download_url);
      fs.writeFileSync(destPath, text, 'utf-8');
    }
  }
}

// Get Available Skills
async function getAvailableSkills() {
  if (fs.existsSync(LOCAL_SKILLS_DIR)) {
    const dirs = fs.readdirSync(LOCAL_SKILLS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    return dirs;
  }

  try {
    const contents = await fetchJson(API_BASE_URL);
    return contents.filter((item) => item.type === 'dir').map((item) => item.name);
  } catch (err) {
    return ['pr-reviewer'];
  }
}

// Extract Description from SKILL.md
function extractSkillDescription(skillName) {
  const localSkillMd = path.join(LOCAL_SKILLS_DIR, skillName, 'SKILL.md');
  if (fs.existsSync(localSkillMd)) {
    const content = fs.readFileSync(localSkillMd, 'utf-8');
    const match = content.match(/description:\s*>?-?\s*([^\n\r]+(?:\n[ \t]+[^\n\r]+)*)/i);
    if (match && match[1]) {
      return match[1].replace(/\n[ \t]+/g, ' ').trim();
    }
  }
  return 'Specialized agent skill for Antigravity';
}

// Command: list
async function listSkills() {
  log(`\n${colors.bold}${colors.cyan}🤖 Available Agent Skills (${GITHUB_REPO})${colors.reset}\n`);
  const skills = await getAvailableSkills();

  if (skills.length === 0) {
    warn('No skills found in repository.');
    return;
  }

  for (const name of skills) {
    const desc = extractSkillDescription(name);
    log(`  ${colors.bold}${colors.green}• ${name}${colors.reset}`);
    log(`    ${colors.dim}${desc}${colors.reset}\n`);
  }

  log(`${colors.dim}To install a skill in your project:${colors.reset}`);
  log(`  ${colors.yellow}npx @ayobami6/skills add <skill-name>${colors.reset}\n`);
  log(`${colors.dim}To install globally on your machine:${colors.reset}`);
  log(`  ${colors.yellow}npx @ayobami6/skills add --global <skill-name>${colors.reset}\n`);
}

// Command: add
async function addSkill(skillNames, options) {
  const available = await getAvailableSkills();
  const isGlobal = options.global || options.g;

  const targetBaseDir = isGlobal
    ? path.join(os.homedir(), '.gemini', 'config', 'skills')
    : path.resolve(process.cwd(), '.agents', 'skills');

  if (skillNames.includes('--all') || skillNames.includes('all')) {
    skillNames = available;
  }

  if (skillNames.length === 0) {
    warn('Please specify a skill name to add.');
    log(`Run ${colors.yellow}npx @ayobami6/skills list${colors.reset} to view available skills.\n`);
    return;
  }

  for (const skill of skillNames) {
    if (skill.startsWith('-')) continue;

    if (!available.includes(skill)) {
      error(`Skill "${skill}" not found.`);
      log(`Available skills: ${available.join(', ')}\n`);
      continue;
    }

    const destDir = path.join(targetBaseDir, skill);
    info(`Installing skill ${colors.bold}${skill}${colors.reset} -> ${colors.dim}${destDir}${colors.reset}...`);

    try {
      const localSrc = path.join(LOCAL_SKILLS_DIR, skill);
      if (fs.existsSync(localSrc)) {
        copyDirRecursive(localSrc, destDir);
      } else {
        await downloadGitHubDir(`skills/${skill}`, destDir);
      }
      success(`Successfully installed ${colors.bold}${skill}${colors.reset}!`);
    } catch (err) {
      error(`Failed to install ${skill}: ${err.message}`);
    }
  }

  log();
  if (isGlobal) {
    info(`Installed globally in ${colors.dim}${targetBaseDir}${colors.reset}`);
    info(`Skills in ~/.gemini/config/skills are automatically discovered across all projects.`);
  } else {
    info(`Installed project-locally in ${colors.dim}${targetBaseDir}${colors.reset}`);
    info(`Antigravity automatically discovers skills in your project's ${colors.bold}.agents/skills/${colors.reset} folder.`);
  }
  log();
}

// Show Help
function showHelp() {
  log(`
${colors.bold}${colors.cyan}🤖 Agent Skills CLI${colors.reset}
Easily install and manage Antigravity AI agent skills across projects.

${colors.bold}USAGE:${colors.reset}
  $ npx @ayobami6/skills <command> [options]
  $ npx skills add <skill-name>

${colors.bold}COMMANDS:${colors.reset}
  ${colors.green}list${colors.reset}                      List all available skills with descriptions
  ${colors.green}add <skill-name>${colors.reset}          Install a skill into your current project (.agents/skills/)
  ${colors.green}add --all${colors.reset}                 Install all available skills
  ${colors.green}help${colors.reset}                      Show this help message

${colors.bold}OPTIONS:${colors.reset}
  ${colors.yellow}-g, --global${colors.reset}              Install globally to ~/.gemini/config/skills/
  ${colors.yellow}-h, --help${colors.reset}                Display help information

${colors.bold}EXAMPLES:${colors.reset}
  $ npx @ayobami6/skills list
  $ npx @ayobami6/skills add pr-reviewer
  $ npx @ayobami6/skills add --global pr-reviewer
  $ npx @ayobami6/skills add --all
`);
}

// Main CLI Entrypoint
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || args.includes('-h') || args.includes('--help')) {
    showHelp();
    return;
  }

  if (command === 'list' || command === 'ls') {
    await listSkills();
    return;
  }

  if (command === 'add' || command === 'install' || command === 'get') {
    const targets = args.slice(1).filter((a) => !a.startsWith('-'));
    const isGlobal = args.includes('-g') || args.includes('--global');
    const isAll = args.includes('--all') || targets.includes('all');
    if (isAll && !targets.includes('all')) targets.push('all');
    await addSkill(targets, { global: isGlobal });
    return;
  }

  // If user typed: npx @ayobami6/skills pr-reviewer
  const available = await getAvailableSkills();
  if (available.includes(command)) {
    const isGlobal = args.includes('-g') || args.includes('--global');
    await addSkill([command], { global: isGlobal });
    return;
  }

  error(`Unknown command: "${command}"`);
  showHelp();
}

main().catch((err) => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});

