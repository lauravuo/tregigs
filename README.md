# Tampere Gigs Aggregator

[![Daily Concert Update](https://github.com/lauravuo/tregigs/actions/workflows/daily-update.yml/badge.svg)](https://github.com/lauravuo/tregigs/actions/workflows/daily-update.yml)

A static website generator that scrapes concert listings from [kulttuuritoimitus.fi](https://kulttuuritoimitus.fi/konsertit-pirkanmaa/) and reorganizes them by date for easy viewing. The site is automatically updated daily via GitHub Actions.

## Features

- **Automated Scraping**: Fetches the latest concert data daily.
- **Date-First Sorting**: Reorganizes venue-based lists into a chronological timeline.
- **Static Hosting**: Generates a lightweight HTML page suitable for GitHub Pages.
- **Modern Tech Stack**: Built with TypeScript, Biome, Vitest, and Node.js v22.

## Prerequisites

- Node.js v22 or higher
- npm

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd tregigs
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the build locally:**
   ```bash
   npm run build
   ```
   This will generate the static site in the `public/` directory.

4. **Verify the output:**
   Open `public/index.html` in your web browser.

## Development Commands

- **`npm run start`**: Alias for build.
- **`npm test`**: Run unit tests with Vitest.
- **`npx vitest run --coverage`**: Run tests with coverage report.
- **`npm run check`**: Run Biome linter and formatter checks.
- **`npm run format`**: Fix formatting issues with Biome.

## Deployment

This repository includes a GitHub Actions workflow (`.github/workflows/daily-update.yml`) that:
1. runs on a daily schedule (4:00 UTC).
2. scrapes the latest data.
3. builds the static site.
4. deploys the `public/` folder to the `gh-pages` branch.

**Note:** Ensure GitHub Pages is configured to serve from the `gh-pages` branch in your repository settings.