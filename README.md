# FPV Freeride World

A browser-based 3D FPV freestyle prototype built with Three.js.

## Flight model

The drone now uses an Acro/Rate-style controller: roll, pitch and yaw sticks command angular velocity and centered sticks do not automatically level the craft. The model emphasizes momentum, throttle management, high rotation rates, dives, snap rolls and fast recovery. The tuning was informed by current FPV simulator and acro guidance emphasizing rate control, coordinated turns, throttle timing and freestyle rates.

## Desktop
- W/S — pitch
- A/D — roll
- Q/E — yaw
- Space / Shift — throttle up/down
- Click the view — pointer lock for additional pitch/roll steering
- R — reset
- Boost is enabled through the mobile UI; desktop Shift provides aggressive throttle

## Mobile
- Left stick — throttle + yaw
- Right stick — pitch + roll
- BOOST — higher thrust and faster rates

The world is procedural so it can run as a lightweight static site on Vercel.
