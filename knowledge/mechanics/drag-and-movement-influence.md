---
title: Drag and Movement Influence
category: mechanics
aliases:
  - drag
  - air drag
  - movement influence
  - turning
  - bhop grace
  - air control
tags:
  - mechanics
  - physics
  - movement
  - speed
  - technical
---

The controller applies drag multiplicatively each step.

After the 0.1-second bhop grace period, grounded drag replaces air drag. This is why jumping quickly after landing can preserve more speed than staying grounded.

Movement influence changes with speed. At high speed, input does not simply set the player’s velocity. It blends the current vector toward the requested movement vector.

This means that turning sharply against a fast vector spends speed.

Camera direction and input angle are physical resources. They are not only visual presentation.