const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-blog-'));
  t.after(() => {
    const target = path.resolve(root);
    assert(target.startsWith(path.resolve(os.tmpdir()) + path.sep + 'portfolio-blog-'));
    fs.rmSync(target, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(root, 'content/posts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'templates'));
  fs.writeFileSync(path.join(root, 'templates/home.html'), '<main>{{LATEST_POSTS}}</main>');
  fs.writeFileSync(path.join(root, 'templates/blog.html'), '<title>{{TITLE}}</title><meta name="description" content="{{DESCRIPTION}}"><link rel="canonical" href="{{URL}}">{{SCHEMA}}<main>{{BODY}}</main>');
  return root;
}

function post(root, slug, overrides = {}, body = '## A useful question\n\nAn original explanation.') {
  const metadata = { title: 'A useful note', date: '2026-10-21', status: 'published', topics: 'Applied ML', summary: 'A short explanation.', ...overrides };
  fs.writeFileSync(path.join(root, 'content/posts', `${slug}.md`), `---\n${Object.entries(metadata).map(([key, value]) => `${key}: ${value}`).join('\n')}\n---\n\n${body}\n`);
}

test('published notes reach pages, homepage, RSS and sitemap; drafts and future notes stay out', t => {
  const root = fixture(t);
  const { buildBlog } = require('./build-blog.cjs');
  post(root, 'older', { date: '2026-10-14' });
  post(root, 'newer', { title: 'New & useful' });
  post(root, 'third', { date: '2026-10-07' });
  post(root, 'oldest', { date: '2026-09-30' });
  post(root, 'unfinished', { status: 'draft' });
  post(root, 'future', { date: '2026-10-28' });
  buildBlog(root, { today: '2026-10-21' });
  const listing = fs.readFileSync(path.join(root, 'blog/index.html'), 'utf8');
  assert(listing.indexOf('newer/') < listing.indexOf('older/'));
  assert(!listing.includes('unfinished/') && !listing.includes('future/'));
  assert(!fs.existsSync(path.join(root, 'blog/unfinished/index.html')));
  assert(!fs.existsSync(path.join(root, 'blog/future/index.html')));
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert(homepage.includes('newer/') && !homepage.includes('oldest/'));
  assert.equal((homepage.match(/class="writing-entry"/g) || []).length, 3);
  const feed = fs.readFileSync(path.join(root, 'feed.xml'), 'utf8');
  assert(feed.includes('New &amp; useful'));
  assert.equal((feed.match(/<item>/g) || []).length, 4);
  assert(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').includes('/blog/newer/'));
  assert.doesNotThrow(() => buildBlog(root, { today: '2026-10-21', check: true }));
});

test('article text, metadata, code and duplicate heading anchors render safely', t => {
  const root = fixture(t);
  const { buildBlog } = require('./build-blog.cjs');
  post(root, 'safe', { title: 'Notes <script> & "quotes"' }, '## Same heading\n\nSee [documentation](https://example.com/?a=1&b=2).\n\n## Same heading\n\n## Same heading 2\n\n```python\nprint("<script>")\n```');
  buildBlog(root, { today: '2026-10-21' });
  const article = fs.readFileSync(path.join(root, 'blog/safe/index.html'), 'utf8');
  assert(article.includes('id="same-heading"') && article.includes('id="same-heading-2"'));
  const ids = [...article.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Every heading must have a unique anchor');
  assert(article.includes('&lt;script&gt;'));
  assert(article.includes('href="https://example.com/?a=1&amp;b=2"'));
  assert(!article.includes('Notes <script>'));
  assert(article.includes('application/ld+json'));
});

test('invalid dates and executable link targets fail before writing output', t => {
  const root = fixture(t);
  const { buildBlog } = require('./build-blog.cjs');
  post(root, 'bad', { date: '2026-02-30' });
  assert.throws(() => buildBlog(root, { today: '2026-10-21' }), /date/i);
  assert(!fs.existsSync(path.join(root, 'blog')));
  post(root, 'bad', {}, '[Unsafe](javascript:alert)');
  assert.throws(() => buildBlog(root, { today: '2026-10-21' }), /link/i);
});

test('withdrawing a post removes only its generated page and check mode detects stale output', t => {
  const root = fixture(t);
  const { buildBlog } = require('./build-blog.cjs');
  post(root, 'withdrawn');
  buildBlog(root, { today: '2026-10-21' });
  fs.writeFileSync(path.join(root, 'blog/withdrawn/notes.txt'), 'Keep this author file.');
  post(root, 'withdrawn', { status: 'draft' });
  assert.throws(() => buildBlog(root, { today: '2026-10-21', check: true }), /stale/i);
  buildBlog(root, { today: '2026-10-21' });
  assert(!fs.existsSync(path.join(root, 'blog/withdrawn/index.html')));
  assert(fs.existsSync(path.join(root, 'blog/withdrawn/notes.txt')));
  assert(fs.readFileSync(path.join(root, 'blog/index.html'), 'utf8').includes('No articles yet'));
});

test('generated-file checks tolerate Git converting line endings on Windows', t => {
  const root = fixture(t);
  const { buildBlog } = require('./build-blog.cjs');
  post(root, 'portable');
  buildBlog(root, { today: '2026-10-21' });
  const filename = path.join(root, 'index.html');
  fs.writeFileSync(filename, fs.readFileSync(filename, 'utf8').replace(/\n/g, '\r\n'));
  assert.doesNotThrow(() => buildBlog(root, { today: '2026-10-21', check: true }));
});

test('article tables and local figures render with escaped cells and useful alternative text', t => {
  const root = fixture(t);
  const { buildBlog } = require('./build-blog.cjs');
  post(root, 'results', {}, '| Case | ROC-AUC |\n| --- | --- |\n| Safe <test> | 0.825 |\n\n![Measured validation comparisons](/assets/validation-comparison.png)');
  buildBlog(root, { today: '2026-10-21' });
  const article = fs.readFileSync(path.join(root, 'blog/results/index.html'), 'utf8');
  assert(article.includes('<th scope="col">Case</th>'));
  assert(article.includes('<td>Safe &lt;test&gt;</td>'));
  assert(article.includes('alt="Measured validation comparisons"'));
  assert(article.includes('src="/assets/validation-comparison.png"'));
  post(root, 'results', {}, '![Bad](javascript:alert)');
  assert.throws(() => buildBlog(root, { today: '2026-10-21' }), /image/i);
});

test('renamed articles keep a redirect while feed and sitemap use only the canonical URL', t => {
  const root = fixture(t);
  const { buildBlog } = require('./build-blog.cjs');
  post(root, 'new-slug', { aliases: 'old-slug' });
  buildBlog(root, { today: '2026-10-21' });
  const redirect = fs.readFileSync(path.join(root, 'blog/old-slug/index.html'), 'utf8');
  assert(redirect.includes('http-equiv="refresh"'));
  assert(redirect.includes('https://kraiyani.github.io/blog/new-slug/'));
  assert(!fs.readFileSync(path.join(root, 'feed.xml'), 'utf8').includes('/old-slug/'));
  post(root, 'collision', { aliases: 'new-slug' });
  assert.throws(() => buildBlog(root, { today: '2026-10-21' }), /alias/i);
});
