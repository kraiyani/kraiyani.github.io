# Kashyap Raiyani

A personal portfolio for `https://kraiyani.github.io/`, built with plain
HTML, CSS and JavaScript. No framework, API keys, remote fonts or runtime
dependencies are required. The checked-in pages can be served directly;
a dependency-free Node script regenerates the writing section from Markdown.

## Preview

Open `index.html` directly, or start a static server from the repository root:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Visit `http://127.0.0.1:8000/`. Stop the server with Ctrl+C.
The writing section and custom 404 page use root-relative links for this
user-site domain; preview those through the server rather than a file URL.

## Files and editing

- `index.html`: generated portfolio; edit `templates/home.html` instead.
- `blog/`: generated writing index and individual article pages.
- `content/posts/`: Markdown article sources.
- `content/projects/`: Markdown case studies, with featured-project order.
- `projects/`: generated project index and individual case-study pages.
- `feed.xml`: generated RSS feed with summaries and full-article links.
- `resume.html`: completed public résumé; use Print résumé to save a PDF.
- `assets/styles.css`: responsive layout, theme tokens and print styles.
- `assets/main.js`: optional theme persistence, current-section navigation
  and printing. Content remains readable without JavaScript.
- `assets/language-map.svg`: conceptual illustration from the supplied site.
- `assets/sentinel-2-input.jpg`: sample input quicklook from the classifier
  repository, credited as Copernicus Sentinel data (2018).
- `assets/social-card.svg`: editable source for the social-preview PNG.
- `404.html`, `.nojekyll`, `robots.txt`, `sitemap.xml`: static hosting support.
- `SOURCES.md`: content provenance and design references.
- `scripts/verify.cjs`: browser smoke checks.
- `scripts/build-blog.cjs`: dependency-free static Markdown publisher.
- `templates/blog.html`: shared writing and case-study layout.
- `BLOGGING.md`: authoring instructions and weekly editorial plan.

Edit shared career details in `templates/home.html` and `resume.html`,
then run `node scripts/build-blog.cjs`. Update project URLs and summaries
together. Theme colours are defined at the top of the CSS;
update the light-theme media query as well as the explicit light theme.
The operating-system preference applies until a visitor chooses a theme.
After editing `assets/social-card.svg`, re-export its 1200 × 630 PNG using
`node scripts/render-social.cjs` with the same browser prerequisites as
the verification script, or an SVG editor; do not edit the generated PNG.

Source archives in `resource/` contain private supporting material and are
ignored by Git. Keep that folder out of any publication or deployment.
The public résumé deliberately omits private contact information and
internal evidence links.

## Verification

With Node.js, Playwright and Microsoft Edge available:

```powershell
node --check assets/main.js
node --check scripts/verify.cjs
node --test scripts/build-blog.test.cjs
node scripts/build-blog.cjs --check
node scripts/verify.cjs
```

The browser script resolves the `playwright` module normally. If it is
installed outside this repository, set `PLAYWRIGHT_MODULE` to its module
directory. No dependency installation is needed to view or host the site.
Checks cover project-to-article navigation, local links, keyboard access, section tracking, themes and
blocked storage, motion preferences, research walkthrough navigation, writing pages,
RSS, narrow layouts, enlarged text, no-JavaScript content, résumé printing
and the error page. Screenshots and a print PDF are saved
under ignored `output/playwright/`.

The requested `./scripts/commit-gate` is not supplied in this repository.
It cannot be run until the actual project gate is provided; the browser
checks do not claim to replace it.

## GitHub Pages

When you choose to publish, use the existing `kraiyani.github.io`
repository. In Settings → Pages, select **Deploy from a branch**, choose
the branch containing these files and **/(root)**, then save. Keep
`index.html`, `assets/` and `.nojekyll` at that publishing root. See the
[official publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

No publishing configuration or remote settings are changed by this work.
Review the tracked file list before publishing; do not force-add the
ignored source archives or local verification artifacts.

## Design credit

Layout and navigation are inspired by [Brittany Chiang](https://brittanychiang.com/)
and her [v4 portfolio](https://github.com/bchiang7/v4). This implementation
uses the supplied static portfolio as its starting material, with original
HTML/CSS layout and no Gatsby or third-party portfolio source code copied.
