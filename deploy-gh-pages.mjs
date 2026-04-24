import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'JoeNugent512';
const REPO = 'SNC_Wireframe';
const BRANCH = 'gh-pages';
const DIST = '/home/runner/workspace/artifacts/sc-demo/dist/public';

async function api(method, endpoint, body = null) {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${endpoint} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

function collectFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectFiles(full));
    else results.push(full);
  }
  return results;
}

// The Contents API works even on empty repos.
// We upload each file one at a time to the gh-pages branch.
// The first file creates the branch; subsequent files target it.

const files = collectFiles(DIST);
console.log(`Deploying ${files.length} files to ${OWNER}/${REPO} on branch '${BRANCH}'…\n`);

let firstFile = true;
for (const full of files) {
  const rel = relative(DIST, full);
  const content = readFileSync(full).toString('base64');

  // Check if file already exists (to get its sha for updates)
  let sha = undefined;
  try {
    const existing = await api('GET', `/repos/${OWNER}/${REPO}/contents/${rel}?ref=${BRANCH}`);
    sha = existing.sha;
  } catch { /* file doesn't exist yet — that's fine */ }

  const body = {
    message: `Deploy: ${rel}`,
    content,
    branch: BRANCH,
    committer: { name: 'Replit Deploy', email: 'deploy@replit.com' },
  };
  if (sha) body.sha = sha;

  await api('PUT', `/repos/${OWNER}/${REPO}/contents/${rel}`, body);
  console.log(`  ✓ ${rel}`);
  firstFile = false;
}

console.log(`\nAll done!`);
console.log(`\nNow enable GitHub Pages:`);
console.log(`  1. Go to https://github.com/${OWNER}/${REPO}/settings/pages`);
console.log(`  2. Under "Branch", select "gh-pages" and click Save`);
console.log(`  3. Your site will be live at: https://${OWNER}.github.io/${REPO}/`);
