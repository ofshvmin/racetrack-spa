const REPO = process.env.GITHUB_REPO ?? 'ofshvmin/racetrack-spa';
const TOKEN = process.env.GITHUB_TOKEN ?? '';
const BRANCH = 'main';
const API = 'https://api.github.com';

const headers = () => ({
  'Authorization': `Bearer ${TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'Content-Type': 'application/json',
  'X-GitHub-Api-Version': '2022-11-28',
});

export async function readJsonFile(path) {
  const res = await fetch(`${API}/repos/${REPO}/contents/${path}?ref=${BRANCH}`, { headers: headers() });
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const content = json.content.replace(/\n/g, '');
  const data = JSON.parse(Buffer.from(content, 'base64').toString('utf8'));
  return { data, sha: json.sha };
}

export async function writeJsonFile(path, data, sha, message, authorEmail) {
  const content = Buffer.from(JSON.stringify(data, null, 2) + '\n').toString('base64');
  const body = JSON.stringify({
    message,
    content,
    sha,
    branch: BRANCH,
    author: { name: 'Chemung Speedrome Admin', email: 'admin@chemungspeedrome.com' },
    committer: { name: 'Chemung Speedrome Admin', email: 'admin@chemungspeedrome.com' },
  });
  const res = await fetch(`${API}/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: headers(),
    body,
  });
  if (res.status === 409) return { conflict: true };
  if (!res.ok) throw new Error(`GitHub write failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return { commitSha: json.commit.sha, commitUrl: json.commit.html_url };
}

// Read-modify-write with one retry on 409 conflict
export async function upsertJsonArray(path, key, newEntry, message, authorEmail) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, sha } = await readJsonFile(path);
    const idx = data.findIndex(e => e[key] === newEntry[key]);
    if (idx >= 0) data[idx] = newEntry; else data.push(newEntry);
    data.sort((a, b) => b[key].localeCompare(a[key]));
    const result = await writeJsonFile(path, data, sha, message, authorEmail);
    if (!result.conflict) return result;
  }
  return { conflict: true };
}

// Remove the entry matching key === keyValue. Returns { removed: false } if absent.
export async function removeJsonArrayEntry(path, key, keyValue, message, authorEmail) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, sha } = await readJsonFile(path);
    const idx = data.findIndex(e => e[key] === keyValue);
    if (idx < 0) return { removed: false };
    data.splice(idx, 1);
    const result = await writeJsonFile(path, data, sha, message, authorEmail);
    if (!result.conflict) return { ...result, removed: true };
  }
  return { conflict: true };
}
