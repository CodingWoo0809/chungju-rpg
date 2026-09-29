# Hurdle Goblin painted part atlas

Generation mode: built-in `image_gen` (`stylized-concept`), followed by two built-in `background-extraction` edits.

Generated files:

- Initial atlas: `exec-1b76c0f6-9e64-4e60-89ed-73453564f6fc.png`
- First background extraction: `exec-d38f442e-6505-442a-a72a-a4aa35af7f0b.png`
- Referenced-file alpha retry: `exec-fbdbd941-5c05-401f-819d-2c7241bcbabe.png`
- Immediate-predecessor alpha retry: `exec-3a4aa92a-9af6-4be3-9bc7-a5e51306a615.png`

All three background-extraction outputs were inspected directly and were opaque `Format24bppRgb` images with alpha 255 at the corners. `hurdle-painted-parts-v1.png` is the clean runtime RGBA extraction. The selected generated source, discarded built-in alpha retries, and deterministic neutral-checker extraction script are retained with the task evidence under `.omo/evidence/neutral-pilot/hurdle-assets/` rather than shipped as runtime assets.

## Atlas prompt

Create one coherent painted parts sheet for an original tiny fantasy “Hurdle Goblin” campus guardian, intended to be assembled and animated in Canvas 2D. Fairy-tale Korean fantasy mood with soft hand-painted gouache texture and warm natural materials, compact readable game-sprite shapes, original design.

The squat guardian has a low center of gravity, broad aged-ivory shoulder/back rails with muted burnt-orange stripe inlays, a walnut wooden mask, amber eye apertures only on the front, weathered iron joints, leather wraps, spring-like bent legs with visible knees and broad stable feet. Arrange separated front, back and right-profile parts with generous transparent gutters; left is mirrored in code. The back head has no eyes. Use warm upper-left light, crisp silhouettes, subtle chipped paint, wood grain, stitching and tarnished metal. Avoid a literal rectangular sports hurdle, eyes pasted on sports equipment, a generic green goblin, an assembled whole-character sprite, scenery, labels, watermarks and overlapping pieces.

## Alpha edit prompt

Convert only the visible checkerboard backdrop and gutters to true PNG alpha transparency. Preserve every painted part in its position and scale. Output RGBA with alpha 0 at every corner and in all gutters; no checker pattern, white/gray field, floor, shadow, halo, text, labels, grid, frame or watermark. Preserve clean antialiased edges with no gray fringe at small sprite scale.
