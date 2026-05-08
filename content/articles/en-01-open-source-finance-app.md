---
title: "I Built a Free, Open-Source Wealth Freedom Tracker (Electron + Vue 3)"
published: false
description: "A local-first personal finance app that guides you through 3 stages to financial freedom, with AI advisor, multi-currency, and zero cloud dependency."
tags: electron, vue, opensource, finance
cover_image: https://github.com/petterobam/wealth-freedom/raw/main/docs/screenshots/dashboard.png
canonical_url: https://github.com/petterobam/wealth-freedom
series: building-wealth-freedom
---

I spent the last month building a personal finance desktop app — not another SaaS that slurps your banking data, but something that runs entirely on your machine, with your data staying yours.

It's called **[Wealth Freedom](https://github.com/petterobam/wealth-freedom)**, and it's free and open-source.

## Why Yet Another Finance App?

Most finance apps fall into two camps:

- **Cloud-dependent SaaS** (YNAB, Mint) — your data lives on someone else's server, and they'll eventually enshittify or shut down
- **Spreadsheet-based** — powerful but painful to maintain, no visualization, no goal tracking

I wanted something different: **local-first, privacy-respecting, but with the polish of a commercial app.**

## The 3-Stage Framework

Instead of just tracking expenses, the app guides you through three concrete financial stages:

1. **Financial Security** (财务保障) — Build 6-12 months of emergency fund
2. **Financial Independence** (财务安全) — Investment income covers living expenses
3. **Financial Freedom** (财务自由) — Passive income funds your dream life

Each stage has a clear target number calculated from your actual data. The dashboard shows your progress and estimated time to reach each stage.

## Tech Stack

```
Electron 28 + electron-vite 2
Vue 3.4 + TypeScript 5.3
Element Plus + ECharts
better-sqlite3 (local database)
```

Why Electron? As an indie developer, cross-platform with web tech is the pragmatic choice. Three platforms, one codebase.

## Key Features

- **Transaction tracking** with automatic categorization
- **Budget management** with real-time progress
- **Investment portfolio** tracking with asset allocation charts
- **AI financial advisor** (local LLM integration)
- **Financial health score** (5-dimension assessment)
- **Multi-currency** support with real-time conversion
- **Data visualization dashboard** (big screen mode)
- **PDF report generation**
- **Automatic backup** every 6 hours
- **Dark mode** (of course)
- **i18n** — Chinese and English, more languages welcome
- **Demo mode** — try it without entering any real data

The app has 29 views and works offline. Your financial data never leaves your machine.

## Monetization (Transparent)

The core is free and open-source. A Pro tier ($3/month or $60 lifetime) unlocks:

- AI advisor (unlimited queries)
- Advanced financial insights
- Data encryption
- Priority support

This isn't a VC-funded growth play. It's sustainable indie software.

## Try It

Download for your platform from [GitHub Releases](https://github.com/petterobam/wealth-freedom/releases/latest):

- macOS (DMG, arm64 + x64)
- Windows (Portable, x64)
- Linux (AppImage + deb, x64)

Or build from source:

```bash
git clone https://github.com/petterobam/wealth-freedom.git
cd wealth-freedom
pnpm install
pnpm dev
```

## What's Next

- Mobile companion app
- Cloud sync (optional, end-to-end encrypted)
- Community features (anonymous benchmarking)
- More language support

If you're into personal finance, Electron development, or just want a privacy-respecting money tracker — give it a star ⭐. PRs welcome.

---

*This is my first open-source project. Feedback and suggestions are genuinely appreciated.*
