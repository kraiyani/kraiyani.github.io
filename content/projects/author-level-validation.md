---
title: Author-level NLP validation
date: 2026-10-22
status: published
topics: NLP, Grouped validation, Synthetic experiments
summary: A fictional-author experiment separating post classification, author aggregation and identity shortcuts in evaluation.
---

[View experiment code](https://github.com/kraiyani/author-profiling-pan-clef-2018/tree/master/experiments) · [Read the technical article](/blog/author-level-splitting/)

![Post and author macro F1 measured under three synthetic validation conditions](/assets/author-level-splitting/comparison.png)

## The problem

Splitting a collection of posts at random can put the same author in both training and testing. A model can then exploit recurring identity vocabulary even when the intended deployment concerns unseen authors. An author-level task also needs an explicit rule for combining post predictions.

## My contribution

I inspected the archived English and Spanish PAN training scripts and built a separate experiment using invented authors, invented posts and fictional labels. The companion preserves author IDs, records split assignments and evaluates both individual posts and aggregated author predictions.

The source inspection does not establish measured author overlap in the historical Keras validation slice or contamination of the official PAN test set.

## The approach

The fixed-seed demonstration generates 80 fictional authors with 20 posts each. Every author has a deliberately inserted marker and a weak shared class cue. Each condition fits its own TF-IDF vocabulary and logistic-regression classifier on training posts only.

- A stratified random-post split allows repeated authors.
- An author-grouped split holds out 20 entire authors.
- A marker-removal ablation reuses the random-post assignments.

The author score averages class probabilities across that author's held-out posts, using a declared 0.5 threshold.

## What the evidence shows

| Condition | Post accuracy | Author accuracy |
| --- | --- | --- |
| Random posts | 1.0000 | 1.0000 |
| Grouped authors | 0.6800 | 1.0000 |
| Random posts, markers removed | 0.6825 | 0.7625 |

The marker ablation supports the intended identity-shortcut mechanism in this constructed dataset. However, all 20 unseen authors remain correctly classified after aggregating their posts. Reporting an overall collapse in author-profiling accuracy would misrepresent these measurements.

## Limits and engineering lesson

The conditions have different author populations and different numbers of held-out posts per author. This is one designed distribution and one seed, without confidence intervals or real-corpus validation. Removing the inserted marker also does not establish anonymisation of real language.

The outcome is a reproducible example of choosing and auditing the unit of generalisation. Preserve group identity, fit learned preprocessing inside the split, and report post-level and author-level evidence separately.

## Inspect and reproduce

- [Companion experiment and instructions](https://github.com/kraiyani/author-profiling-pan-clef-2018/tree/master/experiments)
- [Declared experiment protocol](https://github.com/kraiyani/author-profiling-pan-clef-2018/blob/master/experiments/PROTOCOL.md)
- [Measured metrics](/assets/author-level-splitting/metrics.csv)
- [Run configuration and provenance](/assets/author-level-splitting/run_metadata.json)
- [Full article and historical-source discussion](/blog/author-level-splitting/)
