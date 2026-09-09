# Behavior notes

## V11 correction — original 3D roll restored

The DOM mechanism described below was rejected by the user and is superseded. The current /history route embeds a local Three.js r128 scene adapted directly from original/index.html. Cylinder/ribbon geometry, UV mapping, physics solver, path sampling, peel, pointer raycast, camera and idle pre-roll retain the original implementation. Only paper content, brand text and the ivory/olive palette change. No vertical scrolling reel remains. Tests run both solvers with identical inputs and compare all positions, paper vertices, UVs and camera coordinates. Browser/GPU visual acceptance remains with the user.

Historical V10 notes:

The inspected reference is a full-viewport WebGL scene. Its paper barrel and trailing ribbon are procedurally rendered; the pointer is projected onto a floor plane, a spring/damper solver follows that target, and the roll continues on an autonomous curved path after pointer inactivity. A short click toggles pause.

This implementation reproduces the perceived behavior with a DOM paper mechanism so history remains selectable, legible, responsive, and accessible. A GSAP ticker updates a wrapped vertical paper track, spring-like velocity, reel rotation, pointer steering, wheel impulses, drag motion, idle travel, and click pause/resume.

The page deliberately does not seed invented history. With no stored decisions, the paper prints an explanatory empty receipt and links back to the choice rooms.
