---
title: Sentinel-2 scene classification
date: 2026-10-22
status: published
topics: Earth observation, Computer vision, Research engineering
summary: Co-authored remote-sensing research connected to its public classifier, preprocessing assumptions and the boundaries of reproducibility.
featured: 3
---

[View classifier code](https://github.com/kraiyani/Sentinel_2_image_scene_classifier) · [Read the research walkthrough](/blog/sentinel-2-scene-classification/) · [Published paper](https://doi.org/10.3390/rs13020300)

![Sentinel-2 sample input quicklook showing a coastline; this is input imagery, not a classification result](/assets/sentinel-2-input.jpg)

The quicklook contains Copernicus Sentinel data (2018), supplied with the classifier repository.

## The problem

Downstream earth-observation workflows need to distinguish water, shadow, cirrus, cloud, snow and other pixels. The challenge is to connect spectral measurements to these six labels and evaluate the result on held-out image products.

## My contribution

I co-authored the 2021 comparison of machine-learning classifiers and Sen2Cor with Teresa Gonçalves, Luís Rato, Pedro Salgueiro and José R. Marques da Silva. The linked repositories expose the modular classifier and the earlier research script.

For the current walkthrough, I inspected both feature paths and exercised spectral-index and neighbourhood-voting helpers with small synthetic arrays. That work connects the published experiment to implementation details without presenting helper checks as a benchmark reproduction.

## The approach

The modular classifier locates image bands, builds a raster on a 20 m grid, stacks per-pixel features, loads a fitted model and renders predicted classes. A neighbourhood vote produces a second class map.

The two code paths require different assumptions. The modular classifier has index appending disabled; the older research script scales band values and appends 15 calculated indices. Model inputs must match the feature definitions, order and units used during training.

## What the evidence shows

| Evidence from the 2021 paper | Reported value |
| --- | --- |
| Training products | 50 |
| Test products | 10 |
| Extra Trees and CNN micro-F1 | 0.84 |
| Sen2Cor v2.5.5 micro-F1 | 0.59 |

These are historical published scores for that evaluated setting. The current helper checks establish numerical and neighbourhood behaviour only; neither the full-scene CLI nor the paper's benchmark was rerun for this case study.

## Limits and engineering lesson

Sen2Cor performs other processing beyond scene classification. This comparison does not establish that the classifier replaces the complete processor. Reproducing the workflow also requires native GDAL, a verified model artifact, the expected band order and careful handling of no-data pixels.

The enduring engineering question is whether the deployed feature construction matches the research experiment. A clear model-input contract is as important as the aggregate score.

## Inspect the work

- [Modular classifier, sample imagery and model](https://github.com/kraiyani/Sentinel_2_image_scene_classifier)
- [Original research implementation](https://github.com/kraiyani/Sentinel-2-Image-Scene-Classification-A-Comparison-between-Sen2Cor-and-a-Machine-Learning-Approach)
- [Published paper](https://doi.org/10.3390/rs13020300)
- [University of Évora full text](https://dspace.uevora.pt/rdpc/bitstream/10174/31995/1/remotesensing-13-00300-v2.pdf)
- [Detailed walkthrough and reproduction boundaries](/blog/sentinel-2-scene-classification/)
