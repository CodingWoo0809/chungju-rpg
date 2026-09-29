# WHISTLE pilot painted parts atlas

Built-in ImageGen prompt, 2026-09-24. Use case: `stylized-concept`.

```text
Asset type: transparent raster game-art parts atlas for a Canvas 2D RPG creature rig.
Primary request: Create a single 3:2 transparent PNG atlas containing hand-painted detachable body parts for a fairy-tale fantasy resonance wind spirit named WHISTLE. This is a real small RPG creature, charming and alert but not toy-like, and not a literal whistle with eyes.
Subject: A warm silver and aged ivory porcelain/metal wind spirit with a luminous teal resonance core, a sculpted head-shell/mantle whose silhouette subtly recalls a whistle chamber and narrow voice slit, two articulated swept wing-fins/forearms, a small rear resonator loop, and two long cord/ribbon lanyard tails. Meaningful anatomy must read from front, back, and right side.
Atlas layout: three clearly separated horizontal rows on one transparent canvas. Row 1 FRONT parts: one centered front shell/head with face and visible voice aperture, one separate glowing core, separate left and right wing-fins, separate left and right ribbon tails, one rear loop. Row 2 BACK parts: one centered rear shell/head showing resonator seam and loop socket, one separate glowing core halo, separate left and right wing-fins seen from behind, separate left and right ribbon tails. Row 3 RIGHT PROFILE parts: one centered right-facing shell/head with the short tapered voice aperture pointing right, one separate glowing core, near and far wing-fins, two separate trailing ribbon tails, one rear loop. Keep every component isolated with generous transparent gutters and no overlap; no labels, letters, grid, ground, shadow, or background.
Style/medium: polished hand-painted gouache and watercolor game illustration, softly modeled volume, crisp dark cool-gray/umber contour accents, subtle chipped patina, warm upper-left light, readable at small sprite scale.
Color palette: aged ivory, warm silver, restrained pewter shadows, bright but controlled teal/turquoise core glow, muted sea-green cord tips.
Materials/textures: matte porcelain shell, brushed warm metal edge fittings, translucent magical teal crystal/air core, soft woven cord ribbons.
Composition/framing: orthographic sprite-part presentation, consistent scale across all rows, all parts fully inside canvas, empty transparency between every part. The complete assembled creature would be about 1.5 times taller than wide and float upright.
Constraints: genuine alpha transparency; distinct front, back, and right-facing anatomy; left view will be mirrored in code; detachable shell, core, fins, and cords must be individually crop-able and independently articulated. Visual motif flows from resonance core through a small mouth/voice slit to a projected sound ring.
Avoid: literal modern plastic referee whistle, whistle with eyes pasted on, generic sheet ghost, generic blob, cute plush or vinyl toy, chibi mascot proportions, humanoid hands or legs, text, UI, scenery, opaque or checkerboard background, cast shadow, overlapping pieces, preassembled full-body-only sprites.
```

The selected atlas was generated with OpenAI built-in ImageGen as
`exec-604a775f-838d-4034-8794-10e02c36a6cf.png`, then passed once through the
built-in editor as `exec-69e2cdb2-a100-4457-a5eb-9f1b7de12203.png` with this
background-extraction prompt:

```text
Edit target: the immediately preceding WHISTLE painted parts atlas.
Use case: background-extraction.
Primary request: Remove the entire dark gray/green painted background and replace it with genuine fully transparent alpha. Preserve every creature component exactly: same shapes, painting, colors, highlights, glow, scale, position, row layout, and canvas dimensions.
Constraints: The empty space between and around every component must be RGBA alpha 0, including all corners and gutters. Preserve soft antialiased edges and the teal glow with partial alpha. Do not move, redraw, add, remove, crop, resize, relabel, or overlap any part. No checkerboard, no solid color, no vignette, no ground or cast shadows.
```

The edited result is `whistle-painted-parts-v1.png`. Left-facing rendering is
produced by mirroring the right-profile painted parts in Canvas while the
gameplay/world muzzle socket remains unmirrored.
