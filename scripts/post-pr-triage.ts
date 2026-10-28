import * as fs from 'fs';

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  if (!fs.existsSync('triage-comment.md')) {
    console.log('✅ No triage-comment.md found (all tests passed).');
    return;
  }

  const markdown = fs.readFileSync('triage-comment.md', 'utf-8');
  console.log('\n📋 Generated GitHub PR Triage Comment:\n');
  console.log(markdown);

  if (isDryRun || !process.env.GITHUB_TOKEN || !process.env.GITHUB_REPOSITORY || !process.env.PR_NUMBER) {
    console.log('ℹ️ Dry-run or local environment detected — skipping GitHub PR API post.');
    return;
  }

  const url = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues/${process.env.PR_NUMBER}/comments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body: markdown }),
  });

  if (!res.ok) {
    console.error(`Failed to post PR comment: HTTP ${res.status}`);
    process.exitCode = 1;
    return;
  }
  console.log('✅ Posted AI Triage Report directly to GitHub Pull Request.');
}

main();
