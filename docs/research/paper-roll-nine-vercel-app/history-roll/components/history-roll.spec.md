# History Roll component specification

## Data contract

- Read with `parseDecisionHistory(localStorage.getItem(decisionHistoryKey))` after mount.
- Listen for `storage` changes so another tab can refresh the roll.
- Never mutate, clear, or silently manufacture decision records.

## UI states

- Loading: a single receipt marked “Arranging the archive”.
- Empty: an explanatory receipt plus “Return to the decision room”.
- Populated: newest first; filters for all / food / style / travel.
- Filter-empty: receipt explains that category has no record.

## Receipt anatomy

- Sequence number and category.
- Result name as the dominant field.
- Result detail and game mode.
- Full local date and time, carried by a semantic `time` element.

## Motion

- Default full motion, matching the site-wide policy requested for this project.
- Auto-roll on idle.
- Pointer vertical position changes travel direction and speed.
- Pointer horizontal position creates subtle reel yaw.
- Wheel and drag add direct movement.
- Click on the stage pauses/resumes; interactive controls are excluded.
