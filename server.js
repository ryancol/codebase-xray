const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Repo to explore. Defaults to the fixture repo; override with:
//   REPO_PATH="C:\path\to\other\repo" node server.js
// A repo picker can replace this later without changing the tree-walking logic.
const REPO_ROOT = process.env.REPO_PATH
  ? path.resolve(process.env.REPO_PATH)
  : path.join(__dirname, 'fixtures', 'sample-repo');

if (!fs.existsSync(REPO_ROOT) || !fs.statSync(REPO_ROOT).isDirectory()) {
  console.error(`REPO_PATH does not exist or is not a directory: ${REPO_ROOT}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(REPO_ROOT, '.git'))) {
  console.error(`Not a Git repository (no .git found): ${REPO_ROOT}`);
  process.exit(1);
}

// Ask Git for the list of tracked files rather than walking the filesystem
// directly. This automatically respects .gitignore and skips .git itself,
// so build output, dependencies, etc. never show up uninvited.
function listTrackedFiles() {
  const output = execFileSync('git', ['ls-files'], { cwd: REPO_ROOT, encoding: 'utf8' });
  return output.split('\n').filter(Boolean);
}

// Turns a flat list of repo-relative paths (e.g. "src/utils/format.js")
// into the nested folder/file structure the frontend renders.
function buildTree(filePaths, rootName) {
  const root = { type: 'folder', name: rootName, path: '', children: [], _index: new Map() };

  for (const filePath of filePaths) {
    const parts = filePath.split('/');
    let cursor = root;
    let builtPath = '';

    for (let i = 0; i < parts.length; i++) {
      const isFile = i === parts.length - 1;
      builtPath = builtPath ? `${builtPath}/${parts[i]}` : parts[i];

      if (isFile) {
        cursor.children.push({ type: 'file', name: parts[i], path: builtPath });
        continue;
      }

      let next = cursor._index.get(parts[i]);
      if (!next) {
        next = { type: 'folder', name: parts[i], path: builtPath, children: [], _index: new Map() };
        cursor._index.set(parts[i], next);
        cursor.children.push(next);
      }
      cursor = next;
    }
  }

  // Drop the bookkeeping-only _index map before this goes out as JSON.
  const strip = (node) => {
    delete node._index;
    if (node.children) node.children.forEach(strip);
    return node;
  };
  return strip(root);
}

app.get('/api/tree', (req, res) => {
  const tree = buildTree(listTrackedFiles(), path.basename(REPO_ROOT));
  res.json(tree);
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Codebase X-Ray running at http://localhost:${PORT}`);
});
