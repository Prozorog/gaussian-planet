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

[Play First Light](http://localhost:4104/). The kept Vite server uses port 4104 because the old port was taken during this run. This section records the seven stages in commit order. The Phase 1–3 notes above are historical.

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

### Stage 4 · Worlds to dive into

- In Drift, **F** or **Ride** attaches to a nearby world. **Enter** or **Dive** sinks through its cloud deck in roughly two seconds. **Esc** or **Rise to orbit** returns to the ride. Inside, the existing movement keys carry the view on a current, and right-drag looks around.
- Aurelia has opposing cloud currents and rings overhead. Stirring leaves a moving oval storm. Tide’s moon moves by drag or slider, and two swells follow it. Ember’s crust opens into a fountain with new rivers. Changing Verdance’s tilt moves the ice and green bands. Vesper’s jets leave falling ice dust. I stored each toy on the original body, so it survives the trip back out and the timeline’s alternate views.
- The interior views reuse the ink shader and camera controls with their own projected layers. The outer renderer reads the same storm, moon, cracks, cap and plume data. The production build passed. Chrome returned to the correct ride after each world, verified the remembered interaction and discovered notes 24–28 without page errors.

| World | Arrival vivid / dark / cream | Toy vivid / dark / cream | Prints |
|---|---|---|---|
| Aurelia | 88.29% / 27.77% / 0.21% | 87.53% / 27.25% / 0.20% | [Arrival](output/playwright/phase4/s4-aurelia-arrival.png) · [Storm](output/playwright/phase4/s4-aurelia-toy.png) · [Storm from the overview](output/playwright/phase4/s4-aurelia-outside.png) |
| Tide | 81.15% / 41.35% / 2.16% | 80.62% / 41.23% / 2.51% | [Arrival](output/playwright/phase4/s4-tide-arrival.png) · [Moon and tides](output/playwright/phase4/s4-tide-toy.png) |
| Ember | 84.20% / 43.74% / 0.10% | 78.51% / 42.00% / 0.73% | [Arrival](output/playwright/phase4/s4-ember-arrival.png) · [Fountain](output/playwright/phase4/s4-ember-toy.png) |
| Verdance | 81.17% / 29.59% / 0.45% | 46.86% / 24.84% / 1.78% | [Arrival](output/playwright/phase4/s4-verdance-arrival.png) · [Tilted axis](output/playwright/phase4/s4-verdance-toy.png) |
| Vesper | 84.14% / 38.86% / 1.66% | 81.73% / 37.63% / 3.31% | [Arrival](output/playwright/phase4/s4-vesper-arrival.png) · [Geyser](output/playwright/phase4/s4-vesper-toy.png) |

[Colour readings](output/playwright/phase4/s4-colour.json) · [World controls](output/playwright/phase4/stage4.json).

### Stage 5 · Ink creatures

- **Creatures** in Settings is on by default. Four face-free swimmers bend their fins and tails as they move, breach with a ring and sing occasional quiet notes in key. **F** and **Ride** also work near the swimmers. I kept the creature encounters out of the Atlas.
- Fish flock in three instanced schools. They follow new ink, take its palette and leave local bites in the plate. Combing and flinging scatter them. Three distinct inks fed to a swimmer produce a calf that follows it. Swimmers dive during the supernova, circle clear of the black hole, migrate outward in the red giant chapter and leave two etched outlines in the white dwarf chapter. The overview runs 300 fish on High and 150 on Low, with 21 in the white dwarf chapter.
- Chrome exercised the Settings switch, all three feed inks, the calf, fish bites, a comb scatter, **F** and the nova dive and return. It observed the breach and the chapter changes. The production build passed, and the control run recorded zero page errors.
- The breach overview measured 80.59% vivid among lit pixels, 42.91% dark and 1.03% cream. The white dwarf frame measured 74.25% dark. [Breach](output/playwright/phase4/s5-breach.png) · [School feeding](output/playwright/phase4/s5-feeding.png) · [Riding Sable](output/playwright/phase4/s5-ride.png) · [White dwarf creatures](output/playwright/phase4/s5-white.png) · [Control run](output/playwright/phase4/stage5.json).

### Stage 6 · Postcards

- **Postcard** and **P** freeze the scene. Drag the preview to reframe, choose the aspect ratio, and edit the system name. The cream border prints the name in serif italic, followed by the current chapter, the local date and the Gaussian Planet mark. **Plain** removes the paper and lettering.
- I render the frozen scene again at the picture’s pixel dimensions with a reframed projection and resolution-scaled ink lines. The full card measures exactly 3840 × 2160, 2160 × 3840, or 2880 × 2880. The postcard uses the live camera and works inside a world as well as from the overview and nebula print.
- **Record 10 s clip** renders a live 1080 × 1920 view and includes the WebAudio mix. Chrome verified a 10.002-second file with VP8 video and Opus audio. The dialog displays the music credit beside the recording control. Chrome also verified a frozen scene clock, a drag, an edited name, all three PNG downloads, a plain download and return to the same view. The production build passed and the export run recorded zero page errors.
- [Dialog](output/playwright/phase4/s6-dialog.png) · [16:9 First Light](output/playwright/phase4/s6-wide.png) · [9:16 planetary nebula](output/playwright/phase4/s6-nebula-vertical.png) · [1:1 Aurelia](output/playwright/phase4/s6-aurelia-square.png) · [Plain Aurelia](output/playwright/phase4/s6-plain.png) · [Vertical WebM](output/playwright/phase4/s6-clip.webm) · [Export measurements](output/playwright/phase4/stage6.json).

### The 28 Atlas notes

Discoveries persist under the existing save key. The full counter spans **Orbits**, **The star**, **Life of the star**, **Black hole**, **Worlds** and **Music**.

| # | Note | Trigger |
|---:|---|---|
| 1 | Equal areas | Press K or sustain an elliptical orbit after a fling. |
| 2 | Farther means slower | Increase orbital time with ]. |
| 3 | Escape speed | Preview a fling or see a flung world go outbound. |
| 4 | Gravity assist | A flung world gains speed and orbital energy passing a moving world. |
| 5 | Giant impacts | Two similar worlds merge. |
| 6 | The Roche limit | A smaller body breaks up into a ring. |
| 7 | How planets are born | Start a birth vortex or finish forming a world. |
| 8 | Colour is temperature | The star reignites. |
| 9 | Supernova | The expanding shock begins. The note now points to the timeline. |
| 10 | Flares and auroras | Stellar ejecta reach a planet. |
| 11 | A planet in transit | A foreground world blocks part of the star. |
| 12 | Habitable zone | Press Z or form or settle a world in the band. |
| 13 | The Sun’s surface | Approach the photosphere in Drift or open the solar print. |
| 14 | Day, night and sunrise | Attach to a planet in Drift. |
| 15 | Orbital resonance | Two periods stay within the ratio tolerance for two outer orbits. |
| 16 | The music of the spheres | Hear a fifth chime or press G. |
| 17 | Red giant | Enter the Red giant chapter. |
| 18 | Planetary nebula | Enter the Planetary nebula chapter. |
| 19 | White dwarf | Enter the White dwarf chapter. |
| 20 | Black holes and the event horizon | Form a black hole with Void. |
| 21 | Gravity bends light | Move the black hole in front of the star or a planet. |
| 22 | Accretion discs and jets | See the first jets after a meal. |
| 23 | Stretched by tides | A planet starts stretching into a thread. |
| 24 | Storms on gas giants | Stir a storm on Aurelia. |
| 25 | Tides | Move the moon on Tide. |
| 26 | Volcanoes powered by tides | Raise Ember’s first fountain. |
| 27 | Why there are seasons | Change Verdance’s tilt. |
| 28 | Geysers on an ice moon | Wake the first geyser on Vesper. |

### Final performance

These are 1920 × 1080 Chrome app-frame readings over approximately 1.75 seconds in each scene. The accretion disc spanned about 705 pixels on High and 702 on Low, roughly 37% of the frame width. All three fish schools fit in the fish test. High drew 300 fish and Low drew 150. Low reduced the fluid and crowd budgets while retaining the colour steps and line widths.

| Case | RTX 4070 Laptop · High | Iris Xe · Low |
|---|---:|---:|
| Planetary nebula overview | 144.37 fps | 126.96 fps |
| Black hole and accretion disc | 144.27 fps | 96.73 fps |
| Inside Aurelia | 139.33 fps | 144.28 fps |
| Ink fish | 144.31 fps | 107.34 fps |
| Plain Drift | 138.68 fps | 99.48 fps |

- High used `ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Laptop GPU (0x00002860) Direct3D11 vs_5_0 ps_5_0, D3D11)`.
- Low used `ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A6) Direct3D11 vs_5_0 ps_5_0, D3D11)`.

[High readings](output/playwright/phase4/performance-high.json) · [Low readings](output/playwright/phase4/performance-low.json).

### Final play and language check

- The 300.02-second Chrome session used the public controls for marbling, orbits, the solar print, Drift, Aurelia’s storm, the star’s five chapters, the black hole, feeding, the Atlas and postcards. It recorded zero page errors and zero failed actions. The Atlas count and the six tabs accounted for all 28 entries.
- Twenty automatic notes appeared, in this order. How planets are born, The music of the spheres, Equal areas, Farther means slower, A planet in transit, Giant impacts, Habitable zone, Escape speed, The Sun’s surface, Orbital resonance, Day, night and sunrise, Storms on gas giants, Red giant, Planetary nebula, White dwarf, Black holes and the event horizon, Stretched by tides, Accretion discs and jets, Gravity bends light, and Colour is temperature.
- A separate near-tail seek exercised the Frozen Star loop. Chrome measured both streaming decks playing the same track with live gain at the midpoint and a single deck playing from the start after the fade. The source and production bundle contained zero Cyrillic characters. The live page text passed the same check.
- The final focused check started the full film from Red giant, paused and resumed it, then used **M** in the open postcard dialog. The final build passed again.
- [Play session and note timestamps](output/playwright/phase4/natural-play.json) · [Atlas tabs](output/playwright/phase4/atlas-topics.json) · [Music loop](output/playwright/phase4/music-loop.json) · [Final controls](output/playwright/phase4/final-controls.json).

### NOT done / still weak

- **Stage 0.** Very shallow ring strands can still stairstep. The repaired cloud frame has 9.29% cream, mostly from Azure’s brightest bands. The broad Bayer screen-door pattern is gone.
- **Stage 1.** The resonant lock is based on the toy’s settled mean periods and draws the actual motion. The demo verifies playback and chime controls in Chrome. Listening comfort over all five full tracks is unmeasured.
- **Stage 2.** The white dwarf in the moving film missed the cream floor at 0.21%. The standalone white dwarf frame measured 0.30%. The nebula has hard ribs at a few shell tangencies in the poster.
- **Stage 3.** The background mesh and sheet samples show some stair-stepping at strong bends. The procedural sky is evaluated at the deflected coordinates. The accretion arcs are an illustrative projection.
- **Stage 4.** Tide’s dark share reached 41.35% on arrival and 41.23% in the toy view. Ember reached 43.74% and 42.00%. Those frames exceeded the 40% ceiling. Verdance at the maximum captured tilt reached 46.86% vivid among lit pixels against a 55% target. All five toys and their exterior state are present.
- **Stage 5.** The rider passes close enough that the leviathan can fill the frame and overlap the near sheets. The ride print shows the close engraving and the active ride control. The white dwarf’s two large creatures draw as outlines, and its remaining small fish retain some bright ink.
- **Stage 6.** PNGs and a WebM were verified in Chrome. Recording behaviour on other browsers is unmeasured.

## Phase 4.1 · Voyages and finish

[Play First Light](http://localhost:4106/). The Phase 4 server on port 4104 exited during the initial checks. I used port 4103 through the stage captures. During final play that server exited and another project took the port. The machine’s server helper restarted this workspace on port 4106 for the play rerun.

### Stage 1 · Sound

The collision used a sweep, a blast of noise and the birth chord. It now rings once at a low note snapped to the current scale, with two quieter overtones and a 2.65-second decay. I lowered the effects bus and made the air and water sounds narrower, darker and slower to rise and fall. The supernova retains its bass swell and music duck.

Chrome triggered all 25 one-shots against the streaming Frozen Star at the default levels. The table uses peak sample amplitude from the two Web Audio buses in the same interval. A negative difference means the effect was quieter. The music and effects sliders and **M** responded in the app. The production build passed.

| Effect | Music peak | Effect peak | Difference |
|---|---:|---:|---:|
| Collision | 0.1053 | 0.0485 | −6.7 dB |
| Stir | 0.0951 | 0.0015 | −36.3 dB |
| Comb | 0.1156 | 0.0032 | −31.2 dB |
| Flare | 0.1414 | 0.0032 | −32.8 dB |
| Dissolve | 0.1104 | 0.0021 | −34.3 dB |
| Splash | 0.1136 | 0.0141 | −18.1 dB |
| Supernova | 0.0999 | 0.0720 | −2.8 dB |

[Mix screenshot](output/playwright/phase41/s1-mix.png) · [All 25 effects](output/playwright/phase41/s1-audio.json).

### Stage 2 · Creatures

I replaced the flat silhouettes with three cross-sectioned bodies, thick-rooted wing-fins and tapered tails with two streamers. Nose-to-streamer lengths are 1.69–1.95 times Tide’s diameter. The fin wave, tail and bank deform the mesh. Each body carries its own engraved ink and takes discrete light from the star. The sheets keep their normal depth tests. Swimmers intersect them, write a V-shaped wake, inject velocity and ink behind it, and send a ring out on a breach.

The fish school follows one moving ribbon. The fish retain their eaten ink, split around a 1.43-unit camera bubble and are capped at 38 pixels in Drift. The initial dive gives the star three seconds of clear sight, measured from the end of the camera transition. Young-disc pages have no creatures. I left the five other story behaviours in the shared simulation.

Chrome checked **Creatures**, **D**, **F**, three-colour feeding and the calf, comb scatter, the young disc, red giant, white dwarf and a supernova dive and return. The recaptured ride leaves the head below the upper two-thirds of the frame. The production build passed. The side-on silhouette reads more like a narrow fish during the neutral wing pose. In Drift, a sheet or cloud can still briefly hide the swimmer.

[Silhouette sheet](output/playwright/phase41/s2-silhouette.png) · [Wake](output/playwright/phase41/s2-wake.png) · [First Drift frame](output/playwright/phase41/s2-first-drift.png) · [School](output/playwright/phase41/s2-school.png) · [Ride](output/playwright/phase41/s2-ride.png) · [Skin at 100%](output/playwright/phase41/s2-skin.png) · [Calf](output/playwright/phase41/s2-calf.png) · [Control results](output/playwright/phase41/s2-controls.json).

### Stage 3 · Voyages

**Voyage** or **V** opens the itinerary. Grand Tour, Sun Dive, Ring Run, Leviathan Song and The Life of a Star are always listed. Into the Dark appears while the hole exists, and Endless voyage shuffles shots without repeating the immediately previous one. Completion is saved locally. Endless can start after 90 seconds in the overview or eight seconds after settling in Drift. Settings control idle voyages and the cinema bars.

The probe uses a 36° lens and continuous steering through a series of waypoints, with look-ahead for orbiting targets, a speed envelope and a clearance margin around the real bodies. I capped both camera and travel turns after the first audit. The Life of a Star follows the existing live timeline and returns to Today on completion. Captions share the Atlas facts, and a new discovery briefly prints **+1 Atlas**. The soundtrack follows the surroundings and the effects bus runs at half level.

Chrome tried **V**, drag, ink, both shot arrows, **Space**, **P**, **W**, **Esc**, both settings, both idle starts and all six completions. The frame on either side of taking the helm had the same eye position and heading to the precision of the camera state. The production build passed. A scripted Drift pass taken during Leviathan Song supplied the missing clean swimmer view from Stage 2.

[Voyage list](output/playwright/phase41/s3-list.png) · [Caption](output/playwright/phase41/s3-caption.png) · [Taking the helm](output/playwright/phase41/s3-helm.png) · [Swimmer in Drift](output/playwright/phase41/s2-swimmer-in-drift.png) · [Controls and capture times](output/playwright/phase41/s3-controls.json).

| Voyage | Six-frame strip |
|---|---|
| Grand Tour | [120 seconds](output/playwright/phase41/s3-grand-strip.png) |
| Sun Dive | [70 seconds](output/playwright/phase41/s3-sun-strip.png) |
| Ring Run | [70 seconds](output/playwright/phase41/s3-rings-strip.png) |
| Leviathan Song | [70 seconds](output/playwright/phase41/s3-song-strip.png) |
| The Life of a Star | [150 seconds](output/playwright/phase41/s3-life-strip.png) |
| Into the Dark | [60 seconds](output/playwright/phase41/s3-dark-strip.png) |
| Endless voyage | [First 120 seconds](output/playwright/phase41/s3-endless-strip.png) |

### Stage 4 · First Light

The initial HTML paints the falling seed of ink, fine stars, engraved bloom, title and tips before the application imports. The seal advances as the scripts arrive, WebGL programs link, the first print initializes its textures, and the first track returns its metadata. The audio deck reuses that media element. **Begin** starts playback and opens shaped bands through the canvas mask from the real star across the disc.

Chrome reported a 52 ms first contentful paint on a warm reload, and the reveal took 1,505 ms after the click. I delayed the first MP3 response only in the capture run to show the seal paused at 75%. Chrome verified a silent audio graph before **Begin**, playing audio afterward, and motion under the reduced-motion flag. The production build passed.

[Falling drop](output/playwright/phase41/s4-first.png) · [Loading at 75%](output/playwright/phase41/s4-middle.png) · [Begin](output/playwright/phase41/s4-begin.png) · [Star revealed](output/playwright/phase41/s4-reveal-1.png) · [Disc revealed](output/playwright/phase41/s4-reveal-2.png) · [Timing](output/playwright/phase41/s4-timing.json).

### Stage 5 · Black hole

The old disc and its upper arc met at a horizontal join. The new accretion surface uses one continuous projection across the near and far halves. The far half rises at shallow angles and the lens carries a weaker copy beneath it. I made the accretion ink sample the live dye, paint and velocity fields through a logarithmic spiral. The inner paint prints in the fire palette. It gives way to the local pigment and curls farther out.

The background rays bend before sampling the sky engraving. The same deflection moves the depth-tested print of the worlds, stars and sheets. In the low-angle capture the cyan world and the sheet behind it stretch over the hole. Dragging the hole onto the star gave upper and lower orange arcs. The lit ring uses a screen-pixel width, and single foreground dust grains are excluded from the black silhouette.

Chrome formed and dragged the hole, stretched a world, saw a jet, used **Rekindle** and approached in Drift. The Stage 5 pass missed the falling threshold. The final targeted check verified falling in, the automatic return and coloured-ink evaporation. The most magnified background is still a sampled print, so some stretched engraved marks exceed two pixels. The production build passed.

[Overview](output/playwright/phase41/s5-overview.png) · [Star alignment](output/playwright/phase41/s5-star-ring.png) · [Low angle](output/playwright/phase41/s5-low.png) · [Drift](output/playwright/phase41/s5-drift.png) · [Bent lines at 100%](output/playwright/phase41/s5-crop.png).

### Stage 6 · The planetary nebula

The four colours now occupy four independently tilted, ruffled meshes. Each shell opens in patches and takes brighter ink at the grazing angle. I seeded tapered knots along outward radial paths. The old disc remains below the shells and dims as they fill out. The overview camera can orbit down to the disc plane, and the same meshes remain in view during Drift and The Life of a Star.

Chrome checked the timeline chapter, **Nebula print**, right-drag to the side and three-quarter views, **D** and **Esc**. The side capture was within one degree of the disc plane and the nebula still filled the height. The production build passed.

The poster measured 79.68% vivid among lit pixels and 0.80% cream. Dark pixels measured 51.64%, above the 50% ceiling. Teal, rose, violet and gold represented 17.85%, 17.51%, 23.72% and 7.93% of lit pixels. Gold was 0.07 points below its target.

[Poster](output/playwright/phase41/s6-poster.png) · [Side](output/playwright/phase41/s6-side.png) · [Three-quarter](output/playwright/phase41/s6-quarter.png) · [Inside](output/playwright/phase41/s6-inside.png) · [Camera positions](output/playwright/phase41/s6-views.json) · [Colour readings](output/playwright/phase41/s6-colour.json).

### Stage 7 · Small defects

| Defect | Change and verification |
|---|---|
| Young disc | The ring profile follows a smooth radius with three frequencies of folds. I reduced the young disc’s fluid override so the gaps stay legible. [Young disc](output/playwright/phase41/s7-young.png) |
| Resonance | The trace stores the difference between the two live orbital positions. A continuous curve travels through those samples and fades toward its tail. Chrome caught Ember and Verdance locked at 1:2. [Relative orbit](output/playwright/phase41/s7-rosette.png) |
| Stellar face | Geometry shading clips bright arches at the photosphere’s projected limb. A dark filament follows the rotating face. [Solar print](output/playwright/phase41/s7-prominences.png) |
| Pale patch by Aurelia | A hard rectangular planet-shadow mask on the disc caused the abrupt edge. The shadow now tapers through a rounded profile. [Aurelia in overview](output/playwright/phase41/s7-aurelia.png) |
| Late notes | Notes carry their chapter, and a jump replaces the current card and discards pending cards from earlier chapters. Chrome jumped Red giant → Nebula → White dwarf → Red giant and checked the active card and queue. [Current chapter note](output/playwright/phase41/s7-notes.png) |
| Ember | Three staggered lava ribbons and their droplets follow ballistic arcs. Branching rivers spread outward from the vent. Chrome cracked the crust, rode back out and verified the surviving surface state. [Fountain](output/playwright/phase41/s7-fountain.png) |

The production build and the focused Chrome run passed. The young disc measured 81.51% vivid among lit pixels, 40.66% dark and 1.39% cream. The final control check also verified **Space** and the helm handoff with focus on the next-shot button. [Control results](output/playwright/phase41/s7-controls.json) · [Young-disc colour reading](output/playwright/phase41/s7-young-colour.json) · [Final control check](output/playwright/phase41/s7-final-controls.json).

### Camera audit

I sampled the live flight controller and simulation at 60 Hz. The test used the default overview as the starting camera and ran all six finite routes to their ends. For Endless it sampled a four-minute sequence with a fixed shuffle seed and a black hole present. Clearance is the smallest gap above a surface as a fraction of that body’s radius. The extra margin around a swimmer includes its moving fins and streamers.

| Voyage | Zero-speed frames | Largest one-second speed change | Fastest camera / travel turn | Smallest clearance | Largest bank |
|---|---:|---:|---:|---:|---:|
| Grand Tour | 0 | 26.7% | 23.5°/s / 23.8°/s | 0.655 r | 5.46° |
| Sun Dive | 0 | 26.7% | 21.6°/s / 23.8°/s | 0.578 r | 5.04° |
| Ring Run | 0 | 26.7% | 21.6°/s / 23.8°/s | 0.967 r | 4.49° |
| Leviathan Song | 0 | 26.7% | 21.6°/s / 23.8°/s | 0.250 r | 4.14° |
| The Life of a Star | 0 | 26.7% | 21.6°/s / 23.8°/s | 0.516 r | 5.38° |
| Into the Dark | 0 | 26.7% | 21.6°/s / 23.8°/s | 0.384 r | 4.02° |
| Endless voyage | 0 | 26.7% | 23.5°/s / 23.8°/s | 0.750 r | 5.45° |

[Camera samples](output/playwright/phase41/s3-audit.json).

### 1080p performance

I took one approximately 1.75-second app-frame reading per scene and GPU. The three swimmers were in frame with 300 fish on High or 150 on Low. The accretion disc spanned an estimated 794 pixels on High and 759 on Low. Sun Dive reached 3.25–3.28 stellar radii from the star’s centre before the sampling window.

| Scene | RTX 4070 Laptop · High | Iris Xe · Low |
|---|---:|---:|
| Voyage close pass | 144.41 fps | 38.87 fps |
| Three leviathans and fish | 144.66 fps | 84.24 fps |
| Black hole close-up | 144.11 fps | 87.34 fps |
| Inside the nebula | 144.41 fps | 80.07 fps |

- High GPU string `ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Laptop GPU (0x00002860) Direct3D11 vs_5_0 ps_5_0, D3D11)`
- Low GPU string `ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A6) Direct3D11 vs_5_0 ps_5_0, D3D11)`

[High readings](output/playwright/phase41/s7-performance-high.json) · [Low readings](output/playwright/phase41/s7-performance-low.json).

### Final play and language check

The 300.02-second Chrome rerun completed with zero page or WebGL errors and zero failed actions. It ran a full 150.07-second **The Life of a Star** voyage and reached Today again. The session also exercised ink, stir, comb, birth, flares, a fling, chimes, manual Drift, Aurelia’s storm, black-hole formation and evaporation, all six Atlas tabs and the postcard editor. I found no Cyrillic in the source, production bundle or visible page text.

The automatic cards that appeared were How planets are born, Equal areas, Habitable zone, A planet in transit, The music of the spheres, Escape speed, Flares and auroras, The Sun’s surface, Giant impacts, Day, night and sunrise, Storms on gas giants, and Black holes and the event horizon. Red giant, Planetary nebula and White dwarf were discovered quietly during the voyage.

[Play session](output/playwright/phase41/s7-natural-play.json) · [Shells during the live voyage](output/playwright/phase41/s7-life-shells.png).

### NOT done / still weak

- **Stage 1.** Peak balance was measured against Frozen Star. The other four mixes and listening comfort across sound systems remain unmeasured.
- **Stage 2.** When a swimmer is directly below opaque ink, the sheet can briefly hide the head in the ride view. The neutral side silhouette is the least distinct of the three views.
- **Stage 3.** The sampled routes meet the motion limits. The Grand Tour does not consistently give every world a half-frame close pass. In the audited run, Tide and Aurelia merged before their assigned encounters. Ring Run’s storm and Leviathan Song’s breach depend on the live scene and were not guaranteed in the captures. A voyage started inside a planet uses the exterior Drift pose that supports that interior.
- **Stage 4.** Warm paint and the reveal passed in Chrome. Other browsers and interrupted media connections were not measured.
- **Stage 5.** A few background lines still widen beyond two pixels under the strongest magnification.
- **Stage 6.** The poster missed the dark ceiling and gold floor by the margins above. Shell patches sometimes cover the core.
- **Stage 7.** The rosette’s fine trace can be hard to pick out over a bright band.

## Phase 4.2 · The Director's Cut

### Stage 1 · The film programme

The waypoint controller could spend a whole shot turning toward a world it never reached. The director now evaluates seven parameterised camera moves around live subjects. It overlaps the moves through a travelling two-subject composition, scouts approach angles against neighbouring bodies and withdraws cloud islands in pigment bands. A film uses the 36° lens and a level horizon. Orbital dynamics advance at 14% of the selected rate during a film so that the moving subjects remain recognisable. The helm inherits the camera position and heading. The measured handoff position error was zero.

At 36°, the diameter of a sphere 2.2 radii from the eye spans about 157% of the height. I used screen height to set the hero distance, about 5.2 radii for a 60% portrait. The first trial showed foreground occlusions and a blank frame on the way to Ember. I adjusted the approach-angle selection, how the incoming and outgoing paths meet, the exposure of the solar corona and the amount of clear space around a cloud.

**Sun Dive ships.** Grand Tour, Ring Run, The Life of a Star, Leviathan Song, Into the Dark and Endless voyage missed a gate on the second audit. The programme omits them. Sun Dive supplies the default and idle film. The original timelines and the black hole remain available in manual play.

| Voyage and strip | Dark range | Min visible | Off screen | Sheet gap | Crossings | Hero heights | Turn °/s median / p95 | Stopped | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [Grand Tour](output/playwright/phase42/s1-grand-strip.png) | 24.5–51.0% | 0.2% | 0 | 0.50 | 0 | 60.5%, 60.5%, 61.2%, 61.3%, 61.5% | 6.1 / 16.7 | 0 | Remove |
| [Sun Dive](output/playwright/phase42/s1-sun-strip.png) | 22.0–42.1% | 83.4% | 0 | 0.50 | 0 | — | 2.3 / 9.1 | 0 | Ship |
| [Ring Run](output/playwright/phase42/s1-rings-strip.png) | 5.8–43.0% | 51.8% | 0 | 0.18 | 1 | 61.1% | 3.6 / 25.5 | 0 | Remove |
| [The Life of a Star](output/playwright/phase42/s1-life-strip.png) | 16.6–61.5% | 0.0% | 0 | 0.08 | 1 | 35.0% | 1.2 / 10.3 | 0 | Remove |
| [Leviathan Song](output/playwright/phase42/s1-song-strip.png) | 25.7–50.2% | 94.2% | 0 | 0.67 | 0 | — | 3.4 / 18.1 | 0 | Remove |
| [Into the Dark](output/playwright/phase42/s1-dark-strip.png) | 16.1–39.9% | 36.2% | 0 | 0.67 | 0 | 54.6% | 3.3 / 6.2 | 0 | Remove |
| [Endless voyage](output/playwright/phase42/s1-endless-strip.png) | 18.7–47.3% | 0.0% | 1 | 0.50 | 0 | 61.5%, 61.5%, 61.5%, 61.5% | 3.6 / 17.6 | 0 | Remove |

The page advanced the moving system at 60 Hz and read the actual rendered frame at three-second intervals, with additional opening and closing samples. The dark share uses a 160 × 90 canvas and Rec. 709 luma below 25. Subject visibility compares a tagged scene render with the same isolated geometry at 320 × 180. For the hole it measures the black horizon disc. Limb shots evaluate the visible limb. A wide shot uses the star as its anchor. The sheet distance includes the finite edge at radius 15.5. A cloud whose bounding surface comes within 0.34 of the eye-to-subject segment dissolves completely. The JSON retains the more conservative distance to the unculled cloud bounds. Camera turns and stops use all simulated frames. Endless was sampled for 150 seconds with a fixed seed. Hero heights follow the shot order. Samples and strips are evidence for those runs only.

I inspected all eight frames of each strip at the stored 480 × 270 size. Sun Dive keeps the star, Ember or the disc legible at each stop. The rejected Life strip includes a featureless pale frame, Endless crosses a foreground body, and several swimmers disappear against the sea even when their pixels are visible. The worst turn in the 95th percentile was Ring Run’s 25.5°/s.

The film hides the bench, chips, discovery UI and top toolbar. The caption uses a subject title and a separate fact line. The transport appears on activity and carries the progress ticks. Chrome exercised the three transport buttons, Take the helm, drag, ink selection and click, keyboard shot navigation, pause, postcard and Escape. The production build passed. The Browser plugin was unavailable, so these measurements use the installed Chrome through Playwright.

[Caption](output/playwright/phase42/s1-caption.png) · [Transport](output/playwright/phase42/s1-transport.png) · [Audit table](output/playwright/phase42/s1-table.png) · [Control measurements](output/playwright/phase42/s1-controls.json).

### Stage 2 · Voyage, Drift and Bench

Begin now opens the film picker as the last band of the First Light reveal clears. The picker uses a 520 × 293 WebP captured during the live Sun Dive. Its card shows the title, running time, description and completion status. The selected film starts after ten seconds without input. Completion returns to the picker. With a single accepted cut, the next selection is Sun Dive again.

The bottom bar selects Voyage, Drift and Bench. Drift shows ink, Ride and Dive. Bench shows the marbling verbs, timeline and chime controls. Atlas, Postcard and Settings share the upper right. H opens help for the current mode, and the three introductory hints use local storage to appear once per browser profile. The 90-second idle setting applies in both manual modes.

Chrome checked all three mode buttons and help panels, the camera during a switch, picker and idle timeouts, the completion mark, the helm, timeline, ink, chime, Atlas, postcard, and disabling idle playback. The checks recorded zero page or WebGL errors. The production build passed. The previous server stopped answering during this stage. The machine helper restarted this workspace at the same address.

[Picker after Begin](output/playwright/phase42/s2-picker.png) · [Drift](output/playwright/phase42/s2-drift.png) · [Bench](output/playwright/phase42/s2-bench.png) · [Top right](output/playwright/phase42/s2-top.png) · [Mid-flight](output/playwright/phase42/s2-switch.png) · [Completed film](output/playwright/phase42/s2-completed.png) · [Control checks](output/playwright/phase42/s2-controls.json).

### Stage 3 · Shells, sheets and silhouettes

The old nebula’s changing mesh radius and independent tilts made its edges curl into overlapping ribbons. Four smooth concentric ellipsoids now carry the colour, from teal through rose and gold to violet. Each membrane has a bright grazing rim, a translucent engraved face and open gaps. The renderer orders the near and far walls according to which shells contain the eye. The radial knots remain visible between layers. In the white-dwarf chapter the shells disperse into sparse wisps.

The 1920 × 1080 nebula print measured **62.49% vivid among lit pixels, 34.08% dark and 1.36% cream**. Teal, rose, gold and violet accounted for 10.14%, 13.05%, 11.88% and 18.58% of lit pixels. All poster colour targets passed. The side camera was 0.13 units above the disc at a distance of 21.2 units. The inside camera was between the inner shells. [Above](output/playwright/phase42/s3-nebula-above.png) · [Side](output/playwright/phase42/s3-nebula-side.png) · [Inside](output/playwright/phase42/s3-nebula-inside.png) · [Colour and camera readings](output/playwright/phase42/s3-looks.json).

| Repair | Result at 1920 × 1080 |
| --- | --- |
| Near-sheet detail | World-space curls and smaller islands now alter both the pigment steps and the engraved lines. At eye height −0.02 above the −0.32 sheet, the longest horizontal run of lit pixels without a 10-level RGB edge was **173 px**. The 99th percentile was 16 px. [Native-resolution frame](output/playwright/phase42/s3-near-sheet.png) |
| Edge-on sheets | A folded coastline breaks the distant ink into tongues. In the eye-level test, a shader tag identified 1,961 visible sheet pixels at angles under 3°. Their longest unbroken horizontal run was **138 px**, against a 640 px ceiling. The overview plates also lose their hard edge at grazing angles. [Eye level](output/playwright/phase42/s3-eye-level.png) · [Tagged-fragment reading](output/playwright/phase42/s3-grazing.json) |
| White dwarf | The cooling core shrinks in world units, with a screen-height cap and thin crossed rays. The bright central feature measured **6 px**, or 0.56% of the frame height, in the chapter capture. [White dwarf](output/playwright/phase42/s3-dwarf.png) · [Pixel readings](output/playwright/phase42/s3-detail.json) |
| Leviathans | I widened the outer fins and extended the travelling tail. The ink opens around the swimmer’s body and wing tips. Sable, Opal and Cinder each show both wings and their tapering tails in the overhead portraits. [Three overhead views](output/playwright/phase42/s3-swimmers.png) |

The look captures use controlled viewpoints in the live renderer. The three swimmer portraits share one simulation instant. A second Sun Dive frame check after the Drift shading changes measured 21.97–49.59% dark pixels, minimum subject visibility 82.42%, minimum sheet clearance 0.50, median turn 2.29°/s and 95th percentile 9.10°/s. There were zero stopped frames or crossings. [Final film strip](output/playwright/phase42/s3-film-sun-strip.png) · [Frame measurements](output/playwright/phase42/s3-film-sun.json).

Pausing the film now freezes the simulation clock. An Ember pause held both the camera and projected world positions stationary while the transport faded after three seconds. The 90-second idle timer includes Bench portraits and interior or riding views in Drift. Chrome verified idle playback from the solar print. The Stage 3 production build passed. [Pause and idle check](output/playwright/phase42/s3-pause.json).

### 1080p performance

Each reading counts application frames over approximately 2.1 seconds. I measured the released picker first, then enabled the withheld Grand Tour only in the benchmark tab to measure the **C hero pass** at 5.35 Ember radii. The nebula reading uses manual Drift between the shells.

| Scene | RTX 4070 Laptop · High | Iris Xe · Low |
| --- | ---: | ---: |
| Ember hero pass | 144.47 fps | 56.15 fps |
| Voyage picker over the live system | 144.21 fps | 65.33 fps |
| Inside the nebula | 144.30 fps | 80.92 fps |

High reported `ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Laptop GPU (0x00002860) Direct3D11 vs_5_0 ps_5_0, D3D11)`. Low reported `ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A6) Direct3D11 vs_5_0 ps_5_0, D3D11)`. Both ran with the reduced-motion preference enabled. [High readings](output/playwright/phase42/s3-perf-high.json) · [Low readings](output/playwright/phase42/s3-perf-low.json).

### Five minutes from Begin

The final playthrough ran for 300.021 seconds in real time with zero page errors. It started at Begin, watched Sun Dive through the return to the picker, took the helm on the next film, and visited Drift, Bench and Voyage. It also exercised ink, contextual help, Atlas, the nebula and white dwarf chapters, Postcard, the picker timeout and the keyboard helm. [Timestamped play log](output/playwright/phase42/s3-play.json).

### NOT done / still weak

- **Six cuts were removed.** Only Sun Dive met the release gate. The picker and the 10-second and 90-second starts therefore play a finite film. The requested random, continuous Endless voyage did not ship.
- Grand Tour reached the requested height on all five worlds, but lost its subject at 27 seconds. Ring Run’s storm pass fell below the dark-share and visibility thresholds. The Life of a Star still lost the core behind the gas. Leviathan Song’s 95th-percentile turn was 18.1°/s. Into the Dark lost much of its horizon on the transfer to the rise. Endless lost a subject off screen.
- The film begins at its authored opening pose. The mode buttons interpolate the camera, and taking the helm preserves its pose. The startup pose can still differ from the one a player occupied immediately before starting a film.
- The caption gate checks projected framing and a short settling time. It does not measure occlusion every animation frame. The instrumented audit measures obscuration at three-second intervals, and orbital alignments vary in a system the player has edited.
- The face lace remains visible most clearly from inside. Its exact open-area fraction was not measured. The horizontal edge and streak readings cover the recorded viewpoints. The near-sheet reading is a one-dimensional contrast measure, and it excludes unlit sky.

