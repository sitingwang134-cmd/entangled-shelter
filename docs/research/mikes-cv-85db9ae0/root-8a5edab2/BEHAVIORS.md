# Observed Behaviours

## Reference mechanism

Static source inspection reveals a five-layer window: inner scene, rear frame, vertically translated shade, shadow/tint, and front frame. The reference accepts direct pointer dragging across the whole window, switches between grab and grabbing cursors, and exposes open/close language for assistive technology. A sky gradient and cloud layers remain visible through a rounded inset while the shade moves.

## Local adaptation

- Dragging upward opens the silk shade; dragging downward closes it.
- Releasing the pointer settles the shade to a mostly open or mostly closed state.
- Pointer movement shifts the landscape by a few pixels for dimensional response.
- Arrow keys adjust the shade, Home and End fully open or close it, and Space/Enter toggles it.
- The separate “Explore Wander” control opens the decision room without conflicting with the drag surface.
- With reduced motion enabled, transitions become effectively immediate while all controls remain usable.

## Research constraint

The live interactive browser surface was unavailable during capture, so behaviour was verified from downloaded production assets and source bundles. The saved reference screenshot records the entry state; geometry and motion notes come from the site's shipped implementation.
