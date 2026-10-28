import { execSync } from 'child_process';
import * as fs from 'fs';

interface RiskRule {
  pattern: RegExp;
  tags: string[];
  reason: string;
}

const RISK_RULES: RiskRule[] = [
  {
    pattern: /(payment|checkout|stripe|webhook)/i,
    tags: ['@smoke', '@pay', '@api'],
    reason: 'Payment, Checkout, or Stripe Webhook integration modified',
  },
  {
    pattern: /(a11y|accessibility|styles|css|toolshop\.page)/i,
    tags: ['@smoke', '@a11y'],
    reason: 'UI components, locators, or accessibility rules modified',
  },
  {
    pattern: /(community|feed|post)/i,
    tags: ['@smoke', '@community'],
    reason: 'Creator Community feed module modified',
  },
  {
    pattern: /(auth|login|session|fixture)/i,
    tags: ['@smoke', '@api', '@pay'],
    reason: 'Authentication or core fixture infrastructure modified',
  },
];

function getChangedFiles(cliFiles?: string): string[] {
  if (cliFiles) {
    return cliFiles.split(',').map((f) => f.trim()).filter(Boolean);
  }
  try {
    const baseRef = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1';
    const out = execSync(`git diff --name-only ${baseRef} 2>/dev/null || git status --porcelain`, {
      encoding: 'utf-8',
    });
    return out
      .split('\n')
      .map((line) => line.replace(/^[ MARC?]{2}\s+/, '').trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function main() {
  const args = process.argv.slice(2);
  const filesArg = args.find((a) => a.startsWith('--files='))?.split('=')[1];
  const shouldRun = args.includes('--run');

  const changedFiles = getChangedFiles(filesArg);
  const selectedTags = new Set<string>(['@smoke']);
  const matchedReasons: string[] = [];

  for (const file of changedFiles) {
    for (const rule of RISK_RULES) {
      if (rule.pattern.test(file)) {
        rule.tags.forEach((t) => selectedTags.add(t));
        matchedReasons.push(`${file} -> [${rule.tags.join(', ')}] (${rule.reason})`);
      }
    }
  }

  // If config or package.json changed, run all core tags
  if (changedFiles.some((f) => /playwright\.config|package\.json/.test(f))) {
    ['@smoke', '@pay', '@a11y', '@api', '@community'].forEach((t) => selectedTags.add(t));
    matchedReasons.push('Core configuration modified -> Running full risk suite');
  }

  const tagsArray = Array.from(selectedTags);
  const grepRegex = tagsArray.join('|');

  console.log('🎯 Sentinela Risk Engine — Changed-File Analysis');
  console.log('────────────────────────────────────────────────');
  console.log(`Changed Files Detected (${changedFiles.length}):`, changedFiles.length ? changedFiles.join(', ') : '(none - defaulting to @smoke)');
  if (matchedReasons.length > 0) {
    console.log('Matched Risk Rules:');
    for (const r of matchedReasons) {
      console.log(`  • ${r}`);
    }
  }
  console.log(`Selected Test Tags : ${tagsArray.join(', ')}`);
  console.log(`Playwright Grep    : "${grepRegex}"`);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `grep_tags=${grepRegex}\n`);
  }

  if (shouldRun) {
    console.log(`\n🚀 Executing targeted Playwright suite: npx playwright test --grep "${grepRegex}"\n`);
    execSync(`npx playwright test --grep "${grepRegex}"`, { stdio: 'inherit' });
  }
}

main();
