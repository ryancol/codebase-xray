const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Slice 1: a single repo path, hard-coded to the fixture repo.
// A repo picker can replace this later without changing the tree-walking logic.
const REPO_ROOT = path.join(__dirname, 'fixtures', 'sample-repo');

// Directories we never want to show, even without a .gitignore entry.
const ALWAYS_IGNORE = new Set(['.git', 'node_modules']);

function walk(dir, relativeTo) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const children = [];

  for (const entry of entries) {
    if (ALWAYS_IGNORE.has(entry.name)) continue;

    const absPath = path.join(dir, entry.name);
    const relPath = path.relative(relativeTo, absPath).split(path.sep).join('/');

    if (entry.isDirectory()) {
      children.push({
        type: 'folder',
        name: entry.name,
        path: relPath,
        children: walk(absPath, relativeTo),
      });
    } else {
      children.push({
        type: 'file',
        name: entry.name,
        path: relPath,
      });
    }
  }

  return children;
}

app.get('/api/tree', (req, res) => {
  const tree = {
    type: 'folder',
    name: path.basename(REPO_ROOT),
    path: '',
    children: walk(REPO_ROOT, REPO_ROOT),
  };
  res.json(tree);
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Codebase X-Ray running at http://localhost:${PORT}`);
});
