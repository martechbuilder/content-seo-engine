// Generate a content brief via Claude.
//
// Usage:
//   node src/brief.js --topic="B2B Marketing Automation" --keyword="marketing automation tools" --audience="Marketing Manager" --cluster="Marketing Ops"
//
// Outputs a structured Markdown brief: titles, meta, outline, citation capsule, FAQ suggestions, distribution plan.

import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = join(__dir, '../prompts/brief.md');

export async function generateBrief({ topic, keyword, audience, cluster, goal = 'rank in Google + AI citation' }) {
  const template = await readFile(PROMPT_PATH, 'utf-8');

  const userMessage = template
    .replace('<USER FILLS IN>', topic, )
    + `\n\nFilled inputs:\n- Topic: ${topic}\n- Target keyword: ${keyword}\n- Audience: ${audience}\n- Topic cluster: ${cluster}\n- Goal: ${goal}`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: userMessage }],
  });

  return message.content[0].text;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(
    process.argv.slice(2)
      .filter(a => a.startsWith('--'))
      .map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=')]; })
  );

  if (!args.topic || !args.keyword || !args.audience || !args.cluster) {
    console.error('Usage: node src/brief.js --topic="…" --keyword="…" --audience="…" --cluster="…" [--goal="…"]');
    process.exit(1);
  }

  generateBrief(args)
    .then(brief => console.log(brief))
    .catch(e => { console.error(e.message); process.exit(1); });
}
