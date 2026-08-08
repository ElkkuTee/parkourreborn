---
title: Core Physics Foundation
category: mechanics
aliases:
  - physics
  - movement controller
  - physics values
  - gravity
  - substeps
  - movement states
tags:
  - mechanics
  - physics
  - technical
  - movement
---

Parkour Reborn uses a custom movement controller with several important states:

* NoPhysics,
* Idle,
* Running,
* Walking,
* Jumping,
* Falling,
* Sliding.

The physics model uses fixed substeps and velocity clamps to keep movement stable.

Important physics values include:

* **Physics rate:** 120 fixed substeps per second.
* **Frame-time handling:** engine delta is capped at 0.1 seconds.
* **Gravity:** 75 studs/s².
* **Air drag:** 0.1 on horizontal axes.
* **Horizontal terminal magnitude:** 5000 studs/s.
* **Vertical terminal range:** -210 to +500 studs/s.
* **Bhop ground-drag grace:** 0.1 seconds.
* **Minimum falling-state delay:** 0.08 seconds after physical grounding is lost, and only once vertical velocity is non-positive.

The movement controller separates the visible character from the physical checks used to determine floors, walls, slopes, and movement states.

This is why some movement can look strange visually. The game is not only checking the character model. It is checking movement hitboxes, raycasts, overlap boxes, velocity vectors, and state flags.