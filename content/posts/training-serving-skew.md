---
title: Training-serving skew: when the same model sees different numbers
date: 2026-10-22
status: published
topics: Machine learning, Model validation, MLOps, Reliability
summary: A reproducible synthetic experiment shows how scaling only at prediction time changes a random forest's behaviour, and how a persisted pipeline keeps the input contract consistent.
---

A model can receive the right columns in the right order and still receive the wrong inputs.

Suppose a decision tree learns a split at a balance of 40,000. During validation, a balance of 60,000 goes to one branch. If the serving code first scales that balance to 0.6, the same tree sends it to the other branch. The request parses successfully. The model returns a probability. The calculation is valid for a different coordinate system.

This is training-serving skew: the deployed path constructs inputs differently from the path used to fit or validate the model. I built a small synthetic experiment to isolate this failure. It measures a controlled mechanism, not EFS production performance.

## The mismatch in the source

In my [EFS repository](https://github.com/kraiyani/EFS), the legacy transformation function fits a `MinMaxScaler` and computes transformed values, but returns selected columns from the original raw feature frame. The trainer splits that frame and fits its classifiers on raw values.

The prediction path then loads a saved scaler, transforms incoming features, and passes those scaled values to the saved random forest. Each function appears plausible alone. Together, they disagree about what a feature value means.

There is a separate validation concern: feature selection, including selection that uses labels, happens before the training/test split. That can contaminate evaluation. This experiment excludes feature selection and fits both experimental scalers on training rows only, so the measured difference isolates serving inconsistency. The legacy source and existing model artifacts remain unchanged.

Scikit-learn's [common pitfalls guide](https://scikit-learn.org/stable/common_pitfalls.html#inconsistent-preprocessing) describes the corresponding requirement: preprocessing must be consistent across fitting and subsequent predictions.

## One holdout, three prediction paths

The companion experiment is in `experiments/training_serving_skew.py`. It generates six independent synthetic features with unequal units: account age, balance, income, late-payment days, payment count and utilisation percentage. Labels come from an arbitrary probabilistic relationship between those variables. These names and coefficients encode no credit-risk assumptions.

I fixed seeds 11, 29 and 47 before running results. Each seed generates 4,000 new rows and creates one stratified split: 3,000 training rows and 1,000 holdout rows. The forest uses 160 trees, maximum depth eight, minimum leaf size four and one worker. There is no hyperparameter, threshold or seed search.

Every seed evaluates three paths on exactly the same ordered holdout:

**Raw baseline:** train a forest on raw values and predict raw holdout rows.

**Scaled serving:** take that same fitted forest and feed it holdout rows transformed by a scaler fitted only on training features. This changes the input representation without retraining the model.

**Consistent pipeline:** fit a new scaler-and-forest pipeline on the training rows, then supply raw holdout requests through that complete pipeline.

The synthetic ranges are deliberately positive and above one. For example, balance ranges from 10,000 to 100,000, while utilisation ranges from 5 to 95. After scaling, values sit near zero to one and below the raw forest's learned split thresholds. This makes the mechanism unusually clear and severe. It does not estimate the size of a typical deployment error.

## What the measurements show

The table reports arithmetic means across the three declared seeds. Each individual run evaluates 1,000 holdout rows; these are separate synthetic datasets.

| Prediction path | ROC-AUC | Average precision | Accuracy | Labels differing from raw baseline |
| --- | --- | --- | --- | --- |
| Raw baseline | 0.8308 | 0.7931 | 0.7573 | 0.00% |
| Scaled serving | 0.5000 | 0.4370 | 0.5630 | 39.23% |
| Consistent pipeline | 0.8308 | 0.7931 | 0.7573 | 0.00% |

![Three fixed synthetic runs comparing ROC-AUC, average precision, accuracy and prediction disagreement across raw, mismatched and consistent input paths.](/assets/training-serving-skew/comparison.png)

The mismatched path changed **1,177 of 3,000 paired classification decisions**. Its mean absolute class-1 probability difference from the raw baseline was **0.2438**, with a largest observed difference of **0.7466**. Label changes by seed were 393, 380 and 404.

Within each run, the mismatched path produced a constant probability and predicted class zero for every request. Its ROC-AUC was therefore 0.5, and average precision equalled that holdout's positive prevalence: 0.435, 0.431 and 0.445. Accuracy stayed above 0.55 because the negative class was more common. That accuracy number conceals the loss of ranking information.

Raw-baseline ROC-AUC ranged from 0.8180 to 0.8391. The consistent pipeline reproduced the raw baseline's probabilities and classes exactly in all three runs. This is consistent with a forest learning corresponding thresholds when an affine scaling transformation is applied during both fitting and inference. It is not a claim that every numerical transformation leaves every fitted forest unchanged.

The [per-seed metrics CSV](/assets/training-serving-skew/metrics.csv) contains the unrounded measurements, positive counts and probability differences. The [run metadata](/assets/training-serving-skew/run_metadata.json) records configuration, package versions, split counts, persistence checks and SHA-256 hashes. Full synthetic rows and paired predictions remain in the companion results directory.

## Persist the prediction contract

A practical correction is to treat preprocessing and the estimator as one fitted artifact. Scikit-learn's [Pipeline](https://scikit-learn.org/stable/modules/generated/sklearn.pipeline.Pipeline.html) fits each transform within its training call and applies those transforms before prediction.

The experiment saves `pipeline_seed_11.joblib`, `pipeline_seed_29.joblib` and `pipeline_seed_47.joblib`. Each contains the fitted scaler and forest. Serving code accepts raw features and calls the pipeline once.

After generating the results, this example replays seed 11's saved raw holdout:

```python
import joblib
import pandas as pd

from experiments.training_serving_skew import FEATURE_NAMES

folder = "results/training_serving_skew"
data = pd.read_csv(f"{folder}/synthetic_data.csv", dtype=str)
requests = data.loc[
    (data.seed == "11") & (data["split"] == "test"),
    FEATURE_NAMES,
].astype(float)

pipeline = joblib.load(f"{folder}/pipeline_seed_11.joblib")
probabilities = pipeline.predict_proba(requests)[:, 1]
assert len(probabilities) == 1000
```

This reads the newly generated local artifact. Use only model files you trust. Keeping the preprocessing inside the artifact reduces the chance that a request handler will independently recreate a different transformation.

Training-only fitting also matters. [MinMaxScaler](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.MinMaxScaler.html) learns feature minima and maxima; a holdout or later request can fall outside the training range. The tests deliberately send an extreme request and verify that inference does not update those learned statistics.

## Reproduce and interpret the result

The experiment ran with Python 3.11.7 and scikit-learn 1.7.2. A dedicated requirements file pins its direct dependencies. From the EFS repository root:

```sh
python -m pip install -r experiments/requirements-training-serving-skew.txt
python -m pytest tests/test_training_serving_skew.py -q
python -m experiments.training_serving_skew
```

The five regression tests passed. They cover repeatable generation and holdout identity, training-only scaler fitting, detection of the injected mismatch, exact prediction parity after persistence, and replayable output artifacts. The runner also reloads each complete pipeline and requires exact class and probability agreement across its holdout.

Three fixed seeds provide a limited sensitivity check, not confidence intervals. The data has independent rows, a designed signal and deliberately separated numeric ranges. This run says nothing about actual customers, calibration, subgroup performance or changing deployment conditions.

A real application repair would also need to address feature-selection leakage, input schema, artifact migration and tests through the actual request path. The lesson demonstrated here is narrower and useful: validate the complete function that turns a raw request into a prediction, and persist the fitted transformations that give those numbers their meaning.
