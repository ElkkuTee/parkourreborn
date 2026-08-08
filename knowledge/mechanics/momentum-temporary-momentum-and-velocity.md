---
title: Momentum, Temporary Momentum, and Velocity
category: mechanics
aliases:
  - momentum cap
  - speed cap
  - momentum and velocity
  - movement stat
  - max momentum
tags:
  - mechanics
  - movement
  - momentum
  - speed
  - technical
---

## Momentum

Momentum is the movement stat used by running and many movement formulas.

Key values:

* **Base momentum:** 12.
* **Level 1 cap:** 26.
* **Level 20 cap:** 32.
* **Hard movement-stat cap:** 32.

The cap increases from 26 to 32 as the player levels, using an easing curve rather than a simple linear increase.

The active movement stat is:

**root momentum + temporary bonus, clamped from 0 to 32**

The cap controls the movement stat, not every physical launch.

Gear, wall movement, falling, slopes, swings, and velocity redirection can produce real physical velocity far above the ordinary momentum number.

This is why a player can move much faster than the momentum bar alone suggests.

## Temporary Momentum

Temporary momentum is a short bonus on top of normal momentum.

Dash and afterboost can add temporary momentum.

The dash system uses bonuses such as:

* ordinary dash ramping into a bonus and then settling around +2,
* afterboost giving a stronger temporary bonus,
* the combined movement stat still clamping at 32.

Temporary momentum is useful, but it is not the same as physical launch velocity.

The momentum bar may show one value while a wall bounce or fall carries a much larger physical vector.

## Velocity

Velocity is the player’s real movement through space.

Velocity has:

* magnitude,
* direction,
* vertical component,
* horizontal component.

A useful movement conversion preserves the magnitude while changing the direction to fit the next surface.

Several movement abilities preserve or redirect existing velocity instead of replacing it completely.