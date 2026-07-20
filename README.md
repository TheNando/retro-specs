# Retro Specs

Retro Specs is a local dashboard for checking a GitHub repository's pull requests. Enter an `owner/repository` name, then inspect open work or activity summaries.

The browser never receives a GitHub token. During development, Vite forwards GraphQL requests to the locally installed GitHub CLI, which uses the account authenticated by `gh auth login`.

## What it shows

**Pulls** lists open pull requests, ordered by GitHub's most recently updated timestamp. Each row links to the PR and its changed files, with a compact status for checks or discussion.

**Merged** groups merged pull requests by author and renders a bar chart. The authenticated viewer is outlined in the chart.

**LoC** shows each author's average additions and deletions per merged pull request. Additions are green and extend above zero; deletions are red and extend below it.

**Reviews** counts two review types on merged PRs: comments, including requested changes, and approvals. For each reviewer and PR, any number of comments or requested changes adds one comment count; any number of approvals adds one approval count. A reviewer can count once in both categories for the same PR.

Activity charts anonymize contributors other than the authenticated GitHub user. The viewer's GitHub login stays visible and their bar is outlined.

Available ranges are today, last week, last month, last 50, and last 100. Time-based ranges use the pull request's `updatedAt` value. The last-50 and last-100 options cap the query instead.

The selected repository and view settings are kept in `localStorage`, so they'll still be there after a refresh. Successfully queried repositories are also saved as a history that the repository combobox autocompletes while you type.

## Requirements

- [Bun](https://bun.sh/)
- The [GitHub CLI](https://cli.github.com/), installed locally and authenticated for the repositories you want to inspect

Check authentication before starting the app:

```sh
gh auth login
gh auth status
```

For private repositories, the authenticated account needs access to the repository.

## Run it

```sh
bun install
bun run dev
```

Open the URL printed by Vite, enter a repository such as `octo-org/project`, and choose a view.

## Build

```sh
bun run build
```

This performs TypeScript checking and writes the production assets to `dist/`.

`bun run preview` can serve those static assets, but the dashboard's GitHub requests won't work there. The `/api/github/graphql` route is a Vite development-server middleware, not part of the production build. A deployed version needs an equivalent server-side endpoint that executes `gh api graphql` or another authenticated GitHub GraphQL client. Keep credentials on that server.

## How GitHub access works

The client posts GraphQL queries to `/api/github/graphql`. Vite validates the request and runs:

```sh
gh api graphql
```

It returns the CLI response as JSON. Missing CLI installation and unauthenticated sessions are reported in the UI with a recovery message. GitHub's API permissions and repository visibility still apply.

## Project layout

```text
src/
  app.tsx                    application state and selected dashboard view
  client/                    GitHub GraphQL calls and query hooks
  libs/                      repository input plus dashboard components
  assets/                    small UI assets
vite.config.ts               Vite setup and the local GitHub CLI proxy
```

Preact renders the UI. TanStack Query caches requests, while Recharts draws the activity charts. DaisyUI and Tailwind are loaded from CDNs by `index.html`.

## Commands

| Command           | Purpose                                                                   |
| ----------------- | ------------------------------------------------------------------------- |
| `bun install`     | Install the project's dependencies.                                       |
| `bun run dev`     | Start the local dashboard and GitHub CLI proxy.                           |
| `bun run build`   | Type-check and create a production build.                                 |
| `bun run preview` | Serve the built static assets. GitHub data requires a separate API proxy. |
