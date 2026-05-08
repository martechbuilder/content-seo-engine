// Blog post quality scorer — 5 categories, 100 points total.
//
// Usage:
//   node src/score.js path/to/post.html
//   node src/score.js path/to/post.html --frontmatter='{"author":{"name":"…"},"keyword":"…"}'
//
// Categories:
//   Content quality       (25)
//   SEO optimization      (25)
//   E-E-A-T signals       (20)
//   Technical             (15)
//   AI citation readiness (15)

import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

export function scoreBlogPost(html, frontmatter = {}) {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
  const doc = dom.window.document;
  const body = doc.body;
  const text = body.textContent ?? '';
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const cat = { content: 0, seo: 0, eeat: 0, technical: 0, geo: 0 };
  const findings = [];

  // ── Content quality (25) ─────────────────────────────────────────────
  if (wordCount >= 1500) cat.content += 8;
  else if (wordCount >= 800) cat.content += 5;
  else findings.push({ sev: 'high', cat: 'content', msg: `Short post (${wordCount} words; aim 1500+)` });

  const externalLinks = Array.from(doc.querySelectorAll('a[href^="http"]'));
  if (externalLinks.length >= 5) cat.content += 5;
  else if (externalLinks.length >= 2) cat.content += 2;

  if (doc.querySelectorAll('svg, figure, img').length > 0) cat.content += 4;

  const h2 = doc.querySelectorAll('h2').length;
  const h3 = doc.querySelectorAll('h3').length;
  if (h2 >= 4 && h3 >= 3) cat.content += 4;
  else if (h2 >= 2) cat.content += 2;

  const yearMatches = (text.match(/\b(20\d{2}|19\d{2})\b/g) ?? []).length;
  if (yearMatches >= 3) cat.content += 4;
  else if (yearMatches >= 1) cat.content += 2;

  // ── SEO (25) ─────────────────────────────────────────────────────────
  const title = frontmatter.title ?? doc.querySelector('h1')?.textContent ?? '';
  if (title && title.length > 0 && title.length <= 60) cat.seo += 5;
  else findings.push({ sev: 'medium', cat: 'seo', msg: title ? `Title length ${title.length} (max 60)` : 'No title' });

  const meta = frontmatter.description ?? '';
  if (meta && meta.length >= 120 && meta.length <= 160) cat.seo += 5;
  else findings.push({ sev: 'medium', cat: 'seo', msg: meta ? `Meta length ${meta.length} (sweet 120–160)` : 'No meta description in frontmatter' });

  const internalLinks = Array.from(doc.querySelectorAll('a[href]'))
    .filter(a => { const h = a.getAttribute('href'); return h.startsWith('/') || (frontmatter.domain && h.includes(frontmatter.domain)); });
  if (internalLinks.length >= 3) cat.seo += 5;
  else findings.push({ sev: 'medium', cat: 'seo', msg: `Only ${internalLinks.length} internal links (aim 3+)` });

  if (externalLinks.length >= 2) cat.seo += 5;

  if (frontmatter.keyword && text.slice(0, 600).toLowerCase().includes(frontmatter.keyword.toLowerCase())) cat.seo += 5;
  else if (frontmatter.keyword) findings.push({ sev: 'low', cat: 'seo', msg: `Keyword "${frontmatter.keyword}" not in first 600 chars` });

  // ── E-E-A-T (20) ─────────────────────────────────────────────────────
  if (frontmatter.author?.name) cat.eeat += 5;
  else findings.push({ sev: 'high', cat: 'eeat', msg: 'No author byline (frontmatter.author.name)' });
  if (frontmatter.author?.credentials) cat.eeat += 3;
  if (frontmatter.author?.url) cat.eeat += 2;
  if (frontmatter.dateModified) cat.eeat += 3;
  if (externalLinks.length >= 5) cat.eeat += 4;
  if (frontmatter.firstHandExperience) cat.eeat += 3;

  // ── Technical (15) ───────────────────────────────────────────────────
  const allImgs = doc.querySelectorAll('img');
  const imgsWithAlt = doc.querySelectorAll('img[alt]');
  const altCoverage = allImgs.length === 0 ? 1 : imgsWithAlt.length / allImgs.length;
  cat.technical += Math.round(altCoverage * 5);
  if (doc.querySelector('img[loading="lazy"]') || allImgs.length === 0) cat.technical += 3;
  if (doc.querySelector('img[width][height]') || allImgs.length === 0) cat.technical += 3;
  if (doc.querySelectorAll('pre, code').length > 0) cat.technical += 2;
  const paragraphs = Array.from(doc.querySelectorAll('p')).filter(p => p.textContent.trim().length > 0);
  if (paragraphs.length > 0) {
    const avgPara = paragraphs.reduce((s, p) => s + p.textContent.trim().split(/\s+/).length, 0) / paragraphs.length;
    if (avgPara < 100) cat.technical += 2;
    else findings.push({ sev: 'low', cat: 'technical', msg: `Avg paragraph long (${Math.round(avgPara)} words; <100 ideal)` });
  }

  // ── GEO / AI Citation (15) ────────────────────────────────────────────
  const firstP = paragraphs[0]?.textContent?.trim() ?? '';
  if (firstP.length >= 120 && firstP.length <= 400) cat.geo += 4;
  if (text.match(/TL;?DR/i) || doc.querySelector('.tldr, .summary')) cat.geo += 4;
  else findings.push({ sev: 'medium', cat: 'geo', msg: 'No TL;DR — reduces AI citation likelihood' });
  const qH2 = Array.from(doc.querySelectorAll('h2')).filter(h => h.textContent.trim().endsWith('?')).length;
  if (qH2 >= 2) cat.geo += 4;
  const ldjson = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  if (ldjson.some(s => s.textContent.includes('"FAQPage"'))) cat.geo += 3;

  const total = cat.content + cat.seo + cat.eeat + cat.technical + cat.geo;
  return {
    total,
    breakdown: cat,
    wordCount,
    findings: findings.sort((a, b) => ({ critical: 0, high: 1, medium: 2, low: 3 }[a.sev] - { critical: 0, high: 1, medium: 2, low: 3 }[b.sev])),
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const path = process.argv[2];
  const fmIdx = process.argv.findIndex(a => a.startsWith('--frontmatter='));
  const frontmatter = fmIdx >= 0 ? JSON.parse(process.argv[fmIdx].split('=', 2)[1]) : {};
  if (!path) { console.error('Usage: node src/score.js <file> [--frontmatter=<json>]'); process.exit(1); }
  const html = readFileSync(path, 'utf-8');
  const result = scoreBlogPost(html, frontmatter);
  console.log(`\nScore: ${result.total}/100`);
  console.log('Breakdown:', result.breakdown);
  console.log(`Word count: ${result.wordCount}`);
  if (result.findings.length) {
    console.log('\nFindings:');
    for (const f of result.findings) console.log(`  [${f.sev.toUpperCase()}] ${f.cat}: ${f.msg}`);
  }
}
