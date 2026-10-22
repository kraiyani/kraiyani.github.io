---
title: From 13 bands to six classes: revisiting Sentinel-2 scene classification
date: 2026-10-22
status: published
topics: Remote sensing, Computer vision, Research, ML engineering
summary: A walkthrough of my Sentinel-2 research and its public code, separating published benchmark results from the checks needed to reproduce the workflow today.
---

A satellite image is easy to recognise as a picture. It becomes a different engineering problem when every pixel needs a useful label.

Should this pixel be treated as water, shadow, cirrus, cloud, snow, or something else? How do we turn spectral measurements into that decision, and how do we check the result?

This note revisits work I co-authored with Teresa Gonçalves, Luís Rato, Pedro Salgueiro and José R. Marques da Silva. It connects the published study to two public code repositories. It is a research and implementation walkthrough, with small executed helper checks; it is not a new run of the paper's benchmark.

![Sentinel-2 input quicklook showing a coastline, water and surrounding land; this is an input preview, not model output.](/assets/sentinel-2-input.jpg)

The input quicklook above comes from the sample L1C product supplied with the [classifier repository](https://github.com/kraiyani/Sentinel_2_image_scene_classifier/tree/main/sample_L1C). It contains Copernicus Sentinel data from 2018. The picture is useful for orientation, but the classifier consumes spectral bands rather than this JPEG.

## What the study established

Our [2021 Remote Sensing paper](https://doi.org/10.3390/rs13020300) compared ML models with Sen2Cor v2.5.5 on a six-class scene-classification task. Table 7 describes 13 band features, 50 training products and 10 test products. The paper reports micro-F1 of 0.84 for its Extra Trees and CNN models, compared with 0.59 for Sen2Cor in the evaluated setting.

| Evidence | Reported value | Scope |
| --- | --- | --- |
| Training data | 50 products; 5,716,330 labelled samples | Published experimental setup |
| Test data | 10 products; 912,148 labelled samples | Held-out products in that study |
| ML micro-F1 | 0.84 | Published Extra Trees and CNN results |
| Sen2Cor micro-F1 | 0.59 | Published comparison using v2.5.5 |

These are historical published results, not measurements from the present checkout. Sen2Cor also performs atmospheric correction and other processing; this classification comparison does not establish that an ML classifier replaces the whole processor. The [full paper is available through the University of Évora](https://dspace.uevora.pt/rdpc/bitstream/10174/31995/1/remotesensing-13-00300-v2.pdf).

## Follow one pixel through the packaged classifier

The current modular repository makes the implementation relatively easy to inspect. Start with [main.py](https://github.com/kraiyani/Sentinel_2_image_scene_classifier/blob/main/main.py), then follow its call into [classifier.py](https://github.com/kraiyani/Sentinel_2_image_scene_classifier/blob/main/classifier.py).

The path through the code is:

1. Find an `IMG_DATA` directory inside the input product.
2. Build a virtual raster from the band files using `gdalbuildvrt`, requesting a 20 m grid.
3. Read the raster bands and stack the measurements into a per-pixel feature array.
4. Load `Model.joblib` and predict one image row at a time.
5. Store each predicted class and render an RGB class map.
6. Apply a neighbourhood rule and save a second RGB image.

The call to `np.dstack` changes the representation from separate band images into a grid of feature vectors. At a particular row and column, the model receives the measurements for that location. The row-wise prediction loop limits the batch passed to `predict`, although the implementation still holds the raster stack and class map in memory.

The six colours are a rendering convention. They are not confidence estimates, uncertainty scores, or evidence that a particular pixel was classified correctly.

| Class | Colour used by the code |
| --- | --- |
| Water | Blue |
| Shadow | Brown |
| Cirrus | Light purple |
| Cloud | Near-white |
| Snow | Cyan |
| Other | Green |

## Two repositories, two feature paths

An important detail appears when comparing the modular package with the [older research script](https://github.com/kraiyani/Sentinel-2-Image-Scene-Classification-A-Comparison-between-Sen2Cor-and-a-Machine-Learning-Approach/blob/master/L1C_to_six_class_creator.py).

In the modular `classifier.py`, the calls that calculate and append spectral indices are commented out. The active path stacks the band data as read. The presence of `index_calculator.py` does not mean those indices reach the packaged model.

The older script follows a different path: it divides band values by 10,000 and actively appends the values returned by its index function. That function returns 15 index arrays, despite a progress message referring to 12. Counting the returned arrays and tracing their consumer is more reliable than reading a console label.

| Implementation | Active feature construction |
| --- | --- |
| Modular classifier | Raster band arrays; index calculation disabled |
| Older research script | Scaled band arrays plus 15 calculated indices |

These scripts should not be treated as interchangeable inference front ends. A saved model expects the same feature definitions, order, and units used during training. Adding an apparently helpful index or changing reflectance scaling can violate that contract.

The local checks described below establish helper behaviour. They do not establish which preprocessing produced every historical model artifact.

## A small, executable index check

For a hand-checkable example, choose red reflectance of 0.2 and near-infrared reflectance of 0.6. The normalised difference `(0.6 - 0.2) / (0.6 + 0.2)` is 0.5.

The following example uses the real helper from the modular repository. Its positional arguments follow that function's declared band order, with `B8A` last:

```python
import numpy as np
from index_calculator import cal_index

bands = [np.full((2, 2), 0.1) for _ in range(13)]
bands[3][:] = 0.2  # B04: red
bands[7][:] = 0.6  # B08: near infrared
indices = cal_index(*bands)

assert len(indices) == 15
np.testing.assert_allclose(indices[5], 0.5)
```

This check was executed against the checked-out helper. Separate checks exercise zero denominators in the normalised ratios. Returning zero for those ratios is a numerical convention in this code; it does not make a no-data pixel a valid observation.

This example explains an available helper. It does not imply the helper is active in the packaged classifier.

## What neighbourhood voting changes

The [postprocessor](https://github.com/kraiyani/Sentinel_2_image_scene_classifier/blob/main/postprocessor.py) chooses the most common class from the centre pixel and its immediate neighbours. An interior pixel has up to nine votes, including itself; corners and edges use the neighbours that exist.

Consider this synthetic class map:

```text
cloud  cloud  cloud
cloud  water  cloud
cloud  cloud  cloud
```

For the centre pixel, the function returns `cloud`. That is an executed example of the local rule, not a result on a satellite image. Tests also cover a uniform map at the centre, edges and corners, and a tied corner vote where the centre class is encountered first.

Smoothing can remove isolated speckles. It can also remove a genuine small feature or shift a boundary. A cleaner-looking map therefore needs its own evaluation against labels, especially around coastlines, narrow rivers, and cloud edges. Visual consistency alone does not establish better accuracy.

## What was checked, and what remains open

For this walkthrough, the source paths were inspected and the index and neighbourhood helpers were exercised with synthetic arrays. The classifier's LFS model and imagery were previously checked for complete downloads. Neither the full-scene CLI nor the paper's training and test comparison was rerun here.

The legacy environment needs more than installing the listed Python packages. The code imports Django's GDAL integration and calls a native `gdalbuildvrt` executable. It also builds shell commands from paths and invokes `rm` for cleanup. Those details need attention before presenting the CLI as a tested Windows workflow, especially with spaces and long Sentinel product paths.

My reproduction checklist would be:

- Record the repository revision, model hash, dependency versions and native GDAL version.
- Establish the exact band order and feature units expected by the saved model.
- Confirm no-data handling, output extent and grid alignment on a small scene first.
- Run the original and postprocessed predictions against the same labelled pixels.
- Keep image products or geographical regions separate when testing generalisation.
- Report class-level results alongside an aggregate score.

Micro-averaging pools decisions across classes. For a complete single-label multiclass prediction, the resulting micro-F1 equals the fraction of correct predictions. That aggregate can still hide a weak class, which is why class-level error analysis matters.

The connection to [customer-level data leakage](/blog/preventing-data-leakage-customer-level-ml/) is evaluation design: the held-out unit should match the generalisation claim. For customers it might be an unseen person; for imagery it might be an unseen product or region.

## Explore the implementation

- [Modular classifier, sample input and model](https://github.com/kraiyani/Sentinel_2_image_scene_classifier)
- [Original research script](https://github.com/kraiyani/Sentinel-2-Image-Scene-Classification-A-Comparison-between-Sen2Cor-and-a-Machine-Learning-Approach)
- [Published paper and DOI](https://doi.org/10.3390/rs13020300)

The useful lesson is to keep research evidence, runnable code, and preprocessing assumptions connected. A published score explains an experiment; a reproducible implementation also has to explain exactly what reaches the model.
