# content-seo-engine

Three tools for data-driven content marketing — run them independently or chain them:

```
1. brief.js   — Claude generates a full content brief from topic + keyword + audience
2. score.js   — scores a finished post on 5 SEO/E-E-A-T/GEO dimensions (100 pts)
3. schema.js  — generates JSON-LD (Article + BreadcrumbList + optional FAQPage)
```

## Quick start

```bash
npm install

# Generate a content brief
node src/brief.js \
  --topic="B2B Marketing Automation" \
  --keyword="marketing automation tools" \
  --audience="Marketing Manager" \
  --cluster="Marketing Ops"

# Score a post (HTML file)
node src/score.js path/to/post.html \
  --frontmatter='{"title":"…","description":"…","keyword":"marketing automation","author":{"name":"Jane"}}'

# Generate JSON-LD schema
node src/schema.js \
  --frontmatter='{"title":"…","slug":"post-slug","domain":"https://your-site.com","datePublished":"2026-01-15","author":{"name":"Jane"}}'
```

## Scoring breakdown

| Category | Points | What's measured |
|---|---|---|
| Content quality | 25 | Word count, heading structure, external links, specificity |
| SEO | 25 | Title/meta length, internal links, keyword placement |
| E-E-A-T | 20 | Author byline + credentials, freshness, sourced links |
| Technical | 15 | Image alts, lazy loading, paragraph length, code blocks |
| AI citation readiness | 15 | TL;DR presence, Q&A headings, FAQPage schema |

A post scoring ≥ 80 is ready to publish. 60–79 needs one or two targeted fixes (see findings output). Below 60 — rework before publishing.

## Content brief output

The brief includes:
- 3 title variants (all ≤ 60 chars, all containing the keyword)
- Meta description (120–160 chars)
- Target word count
- Full H2/H3 outline
- Citation capsule (TL;DR-ready 2-paragraph answer)
- 5–10 recommended sources
- Internal + external linking zones
- Image/chart suggestions
- FAQ suggestions (feeds directly into FAQPage schema)
- Distribution plan (LinkedIn, email, Reddit angles)

## JSON-LD schema

Generates: `Article` + `BreadcrumbList` + (if `faqs` in frontmatter) `FAQPage`.

Paste the output into your page's `<head>` or CMS custom fields.

## License

MIT
