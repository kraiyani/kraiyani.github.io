# Content and design sources

Prepared from the supplied local material on 21 October 2026.

| Material | Use |
| --- | --- |
| `resource/2026-10-21/referenced-chatgpt-conversation-this-is-an/outputs/kraiyani.github.io/` | Public project summaries and repository links, conceptual language artwork, static site conventions and progressive theme/print enhancements. |
| `resource/kashyap/outputs/Kashyap_Raiyani_CV_plain_text.txt` | Employment, education, selected publications and demonstrated technical skills. |
| `resource/kashyap/outputs/CV_evidence_and_conclusions_2026-09-19.md` | Conservative wording, official titles and distinction between a proof of concept and production delivery. |
| [Brittany Chiang](https://brittanychiang.com/) and [v4](https://github.com/bchiang7/v4) | User-requested design references: navy palette, accent colour, typographic hierarchy and navigation. Credit appears on the homepage. No source code, personal text, fonts or images copied. |
| [GitHub Pages documentation](https://docs.github.com/en/pages) | Static-site hosting and publishing-source guidance. |

## Editorial decisions

- Career information is supplied by the owner, rather than independently
  audited or refreshed from employer profiles. “Present” follows the
  supplied September 2026 CV; update it when the role changes.
- The homepage selects a concise account of the work. The public résumé
  is an HTML adaptation, not a copy of the original private PDF.
- Private email, telephone, identity documents, internal URLs, research
  notes and application history are excluded from site files.
- Production scale, commercial commitments, internal model names and
  unverified performance figures are omitted from this public version.
- No formal line-management scope, sole authorship, competition ranking
  or measured business improvement is inferred.
- Project descriptions retain the scope in the supplied 21 October site
  archive, with the Sentinel-2 feature grounded in a later source inspection.
  Executed checks and results are described separately below; a project
  summary does not imply a full reproduction of its original experiments.
- Publication titles and venues follow the supplied CV. No live citation
  metrics or publication-count claims are included.
- Illustrations are conceptual graphics, not software screenshots or
  model results. No live API calls, analytics or contact-form backend are used.

The `resource/` archive is intentionally ignored and should remain local.

## Writing added on 21 October 2026

Original explanatory notes are authored in `content/posts/`. Technical
sources are linked beside the relevant claims in each article. The Jev
note uses the user-supplied LangChain article and AlphaMatch comparison
as starting points, and checks the interface against LangChain's TypeSafe
documentation, TypeSafe's launch article and Laya's publisher model card.
The ML notes cite scikit-learn's documentation on leakage, validation,
classification metrics and calibration.

The Jev and evaluation notes are documentation-based writeups with synthetic
examples and editorial analysis. No live Jev/Laya API evaluation was run,
and the site does not present provider speed, price or accuracy claims as
its own results. The three initial articles share the actual preparation
date; no historical weekly publishing record has been invented.

The leakage article was expanded from the owner's supplied draft and a
locally executed companion project for `kraiyani/customer-ml-data-leakage`.
Its generated results table, chart, downloadable metrics and run provenance
come from the fixed-seed synthetic experiment. The introductory 0.96 value
is explicitly hypothetical. The actual five experiment scores, the
deliberately invalid future-target control and the distinct holdout
questions are explained separately. Raw and feature data are synthetic.

Introductory motion and interaction effects respect reduced-motion
preferences. The implementation follows the intent of
[W3C's animation guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).

## Sentinel-2 walkthrough added on 22 October 2026

The article and homepage research feature trace `classifier.py`,
`index_calculator.py`, `postprocessor.py`, and the historical
`L1C_to_six_class_creator.py` in the owner's two Sentinel-2 repositories.
The modular classifier's index-appending path is disabled; the older script
actively appends 15 indices. The distinction is retained in the article.

Historical benchmark figures are attributed to Raiyani et al. (2021),
[DOI 10.3390/rs13020300](https://doi.org/10.3390/rs13020300), checked against
the [University of Évora full text](https://dspace.uevora.pt/rdpc/bitstream/10174/31995/1/remotesensing-13-00300-v2.pdf).
They are not a fresh benchmark on the local checkout. Only numerical
helpers and neighbourhood voting are exercised on small synthetic arrays.

`assets/sentinel-2-input.jpg` is an unchanged copy of the classifier
repository's 2018 sample L1C quicklook. It contains Copernicus Sentinel data
(2018), shows input imagery, and is explicitly not labelled as model output.
No new classification map, speed claim or accuracy improvement is inferred.
