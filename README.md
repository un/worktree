# 🌳 Worktree CLI

> **Transform your Git workflow with blazing-fast worktree management across multiple repositories** ⚡

[![npm version](https://img.shields.io/npm/v/@mcadam/worktree.svg)](https://www.npmjs.com/package/@mcadam/worktree)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## 🎯 Why Worktree CLI?

Stop juggling branches with `git stash` and `git checkout`. Stop losing your local changes. Stop waiting for dependency installs. **Start working on multiple features simultaneously without the hassle.**

```bash
# Old way 😫
git stash
git checkout feature-B
npm install
# ... where did my changes go?

# Worktree way 😎
worktree feature-B
# Done! New isolated workspace ready in seconds!
```

## ✨ Features That Spark Joy

### 🚀 **Lightning-Fast Setup**
One command to rule them all - create a worktree, copy env files, install dependencies, and open your IDE.

### 🏢 **Multi-Repository Management**
Manage worktrees across your entire stack - frontend, backend, microservices - all from one place.

### 🏷️ **Smart Organization**
Custom prefixes keep your worktrees organized (`fe-feature`, `be-bugfix`, `api-hotfix`).

### 🎨 **Beautiful CLI Experience**
React-powered interactive UI with Ink - because terminals can be beautiful too.

### 🔄 **GitHub Integration**
See PR status instantly when `gh` CLI is installed - no API keys needed!

### 🧹 **Bulk Operations**
Select multiple worktrees with spacebar and delete them all at once. Spring cleaning made easy.

## 📦 Installation

```bash
# npm
npm install -g @mcadam/worktree

# pnpm (recommended)
pnpm add -g @mcadam/worktree

# yarn
yarn global add @mcadam/worktree
```

## 🚀 Quick Start

### 1️⃣ Initialize Your First Repository

```bash
cd your-awesome-project
worktree init
```

You'll be guided through a delightful setup:

```
📝 Repository name: frontend
🏷️ Worktree prefix: fe-
📁 Base path: ../worktrees
🔐 Env file: .env.local
📦 Install command: pnpm install
💻 IDE command: cursor
```

### 2️⃣ Create Your First Worktree

```bash
worktree feature/dark-mode
```

Watch the magic happen:
```
✨ Creating worktree for branch: feature/dark-mode
📍 Location: ../worktrees/fe-feature-dark-mode
✓ Worktree created
✓ Copied .env.local
✓ Dependencies installed
✓ Opened in cursor

✅ Ready for some epic code!
```

### 3️⃣ Manage Your Worktrees

```bash
worktree list
```

Interactive UI shows all your worktrees:
```
┌─ Frontend (/Users/you/frontend) ─────┐
│ ☐ fe-feature-auth    ✓ remote 🔀 PR #23 │
│ ☐ fe-dark-mode       ⚠️ local only      │
│ ☐ fe-fix-header      ✓ remote           │
└──────────────────────────────────────────┘

[Space] Select  [Enter] Delete  [Q] Quit
```

## 🎮 Commands

### `worktree <branch>` - Create Magic ✨

Creates a new worktree with all the bells and whistles:

```bash
worktree feature/awesome-stuff
# Creates: ../worktrees/fe-feature-awesome-stuff
# Runs: pnpm install
# Copies: .env.local
# Opens: cursor
```

### `worktree list` - See Everything 👀

Beautiful interactive list of all worktrees across all repositories:
- **Space** - Select worktrees
- **Enter** - Delete selected
- **Q** - Quit

Status indicators:
- ✓ **remote** - Pushed to remote
- 🔀 **PR #X** - Has an open pull request
- ⚠️ **local only** - Not yet pushed

### `worktree init` - Setup Paradise 🏝️

Interactive configuration for the current repository:

```bash
worktree init
# Answer a few questions and you're golden!
```

### `worktree config` - Fine-Tune Everything ⚙️

Manage global defaults and repository settings:

```bash
worktree config
# • View configuration
# • Edit defaults
# • Remove repositories
```

## 🎯 Real-World Workflow

### The Full-Stack Developer's Dream

```bash
# Monday morning - Set up your repositories
cd ~/projects/frontend
worktree init
# prefix: fe-

cd ~/projects/backend
worktree init
# prefix: be-

cd ~/projects/mobile
worktree init
# prefix: mob-

# Start working on a feature across all repos
cd ~/projects/frontend
worktree feature/user-dashboard

cd ~/projects/backend
worktree feature/user-dashboard-api

cd ~/projects/mobile
worktree feature/user-dashboard-mobile

# See all your work
worktree list
# Shows all 3 worktrees across all repos! 🎉
```

### The Quick Fix Master

```bash
# Emergency hotfix needed!
worktree hotfix/critical-bug

# Fix the bug...
# Push to remote...
# Create PR...

# Clean up when done
worktree list
# Select the hotfix worktree
# Press Enter to delete
# ✅ Workspace cleaned up!
```

## ⚙️ Configuration

Your config lives at `~/.worktreerc.json`:

```json
{
  "defaultBasePath": "../worktrees",
  "defaultInstallCommand": "pnpm install",
  "defaultIdeCommand": "cursor",
  "repos": {
    "/Users/you/frontend": {
      "name": "frontend",
      "prefix": "fe-",
      "basePath": "../worktrees",
      "envPath": ".env.local",
      "installCommand": "pnpm install && pnpm prepare",
      "ideCommand": "cursor"
    },
    "/Users/you/backend": {
      "name": "backend",
      "prefix": "be-",
      "envPath": ".env",
      "installCommand": "pnpm install && pnpm db:migrate"
    }
  }
}
```

## 🛠️ Development

Want to contribute? Awesome! Here's how to get started:

```bash
# Clone the repo
git clone https://github.com/un/worktree.git
cd worktree

# Install dependencies
pnpm install

# Development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Test locally
npm link
worktree --version
```

### Tech Stack

- **TypeScript** - Type safety FTW
- **Ink** - React for CLIs
- **Commander** - CLI argument parsing
- **Zod** - Runtime type validation
- **Biome** - Fast formatting & linting

## 🤝 Contributing

We love contributions! Whether it's:

- 🐛 Bug reports
- 💡 Feature requests
- 📖 Documentation improvements
- 🎨 UI/UX enhancements
- 🔧 Code contributions

Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

## 📝 Requirements

- **Node.js** >= 18.0.0
- **Git** (obviously!)
- **gh CLI** (optional, for PR status)

## 🎉 Success Stories

> "Worktree CLI changed my life! I can finally work on multiple features without losing my mind!" - Happy Developer

> "The prefix system is genius. My worktrees folder is finally organized!" - Organized Developer

> "Being able to see PR status right in the terminal? *Chef's kiss*" - Efficient Developer

## 📄 License

MIT © [Your Name]

---

<div align="center">

**Built with 💙 by developers, for developers**

[Report Bug](https://github.com/un/worktree/issues) · [Request Feature](https://github.com/un/worktree/issues) · [Star on GitHub](https://github.com/un/worktree)

</div>

---

<div align="center">

### 🌟 Don't forget to star this repo if you find it useful! 🌟

</div>
