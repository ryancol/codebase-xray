# Codebase X-Ray

A local browser tool for visually exploring a Git repository: an
interactive, force-directed map of its folders and files.

Runs entirely on your machine. No deployment, accounts, database, cloud
services, or AI APIs involved.

## Setup

```bash
npm install
```

The app needs a small fixture repo to explore by default. Create it with:

```bash
bash scripts/create-fixture.sh
```

This regenerates `fixtures/sample-repo/` — a tiny throwaway Git repo with a
few commits of real history. It's excluded from this project's own Git
tracking (see `.gitignore`) because nesting one Git repo inside another
can't be cloned cleanly, so the script recreates it on demand.

## Running

```bash
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

By default it explores the fixture repo. To point it at any other local
Git repository instead, set `REPO_PATH`:

```bash
REPO_PATH="/path/to/some/repo" npm start
```

(On Windows PowerShell: `$env:REPO_PATH="C:\path\to\some\repo"; npm start`)

## How it works

- An Express server reads the target repo's tracked files via
  `git ls-files` (which automatically respects `.gitignore`) and serves
  the folder/file structure as JSON from `/api/tree`.
- The frontend (`public/app.js`) renders that structure as a draggable,
  zoomable force-directed graph using [D3.js](https://d3js.org/), loaded
  from a CDN — no build step, no framework.
- Everything is computed live from the filesystem and Git on each
  request; there's no database or persisted state.

## Status

This is an early, in-progress build. Currently shows the file/folder
structure only. Planned next: coloring by recency of change, sizing by
how often a file changes, marking test files, drawing import/require
links between files, and a click-through detail panel per file.
