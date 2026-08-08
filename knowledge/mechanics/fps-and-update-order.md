---
title: FPS and Update Order
category: mechanics
aliases:
  - fps
  - framerate
  - update order
  - tick rate
  - does fps matter
tags:
  - mechanics
  - physics
  - technical
  - performance
---

Parkour Reborn physics uses fixed substeps, but not every movement check happens in the same loop.

Some movement logic depends on:

* physics substeps,
* input events,
* frame delta,
* wallrun accumulators,
* state changes,
* raycast timing,
* render/step callbacks.

Important examples:

* physics gravity uses 120 Hz substeps,
* wallrun has its own 120 Hz accumulator,
* input retry logic can use around 1/60 second timing,
* Powerslide-to-slide landing logic can check a 1/30-second ground window,
* jump buffer uses the larger of its timer and current frame delta.

This is why some advanced coyote re-entry techs can be FPS-sensitive even though core gravity is substepped.

These depend on landing, ledge state, dropdown state, buffered input, and update order lining up favorably.

The important point is not simply “higher FPS always wins.” The exact contact timing and callback order matter.