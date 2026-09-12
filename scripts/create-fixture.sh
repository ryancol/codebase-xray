#!/usr/bin/env bash
# Recreates fixtures/sample-repo: a tiny Git repo with real commit history,
# used as the thing Codebase X-Ray points at during development.
#
# It's excluded from this project's own Git tracking (see .gitignore) because
# it is itself a Git repository — nesting one repo inside another creates an
# "embedded repository" that doesn't survive a clone. Run this script any
# time you need the fixture back (e.g. after a fresh checkout).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$ROOT/fixtures/sample-repo"

rm -rf "$REPO"
mkdir -p "$REPO/src/utils" "$REPO/test"
cd "$REPO"

git init -q
git config user.email "fixture@example.com"
git config user.name "Fixture Author"

commit() {
  local date="$1" msg="$2"
  GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" git commit -q -m "$msg"
}

cat > README.md <<'EOF'
# sample-repo

A tiny fixture repository used to develop and test Codebase X-Ray.
It is not a real project — just enough files, folders, imports, and
commit history to exercise the visualization.
EOF

cat > src/math.js <<'EOF'
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

module.exports = { add, subtract };
EOF
git add README.md src/math.js
commit "2026-08-01T10:00:00" "Add math utilities"

cat > src/utils/format.js <<'EOF'
function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

module.exports = { formatCurrency };
EOF
git add src/utils/format.js
commit "2026-08-05T14:30:00" "Add currency formatting helper"

cat > src/invoice.js <<'EOF'
const { add } = require('./math');
const { formatCurrency } = require('./utils/format');

function invoiceTotal(items) {
  const total = items.reduce((sum, item) => add(sum, item.price), 0);
  return formatCurrency(total);
}

module.exports = { invoiceTotal };
EOF
git add src/invoice.js
commit "2026-08-10T09:15:00" "Add invoice total calculation"

cat > src/index.js <<'EOF'
const { invoiceTotal } = require('./invoice');

const items = [
  { name: 'Widget', price: 9.99 },
  { name: 'Gadget', price: 19.99 },
];

console.log(invoiceTotal(items));
EOF
git add src/index.js
commit "2026-08-12T11:00:00" "Add entry point"

cat > test/math.test.js <<'EOF'
const { add, subtract } = require('../src/math');

test('add works', () => {
  expect(add(2, 3)).toBe(5);
});

test('subtract works', () => {
  expect(subtract(5, 3)).toBe(2);
});
EOF
cat > test/invoice.test.js <<'EOF'
const { invoiceTotal } = require('../src/invoice');

test('invoiceTotal formats sum as currency', () => {
  const items = [{ price: 1 }, { price: 2.5 }];
  expect(invoiceTotal(items)).toBe('$3.50');
});
EOF
git add test/math.test.js test/invoice.test.js
commit "2026-08-15T16:45:00" "Add tests for math and invoice"

cat >> src/math.js <<'EOF'

function multiply(a, b) {
  return a * b;
}

module.exports.multiply = multiply;
EOF
git add src/math.js
commit "2026-08-20T13:00:00" "Add multiply to math utilities"

cat >> src/invoice.js <<'EOF'

module.exports.invoiceTotal = invoiceTotal;
EOF
git add src/invoice.js
commit "2026-09-01T08:20:00" "Re-export invoiceTotal explicitly"

echo "Fixture repo created at $REPO"
