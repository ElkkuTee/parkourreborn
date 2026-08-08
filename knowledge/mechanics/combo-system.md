---
title: Combo System
category: mechanics
aliases:
  - combo
  - combo system
  - coverage
  - combo score
  - how combo works
tags:
  - mechanics
  - combo
  - xp
  - scoring
  - progression
---

Combo unlocks at level 10.

Combo begins automatically when the player parkours.

Combo score increases by covering new areas quickly.

Combo can end when:

* the player stops for a while,
* the player takes serious damage,
* the player dies.

Dying still rewards XP from the combo.

Combos do not end while clutching onto something, meaning climbables can act as rest points.

## Combo Circles

When the player starts moving, the game creates invisible circles around them.

Once the player exits all previously laid circles and touches ground, combo coverage increases and a new, larger circle is placed.

This produces the “+COVERAGE” pop-up and a soft ping sound.

## Combo Numbers

The combo UI has several numbers:

* Big red number bottom-left: current multiplier, capped at x10000.
* Small gray number top-right: raw score, increasing based on how fast the player leaves coverage circles.
* Medium white number top-left: total score, equal to raw score multiplied by current multiplier.

Only the total score affects XP gained at the end of a combo.

## Combo to XP Formula

Base conversion:

**XP = Combo Score / 360,000**

Required combo for a target XP amount:

**Required Combo Score = XP Needed × 360,000**