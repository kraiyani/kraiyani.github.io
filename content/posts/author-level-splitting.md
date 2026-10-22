---
title: Split by author before measuring text models
date: 2026-10-22
status: published
topics: Machine learning, NLP, Model validation, Reproducibility
summary: A synthetic companion to a PAN 2018 project shows why post-level and author-level evaluation answer different questions, with measured results and reproducible code.
---

A text model can score perfectly on heldout posts while answering a narrower question than its evaluator intended. If training already includes other posts from the same authors, the model can recognise recurring vocabulary rather than generalise to new people. The right validation unit follows the intended use: another post from a known author, or a feed from an unseen author.

I revisited my archived [PAN 2018 author-profiling project](https://github.com/kraiyani/author-profiling-pan-clef-2018) to make that distinction concrete. The companion experiment uses **entirely invented authors and fictional style labels A/B**. It downloads no PAN corpus, uses no real social posts, and trains no new demographic classifier. Its measured scores illustrate evaluation mechanics; they do not revise the historical competition results.

## What the archived code establishes

The [official PAN task](https://pan.webis.de/clef18/pan18-web/author-profiling.html) supplied feeds with 100 tweets and 10 images per author and requested author-level predictions. The archived English submission code votes across individual tweet predictions to produce one XML result per author.

In [English_train.py](https://github.com/kraiyani/author-profiling-pan-clef-2018/blob/master/English_train.py) and [Spanish_train.py](https://github.com/kraiyani/author-profiling-pan-clef-2018/blob/master/Spanish_train.py), each author's XML documents become CSV rows containing text and a gender label. Author identity is discarded. Both scripts fit the tokenizer on that table before asking Keras for `validation_split=0.1`. They also derive frequent-word filtering from the whole table.

Those observations need careful interpretation. [Keras documents](https://keras.io/api/models/model_training_apis/) that validation takes the last samples before training shuffles them. These scripts emit contiguous author blocks: an equal-sized block boundary could align with the cutoff and leave no author overlap. A boundary cutting through a block could share that author. Without reconstructing the actual ordering and lengths, I cannot claim measured overlap. The synthetic random-row split below deliberately differs from that tail split.

Dropping IDs makes explicit group enforcement and auditing harder. Fitting vocabulary and frequency filtering before validation is a separate preprocessing concern. Neither observation establishes contamination of the official PAN test set. The Arabic training script follows a different fastText path; the Keras-specific observation applies to English and Spanish.

## Construct the mechanism, then measure it

The [companion source and instructions](https://github.com/kraiyani/author-profiling-pan-clef-2018/tree/master/experiments) define 80 invented authors, balanced across labels A/B, with 20 invented posts each. Every post contains an author-specific token repeated four times, neutral vocabulary, and a weak shared cue that agrees with its author's class with probability 0.65.

The marker makes author recognition easy by construction. The shared cue gives an unseen-author model something useful to learn. These choices are a teaching device, not a simulation calibrated to real language.

Before the first default run, I fixed seed 2018, a 25% test fraction, unigram TF-IDF, and logistic regression with C=1 and the liblinear solver. There was no parameter search or selection of a favourable seed. Each condition fits its own vocabulary, IDF weights, and classifier using training posts only, following [scikit-learn's preprocessing guidance](https://scikit-learn.org/1.7/common_pitfalls.html#data-leakage).

Three conditions isolate the question. The row condition stratifies individual posts by label. The grouped condition stratifies the distinct author table, then assigns each author's complete feed together. The ablation condition reuses the row assignments and removes exactly the deliberately inserted author marker before fitting and predicting.

The implementation uses [train_test_split](https://scikit-learn.org/1.7/modules/generated/sklearn.model_selection.train_test_split.html) on those two different units. Group separation is also the purpose of tools such as [GroupShuffleSplit](https://scikit-learn.org/1.7/modules/generated/sklearn.model_selection.GroupShuffleSplit.html); its size parameters refer to groups rather than rows. Here, splitting a distinct-author table additionally keeps the fictional classes balanced.

## The measured result has two levels

All conditions train on 1,200 posts and test on 400. Both test labels have 200 posts. The author populations differ substantially:

| Condition | Train authors | Test authors | Authors in both |
| --- | ---: | ---: | ---: |
| Random posts | 80 | 80 | 80 |
| Grouped authors | 60 | 20 | 0 |
| Random posts, markers removed | 80 | 80 | 80 |

For author scoring, I average probability B across each author's heldout posts and predict B at 0.5 or above. This is a declared companion rule; the archived English script uses majority voting instead.

| Condition | Post accuracy | Post macro F1 | Author accuracy | Author macro F1 |
| --- | ---: | ---: | ---: | ---: |
| Random posts | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| Grouped authors | 0.6800 | 0.6794 | 1.0000 | 1.0000 |
| Random posts, markers removed | 0.6825 | 0.6825 | 0.7625 | 0.7625 |

![Post and author macro F1 for three synthetic validation conditions](/assets/author-level-splitting/comparison.png)

The random-post model classifies every heldout post correctly when all test authors also appear in training. Removing the constructed marker brings post accuracy close to the grouped condition. That supports the intended explanation within this toy dataset: recurring identity vocabulary supplies a shortcut.

But **grouped author accuracy remains perfect**: all 20 unseen synthetic authors are classified correctly after averaging their 20 posts. A weak shared signal can accumulate across a feed even when individual posts remain difficult. Calling this an overall collapse in author-profiling accuracy would misrepresent the result.

Author scores also have different evidence budgets. The random-post condition has five heldout posts per author on average, with variable counts across 80 authors; the grouped condition has exactly 20 for each of 20 authors. These are different test populations and aggregation opportunities. Neither score table is a general ranking of deployment quality. A perfect score on twenty constructed authors is a small, deliberately favourable demonstration, not a guarantee about unseen real authors.

## Keep the evaluation question visible

For a system intended to handle new authors, retain author IDs, split authors first, and fit learned preprocessing inside each training partition. Verify the empty author intersection directly. For additional posts from known authors, a row split may match part of the intended setting, but future-post evaluation may also require a time boundary.

Post-level accuracy answers whether individual texts are classified correctly. Author-level accuracy answers whether a declared aggregation rule succeeds with the available feed. Report both, together with author counts and posts per author, when both matter. A random-row versus grouped score difference is not a universal leakage penalty: the test populations have changed.

Marker removal is similarly limited. The ablation removes only the tokens I deliberately inserted. Real language can retain identity through names, topics, repeated phrases, or interaction patterns after obvious identifiers disappear. This experiment neither measures those effects nor establishes anonymisation.

## Reproduce and inspect

From the cloned project, with the separate pinned demo dependencies available:

```text
python -m pytest -q
python -m experiments.author_level_validation
```

The [fixed protocol](https://github.com/kraiyani/author-profiling-pan-clef-2018/blob/master/experiments/PROTOCOL.md) records the choices. Download the [measured metrics](/assets/author-level-splitting/metrics.csv) and [run metadata](/assets/author-level-splitting/run_metadata.json). The repository's generated results also include every invented post, split assignment, post prediction, and author probability average. Metadata records configuration, package versions, and source/data/artifact hashes using Pydantic JSON. Tests check deterministic generation, strict grouped isolation, training-only vocabulary, aggregation, and prediction coverage.

This remains one seed, one constructed distribution, and one simple model, without confidence intervals or real-corpus validation. The historical task's binary demographic labels also carry limits: they are not a complete representation of identity, and predictive accuracy does not establish consent, fairness, or suitability for profiling. Keeping the companion fictional makes it possible to examine the validation lesson without inferring anything about real users.
