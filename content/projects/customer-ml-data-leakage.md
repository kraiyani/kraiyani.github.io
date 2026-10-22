---
title: Customer-level ML validation
date: 2026-10-22
status: published
topics: Model validation, Point-in-time features, scikit-learn
summary: A reproducible synthetic experiment examining customer overlap, future information and the deployment question behind a validation score.
featured: 1
---

[View code](https://github.com/kraiyani/customer-ml-data-leakage) · [Read the technical article](/blog/preventing-data-leakage-customer-level-ml/)

![ROC-AUC comparisons from the synthetic customer validation experiment](/assets/customer-ml-data-leakage/validation_comparison.png)

## The problem

A customer can appear in many rows, and a feature can describe information that arrived after the intended prediction. A convincing offline score can therefore answer a different question from the one the deployed model needs to solve.

## My contribution

I built a self-contained demonstration connecting synthetic data generation, feature availability, validation strategies and automated leakage checks. The public repository contains the Python implementation, notebook, tests and recorded results. It uses no real customer or employer data.

## The approach

The fixed-seed experiment generates 300 customers across 24 periods: 7,200 snapshots. A logistic-regression pipeline fits numeric preprocessing and customer encoding on training rows only.

- Random-row and customer-grouped splits examine different customer populations.
- A chronological split evaluates later snapshots and enforces training-label maturity.
- A deliberately invalid future-target feature acts as a negative control.
- Historical features use only events available by each prediction cutoff.

## What the evidence shows

| Condition | ROC-AUC | Interpretation |
| --- | --- | --- |
| Random rows | 0.836026 | Repeated customers can appear on both sides |
| Held-out customers | 0.713793 | Entire customer identities are unseen |
| Chronological baseline | 0.826301 | Future-period holdout |
| Future target copy | 1.000000 | Deliberately invalid control |
| Corrected historical features | 0.825284 | Same chronological rows, point-in-time history |

The random and grouped scores describe different generalisation questions. The last three conditions share the same training and test rows, making the future-feature comparison more direct. Correcting the invalid feature restores a realistic score; it does not guarantee an improvement over the baseline.

## Limits and engineering lesson

This is one constructed dataset and one fixed seed, with a recurrent missed-payment target. It is not a churn benchmark or a measurement of business performance. Its value is an inspectable evaluation contract: who is held out, when features become available, and which labels could be known at training time.

## Inspect and reproduce

- [Repository and reproduction instructions](https://github.com/kraiyani/customer-ml-data-leakage)
- [Complete measured metrics](/assets/customer-ml-data-leakage/metrics.csv)
- [Run configuration and provenance](/assets/customer-ml-data-leakage/run_metadata.json)
- [Full article and validation discussion](/blog/preventing-data-leakage-customer-level-ml/)
