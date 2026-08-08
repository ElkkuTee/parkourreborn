---
title: Falling, Stabilization, and Landing
category: mechanics
aliases:
  - falling
  - fall damage
  - stabilization
  - landing
  - terminal velocity
  - how to survive falls
tags:
  - mechanics
  - falling
  - landing
  - fall-damage
  - physics
---

## Falling

Important falling values:

* **Gravity:** 75.
* **Terminal downward velocity:** -210.
* **Upper vertical clamp:** +500.
* **Freefall/stabilization presentation begins below:** about -135 vertical velocity.
* **Stabilization gain:** 1 per second while Jump and Descend are held.
* **Stabilization decay:** 1 per second otherwise.

Fall stabilization is important for surviving large drops.

The player may need to stabilize before landing on dampeners or landing pads.

## Fall Damage

Fall damage is based on impact speed converted into an equivalent fall distance.

Formula:

**equivalent distance = 0.5 × gravity × (impact speed / gravity)²**

Important fall values:

* **Minimum landing height:** 8 studs.
* **Minimum damage height:** 20 studs.
* **Minimum damage:** 20 health.
* **Nominal fatal distance:** 65 studs.
* **Unprepared critical distance multiplier:** 0.58.
* **Bad prepared multiplier:** 0.75.
* **Normal prepared multiplier:** 0.8.
* **Imperfect multiplier:** 0.95.

Landing-prep windows:

* **Perfect:** under 50 ms.
* **Precise:** under 90 ms.
* **Roll boundary:** 175 ms.

On a cushion at near-terminal fall speed, the player needs strong preparation and enough stabilization to cancel damage.

Breakthrough surfaces can reduce damage and continue the fall with reduced velocity.