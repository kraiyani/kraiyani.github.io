# Writing and weekly editorial workflow

The site starts with three articles dated 21 October 2026. The expanded
customer-level leakage article includes an executed synthetic experiment;
the other two are documentation-based explanations. No employer data is
included and no Jev/Laya benchmark is claimed.

The Sentinel-2 walkthrough was added on 22 October 2026 from the published
paper and the two local code repositories. It reports historical published
scores and small synthetic helper checks separately; no full-scene
classification or benchmark rerun is claimed.

The training-serving skew and author-level validation articles were also
prepared on 22 October 2026. Their demonstrations use entirely synthetic
data and report executed results. They do not reproduce EFS customer-data
performance or the historical PAN competition results.

## Sources and generated files

Edit these sources:

- `content/posts/*.md`: article content and metadata.
- `content/projects/*.md`: project case studies and homepage selection.
- `templates/blog.html`: shared writing and case-study layout.
- `templates/home.html`: portfolio source, including the writing section.
- `templates/leakage-article.md`: expanded leakage article source; its
  measured results are filled by the companion experiment's exporter.
- `assets/styles.css` and `assets/main.js`: shared styles and enhancements.

Regenerate with Node.js (Node 24 was used for validation):

```powershell
node scripts/build-blog.cjs
node scripts/build-blog.cjs --check
```

The command writes `index.html`, `blog/index.html`, individual
`blog/<slug>/index.html` pages, `projects/index.html`, individual
`projects/<slug>/index.html` pages, `feed.xml` and `sitemap.xml`. Do not edit
those generated files directly. Retain generated files in Git so the
existing static GitHub Pages setup can serve them without a build service.
No dependencies are needed for the publisher or for viewing the site.

The default cut-off date follows Europe/London. For a reproducible build,
pass `--date YYYY-MM-DD`. Articles marked `draft` or dated after that
cut-off are excluded from the pages, homepage, feed and sitemap. Changing
a previously included article to draft also removes its generated page.
Other files in its directory are preserved.

Draft Markdown remains readable if committed to a public repository or
included in a static deployment. The status flag is an editorial filter,
not an access control. Keep confidential research outside the repository.

## Add an article

Copy `templates/post.md` to `content/posts/a-descriptive-slug.md`.
Filenames use lowercase letters, digits and hyphens. Set the five
single-line metadata fields: title, date, status, topics and summary.
Topics are comma-separated. Keep `status: draft` until the article has
been reviewed, then use `published` and the actual publication date.

## Add a case study

Create `content/projects/a-descriptive-slug.md` using the same five required
metadata fields as an article. The date records publication of the case
study, rather than the date of any historical research it describes.
Optional `featured: 1`, `featured: 2` or `featured: 3` selects and orders
homepage projects; published feature ranks must be unique. Other published
case studies remain available on the project index. Project aliases are
not supported. Drafts and future dates follow the same publication filter
as articles, and withdrawn generated case-study pages are removed.

Use the existing Markdown subset described below. The first local image
also supplies the card preview, with its alternative text. Cover the
problem, your contribution, approach, evidence and limitations, and link
to the code, detailed article and relevant result artifacts. Distinguish
synthetic demonstrations from historical research and production work.

Case studies appear in the sitemap, but stay out of the writing RSS feed.
Run the same publisher command after updating either collection.

## Markdown format

The supported Markdown subset is intentionally small: paragraphs,
`##` and `###` headings, unordered or numbered lists, fenced code blocks,
inline code, bold text, basic pipe tables, local images and links. Put blank
lines between blocks. Images require alternative text and a local
`/assets/` path. Tables require a header separator and equal column counts;
escaped pipes and nested formatting within table structure are unsupported.
Links
support HTTPS, root-relative site paths and heading anchors. Raw HTML is
displayed as text. Nested lists, YAML quoting and embedded HTML are not part
of this format. Do not add a top-level heading; the page
template supplies the article title.

Optional `aliases: old-slug, another-old-slug` metadata retains older URLs
as redirects. Aliases cannot collide with another article or alias; RSS and
the sitemap use the canonical article path only.

For the leakage article, edit `templates/leakage-article.md`, run
`python -m scripts.export_blog --website PATH_TO_WEBSITE` from the companion
project, then regenerate this site. The exporter fills the measured table
and dataset description and copies the chart, metrics and provenance into
`assets/customer-ml-data-leakage/`. Do not edit that generated post or the
copied results directly. The companion source lives in the sibling repository
`../customer-ml-data-leakage/`, separate from website files. Its Git remote is
`https://github.com/kraiyani/customer-ml-data-leakage.git`.

The publisher generates heading anchors, a table of contents, estimated
reading time, article metadata, RSS entries and sitemap URLs. Articles are
sorted newest first, with filename ordering for ties. The homepage shows
the latest three. RSS contains article summaries and links to full posts.

## Refresh the two new experiments

The code and generated experiment results live in the supplied project
clones, outside the website repository:

| Article source | Project repository | Website result snapshots |
| --- | --- | --- |
| `content/posts/training-serving-skew.md` | `../EFS/` | `assets/training-serving-skew/` |
| `content/posts/author-level-splitting.md` | `../author-profiling-pan-clef-2018/` | `assets/author-level-splitting/` |

Follow the experiment instructions in each project's README. After a
rerun, check the article's measured table and interpretation against the
new results, then copy `comparison.png`, `metrics.csv` and
`run_metadata.json` from that experiment's results directory into its
website snapshot directory. Copy generated results from their source;
do not edit result CSVs, charts or provenance directly.

Keep the declared settings and all reported seeds visible. If settings or
results change, update the article's explanation as well as the figures.
Regenerate this site and run the checks before publication. The article
sources are editorial documents; the publisher does not execute the
experiments or refresh their measured tables automatically.

## Weekly rhythm

Use Wednesday as the editorial target, with scope adjusted to the time
available. The following dates are a plan, not scheduled publications:

| Target date | Topic | Evidence to prepare |
| --- | --- | --- |
| 28 October 2026 | Active learning and a small labelling budget | A public dataset, a baseline and a documented selection rule |
| 4 November 2026 | Serving a trained model through FastAPI | A runnable local example, input validation and error cases |
| 11 November 2026 | A Jev routing evaluation | Synthetic labelled cases, named model configuration and end-to-end measurements |
| 18 November 2026 | Reading an AI benchmark critically | Original paper, evaluation setup and an explanation of its limits |

1. Collect a few relevant primary sources: official documentation, model
   cards, papers or release notes. Record when they were checked.
2. Choose one question the reader should be able to answer after reading.
3. Draft an original explanation, with a worked example or a small
   experiment. Label unexecuted examples and provider-reported claims.
4. Verify claims against the sources, run any code presented as tested,
   and review the wording and interpretation yourself.
5. Set the publication metadata, regenerate, validate and inspect the page.
6. Publish through your normal GitHub Pages process when ready.

This repository does not contain an active recurring research job,
scheduled AI service or automatic publication workflow. It needs no API
keys. The weekly cadence is a maintainable editorial process; generation
does not research or write future articles by itself.

## Validation and preview

```powershell
node --test scripts/build-blog.test.cjs
node scripts/build-blog.cjs --check
node --check assets/main.js
node scripts/verify.cjs
python -m http.server 8000 --bind 127.0.0.1
```

The browser script needs Playwright and Microsoft Edge, as described in
README.md. In environments that prevent test-runner child processes,
Node 24 supports `node --test --test-isolation=none scripts/build-blog.test.cjs`.
The browser checks cover motion preferences, keyboard interactions,
article links, RSS parsing, narrow screens and enlarged text, along with
the existing portfolio checks. Use the HTTP preview for clean blog URLs.
