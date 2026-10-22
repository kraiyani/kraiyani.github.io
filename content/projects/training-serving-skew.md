---
title: Consistent training and inference
date: 2026-10-22
status: published
topics: ML reliability, Pipelines, Regression testing
summary: A controlled experiment tracing how inconsistent feature scaling changes predictions, with a persisted pipeline and paired holdout checks.
featured: 2
---

[View experiment code](https://github.com/kraiyani/EFS/blob/main/experiments/training_serving_skew.py) · [Read the technical article](/blog/training-serving-skew/)

![Measured comparisons of raw, mismatched and consistent inference paths across three synthetic runs](/assets/training-serving-skew/comparison.png)

## The problem

The inspected legacy code trains its random forest on raw feature values but scales inputs in the prediction path. Both paths accept the expected columns, yet the model receives numbers in different units. A schema check alone cannot catch that mismatch.

## My contribution

I traced the transformation, training and prediction paths and built a separate synthetic experiment to isolate their inconsistency. The companion includes a fixed protocol, paired predictions, regression tests, recorded metrics and persistence checks. It leaves the legacy application and existing model artifacts unchanged.

## The approach

Three predeclared seeds each generate 4,000 synthetic rows, with 3,000 used for training and 1,000 held out. Each run compares the same ordered holdout through three paths:

1. A forest trained and evaluated on raw features.
2. That same forest receiving scaled features only at serving time.
3. A complete scaler-and-forest pipeline trained and served consistently.

All fitted preprocessing uses training rows only. The complete pipeline is saved, reloaded and checked for identical holdout predictions.

## What the evidence shows

| Prediction path | Mean ROC-AUC | Mean accuracy |
| --- | --- | --- |
| Raw baseline | 0.8308 | 0.7573 |
| Scaled serving | 0.5000 | 0.5630 |
| Consistent pipeline | 0.8308 | 0.7573 |

The mismatch changed 1,177 of 3,000 paired classification decisions. The consistent pipeline reproduced the baseline probabilities and classes exactly in these runs. Tests also check that inference does not refit the scaler and that persisted artifacts replay the recorded requests.

## Limits and engineering lesson

The synthetic ranges deliberately make the failure severe. These measurements do not describe production EFS performance, customer outcomes or a typical deployment error. A separate feature-selection concern in the legacy source is outside this experiment.

The practical outcome is a tested example of preserving the whole prediction function: fit transformations with the model, persist them together, and verify the path from raw request to probability.

## Inspect and reproduce

- [Experiment source](https://github.com/kraiyani/EFS/blob/main/experiments/training_serving_skew.py)
- [Repository and experiment instructions](https://github.com/kraiyani/EFS)
- [Per-seed metrics](/assets/training-serving-skew/metrics.csv)
- [Run configuration and provenance](/assets/training-serving-skew/run_metadata.json)
- [Full article and reproduction commands](/blog/training-serving-skew/)
