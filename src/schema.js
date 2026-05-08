// Generate JSON-LD schema for a blog post: Article + BreadcrumbList + (optional) FAQPage.
//
// Usage:
//   node src/schema.js --frontmatter='{"title":"…","slug":"…","domain":"https://…","datePublished":"2026-01-15","author":{"name":"…"}}'

export function generateSchema(frontmatter, contentText = '') {
  const fm = frontmatter;
  const url = `${fm.domain}/blog/${fm.slug}/`;
  const wordCount = fm.wordCount || contentText.trim().split(/\s+/).filter(Boolean).length;

  const author = fm.author?.url
    ? { '@type': 'Person', name: fm.author.name, url: fm.author.url, ...(fm.author.credentials ? { jobTitle: fm.author.credentials } : {}) }
    : { '@type': 'Person', name: fm.author?.name || 'Unknown' };

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: fm.title,
    description: fm.description,
    url,
    inLanguage: fm.lang || 'de',
    datePublished: fm.datePublished,
    dateModified: fm.dateModified || fm.datePublished,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author,
    publisher: { '@type': 'Organization', '@id': `${fm.domain}/#organization` },
    ...(fm.image ? { image: { '@type': 'ImageObject', url: fm.image.startsWith('http') ? fm.image : `${fm.domain}${fm.image}` } } : {}),
    ...(wordCount ? { wordCount } : {}),
    ...(fm.keywords?.length ? { keywords: fm.keywords.join(', ') } : {}),
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${fm.domain}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${fm.domain}/blog/` },
      { '@type': 'ListItem', position: 3, name: fm.title, item: url },
    ],
  };

  const result = [article, breadcrumb];

  if (fm.faqs?.length > 0) {
    result.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: fm.faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return result;
}

export function schemaToScriptTags(schemaArr) {
  return schemaArr.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const fmIdx = process.argv.findIndex(a => a.startsWith('--frontmatter='));
  if (fmIdx < 0) { console.error('Need --frontmatter=<json>'); process.exit(1); }
  const fm = JSON.parse(process.argv[fmIdx].split('=', 2)[1]);
  console.log(schemaToScriptTags(generateSchema(fm)));
}
