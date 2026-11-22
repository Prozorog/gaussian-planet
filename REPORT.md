# Gaussian Planet · Phase 1

A procedural liquid orrery, served by Vite. Open **http://localhost:4103**. `npm run build` produces a static site in `dist/`.

## How the print is made

1. **Paper and space.** A deterministic PRNG builds a small four-channel lattice in memory. The shaders reuse it for periodic cubic value noise, cell offsets, twinkling pinpricks and a sparse Gaussian star layer. There are no raster art assets, environment maps or sampled sounds in the application.
2. **Moving pigment.** WebGL2 half-float framebuffers hold velocity, dye mass, a categorical ink-row ID and a two-component advected displacement. Each step backtraces the flow, injects sources, computes divergence and curl, iterates Jacobi pressure, subtracts its gradient and adds vorticity confinement. Camera changes reproject the previous fields. Only pigment mass and displacement interpolate; the palette ID is sampled from one texel.
3. **Engraving.** The field chooses one of nine discrete inks. Screen derivatives set the widths of band outlines, intermediate isobars and comb filaments. A second coordinate, displaced by accumulated flow and local velocity, bends the comb through each band. Boundaries between different palettes are outlined rather than colour-mixed. The ink pass runs at display resolution, independently of the fluid grid.
4. **The star.** A spinning sphere-mapped field and warped cellular boundaries form the photosphere. The cream limb has a narrow halo, not a scene-wide bloom. Continuous velocity/dye injection at the limb rides on a periodic polar field folded around staggered vortices. One long plume breaks the radial symmetry.
5. **River and wakes.** A broad ochre stream snakes behind the orbits. Procedural folds provide a developed river, crown and trailing filaments from the first frame; these are not thousands of simulation warm-up steps. Moving planetary sources drive velocity and dye into the same solver. The trailing orbital field tapers over 5.4 orbital seconds; deposited dye decays separately. An ochre comet crosses on a 49-second cycle.
6. **Bodies.** Each disc reconstructs a sphere and rotates its noise coordinates in 3D. Ember has narrow fissures; Verdance has gold seams and a moon; Tide has ice bands and a fine ring; Aurelia folds its latitudes into a storm and has two moons; Vesper has violet strata. Directional illumination shifts the printed value by whole steps. Ring strands cross in front of the near hemisphere and disappear behind the far hemisphere.
7. **Impacts and audio.** A charged jet has a warped bright core, deposits pigment as it travels and uses swept collision detection. On contact its head curls along the struck limb; an aurora, wobble, dye burst and pitched chime follow. The drone, filtered-noise whoosh and chimes use WebAudio. Sound starts on the first user gesture, subject to Chrome autoplay policy.

## Controls

| Input | Effect |
|---|---|
| Drag empty space | Stir the local ink. Faster movement widens the push and increases curl. |
| Hold the sun, aim and release | Charge for 0.2–1.5 s and launch a jet. Up to three coexist. |
| Click a planet | 1.2 s eased flight to its portrait; the planet spans approximately 64% of frame height. |
| `S` or double-click the sun | Solar poster composition. |
| `Esc` or click empty space in a portrait | Return to the overview. Dragging does not exit. |
| `Space` | Pause/resume orbital motion, not the fluid. |
| `[` / `]` | Slow down / speed up the orbital clock. |
| Scroll | Zoom the overview gently. |
| `O` / `M` | Toggle orbit guides / mute. |
| `H` | Restore the hint after stirring, firing and visiting a planet. |
| Slider icon, upper right | Set quality, line density and fluid-grid height independently. |

## Autonomous decisions

- The brief names four planets but requests five. **Vesper** is the fifth, an amethyst outer world; the ochre river remains a background stream, not a body.
- Raw WebGL2 avoids a scene-graph dependency. The fluid passes were written for this project; no code was ported from PavelDoGreat's repository. The renderer uses [Vite raw shader imports](https://vite.dev/guide/assets.html#importing-asset-as-string).
- The orbital plane is seen at roughly 29° elevation, with a slight roll. The 16:9 composition letterboxes instead of distorting or cropping the outer orbit.
- Planet portraits treat the star as a distant depth layer. A sliver of its limb remains reachable even when the physical world-space sun would project far offscreen. Flares launch from that visible limb.
- High: 256-cell-high grid, 10 Jacobi steps. Low: 128-cell-high grid, 6 steps. Both retain the same display-resolution bands and pen widths. Grid width follows the viewport aspect ratio.

## Chrome evidence

All ten scene captures are **1920 × 1080** browser screenshots, not offline renders.

| Scene | Files |
|---|---|
| System and solar portrait | [Overview, with wakes](output/playwright/overview.png) · [Poster](output/playwright/poster.png) |
| Planet portraits | [Ember](output/playwright/ember.png) · [Verdance](output/playwright/verdance.png) · [Tide](output/playwright/tide.png) · [Aurelia](output/playwright/aurelia.png) · [Vesper](output/playwright/vesper.png) |
| Interaction | [Flare in flight](output/playwright/flare-flight.png) · [Flare impact](output/playwright/flare-impact.png) · [Drag swirl](output/playwright/stir.png) |
| Reference studies | [Poster / ref 1](output/playwright/poster-comparison.png) · [Overview sun / ref 2](output/playwright/overview-comparison.png) |

Each comparison puts the reference on the **left** and a native-pixel screenshot crop on the **right**. The poster crop is 608 × 1080; the overview crop is 368 × 656. Only the references were resized to match.

### Image metrics

Full frames, including the visible controls. Rec.709 luma on 0–255 sRGB. Edge share uses `hypot(Y[x+1] − Y[x−1], Y[y+1] − Y[y−1]) > 24`, excluding the one-pixel border. Using unhalved differences reproduced the supplied reference figures much more closely than dividing by two.

| Frame | Mean luma | Luma < 25 | Luma > 200 | Edge share |
|---|---:|---:|---:|---:|
| Poster | 86.88 | 37.63% | 14.60% | 36.77% |
| Overview | 38.87 | 63.51% | 2.01% | 25.31% |

All four poster thresholds and the overview black-share threshold passed in the final captures. The first poster had 42.34% bright pixels: the white corona drowned out the red filaments. The calibration pass pulled the camera back, deepened the outer ink, tightened the limb region, added smaller vortex folds and increased contrast in the solar cells. [Machine-readable measurements](output/playwright/metrics.json).

### Frame pacing and interaction

Chrome 157.0.8103.79, headless, `--force_high_performance_gpu --use-angle=d3d11`, device scale factor 1, High preset. Unmasked WebGL renderer: **`ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Laptop GPU (0x00002860) Direct3D11 vs_5_0 ps_5_0, D3D11)`**.

| High preset, 1080p | App frames | Interval | FPS |
|---|---:|---:|---:|
| Overview, moving orbits | 252 | 1.754 s | 143.70 |
| Aurelia close-up, rotating surface and flowing fluid | 245 | 1.752 s | 139.83 |
| Overview, three simultaneous jets | 162 | 1.122 s | 144.44 |

Measurements count app-rendered animation frames over elapsed browser time. These short readings are not frame-time percentiles or guarantees for other machines. In the three-jet sample the observed active count stayed at three on every sampled frame. The input run also recorded a drag stir, a real planet impact, and each planet's click-to-fly and Esc return. No page exceptions were recorded. [Session data and GPU string](output/playwright/session.json).

The **Low** preset was also selected through the settings panel in a separate 1080p Chrome session with `--force_low_power_gpu`. It switched the grid to 128 and measured **67.99 FPS** in the overview. Renderer: `ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A6) Direct3D11 vs_5_0 ps_5_0, D3D11)`. [Low-preset reading](output/playwright/low.json).

`heavy npm run build` passed after calibration. The kept Vite server was started with `own-start --keep npm run dev -- --port {port}`.

## NOT done / still weak

- The tonal measurements match the requested ranges, not the illustrations pixel for pixel. At native scale the reference crown has more small, independently curling tips. This crown has broader tongues of cream and thicker connected ribbons. The dark-space filaments are mainly remnants at the ink edges rather than isolated long white swirls.
- At overview scale the ochre river reads more strongly than the short wakes, especially when both overlap. Verdance and Ember can project close to the solar crown as they orbit.
- Close-ups resolve procedural detail rather than magnifying the fluid grid, but the cellular solar surface is more regular than the reference's broken, turbulent granules.
- Space pauses the five primary orbits; decorative moon motion and surface spin continue. Audio nodes were exercised by real gestures, but the capture did not include a listening test.
- The Iris Xe measurement covers the Low-preset overview, not a full integrated-GPU run through every portrait and flare configuration. No sustained thermal or long-session timing test was run.

## Phase 2 — The marbler’s orrery

**Play:** [localhost:4103](http://localhost:4103/). The Phase 1 measurements and captures above are historical. Phase 2 makes the orbital plane, not the display, the coordinate system for paint, gravity and picking.

### Where the depth comes from

- `src/camera.js` supplies the same 36° perspective projection to the renderer, cursor rays and trajectory preview. The overview breathes through ±10° of yaw in 40 seconds; right-drag changes yaw without a stop and damps elevation between 10° and 75°. A portrait moves the eye and its target to the actual planet over 1.2 seconds. The solar print uses an off-axis lens; it does not stretch a screenshot.
- Latitude–longitude meshes carry rotating, volume-sampled engraving. Lighting chooses whole palette steps: up to two brighter facing the star, three darker on the night side, a drawn terminator and a light-facing limb. A second, slightly larger sphere carries moving atmosphere contours. Rim visibility depends on both the light direction and the eye direction, so the rim closes around an eclipse.
- Tide and Aurelia carry inclined annuli. The fragment's physical position determines the strands and whether the sphere blocks the ray to the sun. The reciprocal ray from a surface point to the ring plane prints the ring's shadow on the body. A shattered moon-sized body can add a debris ring to a previously unringed world.
- The solar body is a mesh; the corona is a cut-out billboard at the star’s depth with its own velocity/dye solver. Seven two-sided ribbon meshes leave and re-enter the sphere. Their arches, and the bodies that cover them, change continuously with the viewing angle. Only the limb and flare cores use cream in the corona.
- Three masked nebula sheets lie at Y = −0.81, −0.49 and −0.17. Each samples the world-registered fluid with different flow and colour offsets. Unprinted areas are discarded, not painted black. Shadows extend away from each planet’s solar direction. A dark, ray-mapped marbled dome, stars on radii 22/41/60, and 30,720 depth-tested droplets (20,000 on Low) occupy separate depths. Droplet positions are integrated in a floating-point texture using the fluid velocity.
- Palette IDs are categorical. The four outer arm colours meet at engraved seams; gold occupies a narrow slice rather than a river. The granular surface and polar corona combine broad folds, staggered vortices and a smaller curl field. All art and sound are procedural; no textures, photographs, AI images or audio samples were imported.

### At the bench

| Input | Result |
|---|---|
| Click a well or `1`–`6` | Select Fire, Rose, Violet, Teal, Emerald or Gold. |
| Click the disc | A plink and expanding ink drop. The inverse radial displacement pushes older ink outward, so repeated drops leave nested rings. |
| Left-drag / `Shift` + drag | Stir the solver, or pull seven parallel tines through the print. Reverse the stroke to feather it. |
| Hold still on the disc, then release | After 0.6 s a vortex draws in local inks. Charge up to 3 s for a larger named world. A fifth extra dissolves the oldest extra. |
| Pull a planet and release | A stretch line and gravity-sampled dots preview the launch opposite the pull. |
| Strike a planet / strike the sun | Two-palette splash; shatter into debris or merge. A solar impact launches a coloured jet and tints the crown for 10 s. |
| Launch beyond the system | The planet grows a coloured tail, rounds a distant apocentre and returns. |
| Hold the sun, aim, release | A directed flare. Four seconds arms the supernova instead: collapse, expanding marbled shock, fresh disc, orbital impulse, then a new stellar hue. |
| Click a planet; click or drag on its surface | Fly to the world. Ink spots and storm distortions are stored in rotating surface coordinates. `Esc` returns. |
| Right-drag / wheel | Orbit / zoom. |
| `Space`, `[` / `]`, `O`, `M`, `H`, `S`, `Esc`, `R` | Pause orbits, change orbit speed, toggle guides, mute, controls, solar print, return, reset. |

The six gesture chips dim independently after use. The ink dot, rake, grab hand and solar charge ring distinguish targets before release. The synthesizer separates the drop plink, rake noise, rising charge, sling, flare, collision bass/chimes, solar gulp and supernova roar. Collision and nova shake the projection by at most three pixels; spray travels in world space.

### Physics and deliberate limits

The fixed 1/120 s velocity-Verlet step evaluates acceleration on both sides of each position update: central gravity, weak softened planet-to-planet attraction and a 9-unit/s speed limit. Collisions use the sum of radii. Below a 0.64 radius ratio the smaller body fragments; otherwise cubic-radius mass sets the merged radius and velocity. The merged surface alternates its parents’ palette IDs.

Free launch, capture and return are intentionally distinct. A launch is ballistic first; after 2.2 seconds velocity gradually approaches the local circular solution. An outbound launch crossing 8.7 units instead joins a bounded Kepler ellipse (eccentricity 0.54); control returns to the gravity integrator on the inbound leg. This is a toy with a reliable return path, not a conserved-energy N-body model. Pause affects orbital physics, not inks, spin or event clocks.

The persistent ebru plate stores displacement, ink ID and tone independently of the fluid solver; a combed pattern does not evaporate when the impulse decays. Surface marks have a twelve-stroke rolling history per planet. The solar poster isolates the star from the orbital disc so comparison with the print is meaningful. The existing project server was reused rather than restarted.

### Browser prints

The evidence is actual Chrome output at 1920 × 1080, device scale factor 1. Playwright used mouse, wheel-capable canvas controls and keyboard input; the observation interface reports positions and counters but cannot move a planet or trigger an event. Capture waits for a completed flight or the physical event, not just for the pointer release.

| Subject | Prints |
|---|---|
| System | [Overview](output/playwright/phase2/overview.png) · [120° yaw](output/playwright/phase2/yaw-120.png) · [15° elevation](output/playwright/phase2/pitch-15.png) · [six-frame parallax strip](output/playwright/phase2/parallax-strip.png) |
| Planet portraits | [Ember](output/playwright/phase2/ember.png) · [Verdance](output/playwright/phase2/verdance.png) · [Tide](output/playwright/phase2/tide.png) · [Aurelia](output/playwright/phase2/aurelia.png) · [Vesper](output/playwright/phase2/vesper.png) · [Tide backlit](output/playwright/phase2/eclipse.png) |
| Paper marbling | [Nested drops](output/playwright/phase2/drop-rings.png) · [Combed feather](output/playwright/phase2/comb-feather.png) · [Birth vortex](output/playwright/phase2/birth-vortex.png) · [New planet](output/playwright/phase2/new-planet.png) |
| Orbital outcomes | [Trajectory preview](output/playwright/phase2/trajectory.png) · [Collision splash](output/playwright/phase2/collision.png) · [Feeding the sun](output/playwright/phase2/feed.png) · [Outbound comet](output/playwright/phase2/escape.png) |
| Solar cycle | [Shockwave](output/playwright/phase2/shockwave.png) · [White-blue reignition](output/playwright/phase2/reignition.png) · [Solar poster](output/playwright/phase2/poster.png) |
| Comparisons, reference on left | [Solar poster / ref 1](output/playwright/phase2/poster-comparison.png) · [Overview sun / ref 2](output/playwright/phase2/overview-comparison.png) · [Poster linework at 1:1](output/playwright/phase2/poster-comparison-native.png) · [Overview linework at 1:1](output/playwright/phase2/overview-comparison-native.png) |

[Contact sheet](output/playwright/phase2/contact.jpg). The poster study is a fixed 608 × 1080 crop starting at X = 288, framing the limb and its outer curls. The overview study is a 368 × 656 crop centred on the sun. The composition comparisons scale only the reference to match the capture; the two native-detail comparisons resample neither side. The drift strip combines six overview frames one second apart, with planet orbits paused to isolate camera and fluid motion.

The first capture exposed two measurement errors: importing an unversioned Vite entry started a second app, and waiting only for a truthy asynchronous predicate captured transitions instead of settled portraits. Those readings were discarded. Final capture imports the exact entry URL already loaded by the page and checks observed state before saving.

The UI run was supplemented by deterministic physics checks: a fifth extra removed the oldest; a small impact added a debris moon; a similar-size impact preserved the incoming pigment and the sum of the two cubic radii. These checks exercise the integrator, not screenshots or a simulated button click.

### Colour: before and after

8-bit sRGB, Rec.709 luma. Vivid is saturation > 0.65 among lit pixels (luma ≥ 25). Cream and crimson are shares of **all** pixels. The first three rows use the fixed portrait crop; the Phase 1 tonal figures refer to its full 16:9 frame, so both Phase 2 formats are reported rather than comparing different framings silently.

| Frame / measure | Phase 1 | Phase 2 | Target |
|---|---:|---:|---:|
| Poster crop · vivid | 65% | 77.81% | 60–80% |
| Poster crop · cream | 22.7% | 3.00% | 2–8% |
| Poster crop · crimson | 14% | **24.21%** | 10–22% |
| Overview · vivid | 31% | 81.18% | ≥55% |
| Overview · mean lit saturation | 0.56 | 0.795 | ≥0.65 |
| Overview · luma <25 | 63.51% | 44.41% | 40–60% |
| Ember portrait · vivid | 81.37% | 77.05% | ≥55% |
| Verdance portrait · vivid | 45.65% | 76.46% | ≥55% |
| Tide portrait · vivid | 48.21% | 76.45% | ≥55% |
| Aurelia portrait · vivid | 40.50% | 82.76% | ≥55% |
| Vesper portrait · vivid | 48.71% | 79.95% | ≥55% |

| Solar print tone | Phase 1 full | Phase 2 full | Phase 2 crop | Target |
|---|---:|---:|---:|---:|
| Luma <25 | 37.63% | 48.26% | 16.09% | 25–40% |
| Mean luma | 86.88 | 67.42 | 106.90 | 75–110 |
| Luma >200 | 14.60% | 7.23% | 14.50% | 8–18% |
| Edge share | 36.77% | 31.79% | 49.44% | 22–42% |

The calibration moved the poster camera closer, narrowed the crown away from its principal plume, darkened the maroon fringe, and confined the brightest cream to the limb. Removing coverage in the outer disc opened the overview’s dark gaps. The overview contains **1.77% ochre-like pixels** using the reported RGB proxy (74 < R < 239, 0.57R < G < 0.86R, B < 0.59G). This is an image estimate, not a count of a shader palette ID. [Complete colour readings](output/playwright/phase2/metrics.json).

### Frame pacing and verification

| 1920 × 1080 case | Preset / GPU | App frames | Seconds | FPS |
|---|---|---:|---:|---:|
| Overview, orbits moving | High / RTX 4070 Laptop | 210 | 1.4532 | 144.51 |
| Aurelia, settled portrait | High / RTX 4070 Laptop | 210 | 1.4535 | 144.48 |
| Three flares plus comb strokes | High / RTX 4070 Laptop | 122 | 0.8468 | 144.07 |
| Two-body collision splash | High / RTX 4070 Laptop | 116 | 0.8003 | 144.95 |
| Expanding supernova shockwave | High / RTX 4070 Laptop | 131 | 0.9059 | 144.61 |
| Overview, orbits moving | Low / Iris Xe | 174 | 1.4574 | 119.39 |

Unmasked renderer strings in Chrome with ANGLE D3D11:

- `ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Laptop GPU (0x00002860) Direct3D11 vs_5_0 ps_5_0, D3D11)`
- `ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A6) Direct3D11 vs_5_0 ps_5_0, D3D11)`

All three jets stayed active throughout the comb sample. The interaction run observed a settled fling, collision, solar ingestion, comet return, flare impact, a birth, collapse, shock and reignition. Aurelia retained nine surface marks after a click and drag. The Low run also checked ink selection from the dock, help, guides, mute, orbit speed and wheel zoom. No page exceptions were recorded. `heavy npm run build` passed. [System and portraits](output/playwright/phase2/art.json) · [Interaction counters and timings](output/playwright/phase2/verbs.json) · [Integrated GPU and controls](output/playwright/phase2/low.json).

### NOT done / still weak

- The solar poster is **not a full tonal match**. The portrait has too little deep darkness, 2.21 percentage points too much crimson and too many high-contrast edges. The uncropped frame has too much dark sky on the right. Its full-frame mean luma and bright share miss the lower bounds.
- At native scale the reference has more independently hooked tendril tips. Some of this crown's high-value bands still join into broad gold shapes, and some of its finest lines look grainier. The 6–15 px curl size is a design scale, not a verified bound on every island.
- From low elevations the three sheets separate visibly, but paint on a sheet can intersect the silhouettes of low-lying bodies. This is a stack of masked planes and volumetric particles, not a participating-media renderer. Disc shadow wedges are stylized rather than ray-traced.
- Performance figures measure short app-frame intervals, not long-session thermals or GPU frame-time percentiles. Only the Low overview was timed on the Iris Xe. Audio gestures were exercised, but no listening test was recorded.

## Phase 3 · Drift and Sky Atlas

[Open the running orrery](http://localhost:4103/). **Шаг внутрь** takes the observer into the ink. The original overview, planetary portraits, solar print and marbling tools remain available from the same canvas. The Atlas starts in Russian. **L** switches to English.

### Floating inside the disc

The two-second dive interpolates the eye, aim, lens offset and sheet spacing. The default arrival sits between the orbits of Tide and Aurelia. It checks the sightline to the sun against the cloud islands and the planets’ motion during the dive. Double-clicking the disc places the eye at the chosen horizontal coordinates. A small exclusion zone keeps arrivals outside the photosphere.

At full depth the five sheets lie at heights −2.15, −0.83, −0.32, +0.68 and +2.05 in solar-radius scene units. An arrival at +0.16 puts three seas below and two skies above. The sheets share the existing velocity, displacement and dye textures. Different flow offsets, open patches and palette families let the farther sheets show through. Distance removes up to three whole ink steps. The star retains its solar inks, engraved crown and seven three-dimensional prominence arches.

There are 44 cloud islands on High and 30 on Low. Each has an irregular, flattened surface and perforated inner folds. The camera can pass through all of them. The dust solver carries 30,720 droplets on High and 20,000 on Low. At arm’s length the same points resolve into outlined, banded discs up to 24 pixels across at 1080p.

An asynchronous one-pixel GPU read samples the fluid velocity at the eye. That velocity, a weak background current and the nearest planet’s wake feed the camera’s damped motion. A nearby planet raises a filtered rush whose pitch follows the closing speed. The solar roar follows distance. Crossing a sheet starts a world-space ripple, a brief wash of its ink and a synthesized splash. Near the solar surface, repulsion removes inward velocity and steers the observer away.

For a drop, a one-pixel depth pass selects the nearest printed sheet or cloud wall under the cursor. It returns the surface ID and distance so the bloom expands on that surface in world space. Drops on the middle sheet also enter the persistent ebru print. Riding follows a short inclined orbit around the moving planet. Its limb periodically covers the sun. Autodrift joins the current eye position, a moving planetary waypoint, a cloud interior and a sunward passage with a continuous spline.

### Controls

| Input | In the orrery |
|---|---|
| **Step inside** / **Шаг внутрь**, D, double-click the disc | Dive between orbits or descend to the selected point. Double-clicking the sun still opens the solar print. |
| Left-drag in Drift | Look through 360° of yaw and up to 80° above or below the horizon. The pointer stays visible. |
| W A S D / arrow keys | Float relative to the view, with inertia. D strafes right while inside. |
| Space / C, Shift | Rise / sink, or hold Shift to glide faster. In the overview Space still pauses the orbits. |
| Click, 1–6, ink wells | Drop pigment on a visible cloud or sheet and choose its colour. |
| Hold F, release F | Join a nearby planet’s orbit, then let go. |
| Eight seconds idle | Follow the scenic loop. Input gives the observer control again. |
| Esc / **Rise out** | Rise to the overview. Esc also closes the open Atlas. |
| M / H | Mute or open the controls for the current view. |
| B / book icon | Open the 14-slot Atlas. Select a discovered entry to read it in full. Locked entries display their discovery hint. |
| L / language selector | Change between Russian and English. |
| N / K / Z | Toggle planet labels, equal-time orbital sectors or the habitable zone. |
| Discovery notes in Settings | Toggle automatic cards. Discoveries, language and the notes setting are saved in this browser. |

### Field notes

Only one automatic note occupies the side of the screen. Later discoveries queue. The compact card lasts about ten seconds and yields to a later action. **More** opens the longer reading. Every entry distinguishes the relevant toy convention from the real phenomenon. The diagrams use the current scene, the last measured encounter, or the explicitly identified teaching ellipse.

| Slot | Discovery in play | Diagram or scene marking |
|---|---|---|
| 01 · Equal areas | K, a sustained bound elliptical fling, or capture onto the eccentric comet orbit | Ellipse with a focus at the star, equal-time sectors and changing speed. K also paints the sectors on the disc. |
| 02 · Farther means slower | Increase orbital time with ] | Bound planets on a period² versus semimajor-axis³ plot. |
| 03 · Escape speed | First fling preview or an outbound escape | Launch speed against local circular and escape speeds. The gauge also follows the drag in the scene. |
| 04 · Gravity assist | A flung body leaves a close moving neighbour faster and with increased star-relative orbital energy | Measured speeds before and after the encounter. |
| 05 · Giant impacts | Two similar planets merge | The collision and its two-colour splash accompany the text. |
| 06 · Roche limit | A smaller body shatters against a larger one | Dashed illustrative Roche circle around the survivor. The note explains the game’s contact rule. |
| 07 · Planet formation | The player sustains a birth vortex | The live vortex accompanies the text. |
| 08 · Stellar temperature | The star reignites | A red-to-blue-white scale follows the current stellar hue. |
| 09 · Supernova | The expanding shock begins | The visible shock accompanies the note about massive stars and the Sun’s future. |
| 10 · Flares and auroras | Solar ejecta reach a planet | The struck limb glows. The note distinguishes a flare from a coronal mass ejection. |
| 11 · Transits | A foreground planet covers part of the star in the observer’s direction | The live light curve records the fractional area covered on the stellar disc. |
| 12 · Habitable zone | Z, or a world forms or settles within the band | A band on the orbital plane and a miniature chart of the current worlds. The band follows stellar hue. |
| 13 · Solar surface | Approach the photosphere in Drift or open the solar print with S | The granulation and prominence loops accompany the note. |
| 14 · Day and night | Hold F and acquire a planet | A marked terminator follows the lighting angle as seen from the moving eye. |

### Scale and rendering decisions

- I kept the 36° vertical field of view and the planets’ physical radii. Apparent size changes with camera distance. One toy AU is Verdance’s original orbital radius. Its Keplerian period defines 365 toy days. Labels use instantaneous distance and, for a bound orbit, the period from its semimajor axis.
- The teaching ellipse solves Kepler’s equation at equal intervals in mean anomaly. A nearly circular starting system gets a labelled model ellipse so the effect is visible. A discovered eccentric orbit supplies its own elements. The compressed stellar colours move the toy habitable band by preset factors. The note identifies luminosity as the physical quantity of interest.
- The engraving measures phase change in screen pixels. At resolved scales the contour and interior strokes are about 1–1.5 pixels wide. Narrow line families fade before successive lines share a pixel. Grazing footprints also suppress the finest turbulence before quantisation. Close surfaces retain broad folds, intermediate vortices and small islands.
- Depth-tested geometry orders islands, nested walls, sheets and bodies. The colour and heat washes apply after the depth pass. Cloud walls and near-eye dust dissolve in eight ordered Bayer steps over a short approach to the near plane. This keeps the lines on surviving fragments sharp.

### Browser captures

The scene prints are Chrome screenshots at 1920 × 1080, device scale factor 1. The browser drove the public controls. A read-only scene observer supplied the orbital positions for aiming, camera state and frame counters. Automatic notes were switched off for the interior prints and switched on for the discovery session.

| Subject | Captures |
|---|---|
| Entering the disc | [Mid-dive](output/playwright/phase3/dive.png) · [Sun on the horizon](output/playwright/phase3/horizon.png) |
| Above and below | [Sky sheet](output/playwright/phase3/sky.png) · [Lower layers](output/playwright/phase3/sea.png) |
| Passing and riding worlds | [Aurelia passing close](output/playwright/phase3/planet-pass.png) · [Sunrise over Ember’s limb while holding F](output/playwright/phase3/sunrise.png) · [Attached to Aurelia](output/playwright/phase3/ride.png) |
| Through the ink | [Sheet crossing](output/playwright/phase3/sheet-crossing.png) · [Inside a marble island](output/playwright/phase3/cloud.png) · [Ink dropped from inside](output/playwright/phase3/ink-drop.png) |
| Solar approach | [Coronal arches at close range](output/playwright/phase3/sun.png) |
| Autodrift | [Six views at two-second intervals](output/playwright/phase3/autodrift-strip.png) |
| Atlas | [Kepler sectors in Russian](output/playwright/phase3/kepler-ru.png) · [Expanded English entry](output/playwright/phase3/kepler-en.png) · [Escape gauge during a live drag](output/playwright/phase3/escape-gauge.png) |
| Atlas observations | [Transit light curve](output/playwright/phase3/transit.png) · [Habitable zone after blue reignition](output/playwright/phase3/blue-zone.png) · [Open collection with discovery count](output/playwright/phase3/atlas-open.png) |

[Ten Drift prints together](output/playwright/phase3/drift-prints.jpg). The projected diameter of Aurelia in the close-pass observation was **84.9% of the frame height**. Its moving limb extends across the left side of the print. The sunrise capture was taken while attached to Ember, with the camera 0.15 scene units above the surface and the planet covering part of the photosphere.

### Colour and linework

Rec.709 luma was measured on the full 8-bit sRGB screenshots, including visible interface elements. Vivid share is the percentage of lit pixels with saturation over 0.65. Dark share counts all pixels below luma 25. Cream counts all pixels above luma 200 with saturation below 0.35.

| 1080p print | Vivid among lit | Dark | Cream |
|---|---:|---:|---:|
| Mid-dive | 86.55% | 38.20% | 0.65% |
| Sun on the horizon | 79.35% | 21.53% | 2.41% |
| Sky sheet | 84.83% | 28.76% | 1.05% |
| Lower sheets | 83.68% | 17.08% | 1.61% |
| Close planet pass | 85.98% | 22.87% | 1.19% |
| Sheet crossing | 76.42% | **13.10%** | 5.08% |
| Cloud interior | 62.76% | 25.07% | 6.58% |
| Near the sun | 77.77% | 21.66% | 2.32% |
| Sunrise from Ember | 84.24% | 30.43% | 1.62% |
| Ink drop | 96.78% | 23.06% | 0.02% |
| Additional ride on Aurelia | 91.92% | 23.00% | 0.30% |

The first cloud print had effectively 0% dark pixels. The initial crossing measured 40.09% vivid among lit pixels. I deepened the ink collected in folded contours, changed the crossing wash to print one palette at a time and stored noise interpolation coefficients at higher precision for close views. After that calibration all ten requested prints exceeded the 55% vivid target. Nine reached the 15–45% dark range. All six autodrift views met both ranges, with 70.79–91.44% vivid and 20.55–28.18% dark. The horizon, solar approach and limb sunrise stayed below the 8% cream ceiling. [Per-frame colour measurements](output/playwright/phase3/colour.json).

**Grazing inspection at 100%.** The upper violet and lower teal bands taper into separate short horizontal marks. Across three successive native crops, the floating specks move against these bands. I saw no repeating interference grid. A few of the most distant silhouette tips change by a pixel as the pattern moves. [Native crop from the horizon print](output/playwright/phase3/horizon-native.png) · [First moving crop](output/playwright/phase3/grazing-0.png) · [Second](output/playwright/phase3/grazing-1.png) · [Third](output/playwright/phase3/grazing-2.png).

### Frame pacing and interactions

| 1920 × 1080 case | RTX 4070 Laptop, High | Iris Xe, Low |
|---|---:|---:|
| Plain Drift | 144.35 FPS | 54.27 FPS |
| Close planet pass | 144.43 FPS | 71.07 FPS |
| Inside a cloud | 144.64 FPS | 118.98 FPS |
| Solar approach | 144.12 FPS | 93.62 FPS |

Unmasked WebGL renderer strings from the two Chrome sessions follow.

- `ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Laptop GPU (0x00002860) Direct3D11 vs_5_0 ps_5_0, D3D11)`
- `ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A6) Direct3D11 vs_5_0 ps_5_0, D3D11)`

The timings count application frames over 1.25–1.81 seconds. Cloud membership stayed true for all 210 sampled RTX frames and all 173 sampled Iris frames in that case. Both sessions used the same display resolution and engraving widths. Low reduced the fluid resolution, particle count and cloud count. [RTX observations and controls](output/playwright/phase3/flight.json) · [Iris observations](output/playwright/phase3/iris.json).

The input session exercised the button, D and a coordinate-specific double-click, drag look, all eight horizontal movement keys, rise, sink, fast glide, all six inks, a depth-picked drop, a sheet crossing, F acquisition and release, mute, help, idle takeover, interruption and Esc. The Atlas session exercised both languages, More, labels, K, Z, book reopening and progress after a reload. The golden star’s zone measured 3.47–6.21 scene units. Reigniting it blue moved the band to 4.92–8.81. [Atlas observations](output/playwright/phase3/atlas.json).

A separate deterministic check integrated actual flybys as well as a merger and a shattering collision. A close pass of Aurelia increased speed from 2.263 to 2.299 scene units per orbital second and triggered the gravity-assist entry. The two sampled equal-time wedges measured 5.78435 and 5.78438 square scene units. This check supplies evidence for the uncommon encounter independently of what appeared during ordinary play. [Physics measurements](output/playwright/phase3/physics.json).

### Three minutes of play

A fresh browser session showed **11 distinct automatic notes in 180.25 seconds**. The sequence used the ink wells, a comb stroke, a birth, faster orbits, a fling, a charged star, the solar print and a Drift visit. The camera and gravitational simulation produced the encounters. K, Z, Atlas slot selection and direct event injection played no part in this count. The final session recorded zero page exceptions. [Timestamped gestures and notes shown](output/playwright/phase3/natural-play.json).

The production build passed with `heavy npm run build`. The project’s existing kept Vite server is serving the result at the link at the top of this section.

### NOT done / still weak

- The crossing print contains 13.10% dark pixels, 1.90 percentage points below the target. The crossing wash and fresh ripple occupy most of that frame.
- A cloud is a set of open, nested surfaces. Passing very close to an inner fold can expose the ordered screen-door pattern. The stellar corona still uses a camera-facing engraving around its three-dimensional core and prominence loops.
- The light curve models a uniformly bright stellar disc. Stellar limb darkening, the density dependence of the Roche limit and climate-dependent habitable-zone boundaries are outside the simulation. The Atlas identifies the illustrative scale of the ring and the toy zone.
- The GPU readings are short, shared-machine samples. Audio controls and the procedural sound paths were exercised in Chrome. Listening comfort and long-session thermal performance were not measured.

## Phase 4 · The Whole Sky

[Play First Light](http://localhost:4104/). This section records the seven stages in commit order. The Phase 1–3 notes above are historical.

### Stage 0 · English and close-range engraving

- The page and Atlas use English throughout, including the diagrams, tooltips, ink wells and grouped controls under **H**. The Atlas retains the existing discovery storage key and ignores the old language value. I checked a saved discovery from a Russian-language session, **L** having no effect, an opened note, the Atlas tabs, **Step inside**, **Esc**, an ink drop in Drift and the overview drop and stir.
- Close sheets reconstruct the fluid and persistent paint displacement with cubic filtering. The close view damps the grid displacement and adds folded world-space turbulence, a separate streamline family and curved palette boundaries. Clouds and near dust shed whole tonal bands. The overview-to-Drift transition uses tonal bands as well.
- The gold shape was cloud 47. Its old centre lay at the height of a sheet, which sliced through the flattened cloud. I rounded the gold islands, then made that particular island more compact and moved it clear of the two adjacent sheets.
- At 1920 × 1080 the sheet measured 81.58% vivid among lit pixels, 25.78% dark and 2.83% cream. The cloud measured 59.23%, 21.48% and 9.29%. The flyby measured 85.61%, 22.16% and 1.74%. The English Atlas frame measured 78.82%, 44.76% and 1.03%. Definitions match Phase 2. The production build passed and the browser control run recorded no page errors.
- [Sky sheet](output/playwright/phase4/s0-sky.png) · [Cloud interior](output/playwright/phase4/s0-cloud.png) · [Planet flyby](output/playwright/phase4/s0-planet-pass.png) · [English Atlas](output/playwright/phase4/s0-atlas.png) · [Colour readings](output/playwright/phase4/s0-colour.json).

### Stage 1 · Soundtrack and orbital chimes

- Two media elements stream into a WebAudio mix. Scene changes use a four-second equal-power crossfade. The spare element preloads the current track near its loop point, guided by the measured quiet tails. Music initialization waits for the first gesture and the soundtrack dips during the nova shock. I used the supplied gains and pitch classes. Effects have their own level and there is no continuous oscillator drone.
- **G** and **Chime line** enable the rotating line, one-step planet flashes and thin disc ripples. The chimes take their pitch from Keplerian periods over three octaves. The lock uses each settled orbit’s mean period and waits for two cycles of the outer planet. I kept the existing gravitational encounters and drew the rosette from the actual positions. Releasing a fling at a marked radius guides the body into that orbit.
- Chrome verified both level sliders, the five credits, **M**, the chip and **G**, a tuned fling, and both directions of the overview/Drift crossfade. There were two active media elements during the fade and one afterward. Ember and Verdance locked at **1:2** with periods of 17.06 and 34.11 toy orbital seconds. The captured track had 52 chords and ten crossings had rung. The production build passed with zero page errors in the control run.
- [Chime line and ripple](output/playwright/phase4/s1-chime.png) · [1:2 rosette](output/playwright/phase4/s1-rosette.png) · [Credits](output/playwright/phase4/s1-credits.png) · [Audio and orbit observations](output/playwright/phase4/stage1.json).

#### Music credits

- "Frozen Star" Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0. https://creativecommons.org/licenses/by/4.0/
- "Dreams Become Real" Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0. https://creativecommons.org/licenses/by/4.0/
- "Lightless Dawn" Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0. https://creativecommons.org/licenses/by/4.0/
- "Echoes of Time v2" Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0. https://creativecommons.org/licenses/by/4.0/
- "Ossuary 6 - Air" Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0. https://creativecommons.org/licenses/by/4.0/

### Stage 2 · The life of the star

- **Timeline** or **T** reveals five chapters and a continuous scrubber. **Play life** traversed the full range in 90.02 seconds in Chrome. The chapter buttons jump to each representative age. **Nebula print** shares the solar print shortcut. Chapter changes route the soundtrack and gate the three Today-only verbs, with a reason on each unavailable chip.
- The young disc prints broken rings and gaps. Clumps condense while scrubbing toward Today. The red giant swells, moves whole bands of colour and injects outward velocity into the existing fluid. Ember and Verdance get separate swallowing events. I projected the other chapters from the live main-sequence bodies so scrubbing back restores their Today orbits. The nebula ray pass intersects four engraved shells at their own depths, with a different ink for each shell. The white dwarf leaves a small blue-white core and thin shell fragments.
- Chrome exercised the button, **T**, the chapter buttons, a pointer scrub, a drop outside Today, the poster control, Drift, return and the full autoplay. Notes 17–19 were discovered and both swallowing events fired. The production build passed with zero page errors.

| 1080p frame | Vivid among lit | Dark | Cream |
|---|---:|---:|---:|
| Young disc | 78.98% | 35.61% | 2.92% |
| Today | 79.77% | 43.73% | 1.01% |
| Red giant | 88.29% | 34.40% | 0.22% |
| Planetary nebula, print | 69.44% | 33.49% | 2.02% |
| White dwarf | 92.71% | 69.84% | 0.30% |

- The red giant had 52.08% warm red and orange by the RGB check. The poster had 10.27% teal, 9.39% rose, 10.37% gold and 30.42% violet among lit pixels by the saturated-family checks. The white dwarf film frame had 0.21% cream after the disc had evolved through the other chapters.
- [Young disc](output/playwright/phase4/s2-young.png) · [Today](output/playwright/phase4/s2-today.png) · [Red giant](output/playwright/phase4/s2-red.png) · [Swallowing Ember](output/playwright/phase4/s2-swallow.png) · [Nebula overview](output/playwright/phase4/s2-nebula.png) · [Nebula print](output/playwright/phase4/s2-poster.png) · [Nebula in Drift](output/playwright/phase4/s2-nebula-drift.png) · [White dwarf](output/playwright/phase4/s2-white.png) · [Six-frame film strip](output/playwright/phase4/s2-film-strip.png) · [Colour readings](output/playwright/phase4/s2-colour.json).

### Stage 3 · A black hole

- Select **Void** or **7**, then hold still on empty ink for one second. Drag the hole to change its position. A coloured-ink double-click evaporates it. **Rekindle** appears six seconds after the hole reaches the star. The Drift approach leads into a four-second narrowing ring and an automatic return.
- The hole adds softened gravity to the orbital integrator and a local curl to the fluid. A depth-aware pass deflects background rays and samples the procedural sky before engraving it. The already rendered meshes and fluid sheets use nearest sampling. I used an illustrative annulus with raised and lowered arcs for the disc, and separate engraved ribbons for the planet and stellar streams. The star loses half its displayed radius and the system dims until it is rekindled.
- Chrome formed one hole, stretched Aurelia, swallowed part of the star, launched jets twice, rekindled, fell through from Drift and removed the hole. Notes 20–23 were discovered. An initial feedback-loop error came from an offscreen depth texture binding on the dust sampler unit. The final control run recorded zero page or WebGL errors. The production build passed.
- The lens overview measured 80.69% vivid among lit pixels, 43.01% dark and 1.09% cream. The Drift view measured 83.17%, 27.51% and 1.60%. The native crop shows thin rim and disc lines without a blur filter.
- [Lens](output/playwright/phase4/s3-lens.png) · [Native lens crop](output/playwright/phase4/s3-lens-native.png) · [Low angle](output/playwright/phase4/s3-low-disc.png) · [Planet thread](output/playwright/phase4/s3-thread.png) · [Jets](output/playwright/phase4/s3-jets.png) · [Star stream](output/playwright/phase4/s3-star-stream.png) · [Drift](output/playwright/phase4/s3-drift.png) · [Falling](output/playwright/phase4/s3-fall.png) · [Control run](output/playwright/phase4/stage3.json).
