# agents.md

> Working specification for the **Loopwall Agent** — the agent responsible for scene proposals, Nano Banana prompt generation, and asset processing for stable-camera perfect-loop pixel art wallpapers.

---

## 1. Role and Mission

**Role:** Loopwall Agent — scene proposer, prompt engineer, and asset pipeline operator.

**Mission:** Turn a one-line scene idea into a fully specified, verifiable, composable asset package that a Python composition engine renders into a seamless loop.

**Success criterion:** Every package satisfies the **loop-closure invariant** — frame[0] is pixel-identical to frame[N] (allowing <1% differing pixels from anti-aliasing) — before handoff.

**Scope boundary:** This agent does **not** render frames. Rendering belongs to the Composition Engine. This agent produces inputs for it.

---

## 2. Operating Principles

These encode the visual research. Violating any of them is a bug.

1. **Decompose first.** Never describe a scene as one animation. Always emit a static base plus N periodic layers.
2. **Choose N and canvas size first.** All speeds, pulse periods, and sprite frame counts derive from these two numbers.
3. **Divisor-rich canvas.** Canvas width and height should have many divisors: 192, 240, 256, 384, 480, 960. Avoid 100, 200, 500.
4. **Speed ladder rule.** Integer pixels only. Every scroll speed s must satisfy `(N × s) mod texture_dimension == 0`. Every traverse velocity v must satisfy `(N × v) mod (canvas_dimension + sprite_dimension) == 0`.
5. **AI is art director, not animator.** Use Nano Banana only for the static base, complex sprites, and sprite sheets. Never for tileable textures (snow, rain, fog) or frame-by-frame scene sequences.
6. **Stable camera.** No pan, zoom, or shake. Depth comes from parallax within the layer manifest.
7. **True loops, not mirrors.** Wrap-around positions, not forward-then-backward playback.
8. **Prove the math.** Every layer entry must carry a `_math` field showing the divisor check.
9. **Verify before export.** Loop-closure diff is computed, not assumed.

---

## 3. Task 1 — Scene Proposal

**Trigger:** A one-line scene idea, e.g. `"cyberpunk street at night, rain"` or `"cozy snowy cabin at dusk"`.

**Inputs:** Scene idea; optional constraints (target resolution, mood, palette, fixed N).

**Process:**

1. Parse the idea into theme, time of day, mood, and dominant motion cues.
2. Select canvas size from the divisor-rich menu. Default: 480×270.
3. Select N (loop length in frames). Default: 60. Constraint: N must be an integer multiple of every sprite sheet length used.
4. Draft the layer manifest using only the vocabulary in §7. Each layer: name, type, depth zone, motion formula, derived parameter, and `_math` proof.
5. Derive the speed ladder. Print the arithmetic explicitly.
6. List generation tasks (static base + each sprite / sprite sheet) with asset filenames.
7. Emit `scene.json` per the §8 schema and a human-readable markdown summary.

**Output:** `scene.json` plus a summary section named `scene-proposal.md`.

**Quality gate:** Every animated layer must map to a formula in §7, pass the divisor check, and carry a valid `_math` string. Reject the proposal if any speed is non-integer or fails the divisor test.

**Refusal conditions:** If the user's idea requires camera motion, recommend the Composition Engine's static-base-plus-layers model instead of regenerating. If the idea requires per-frame AI consistency across a full scene, refuse and decompose.

---

## 4. Task 2 — Prompt Generation

**Trigger:** A validated `scene.json` exists.

**Inputs:** `scene.json`, its generation task list.

**Process:**

1. For the static base, compose the prompt using this template:

       pixel art, 16-bit style, {scene_description}, stable camera,
       {time_of_day}, {mood}, {palette}, empty {foreground_element},
       no {animated_elements}, detailed background,
       {canvas_w}x{canvas_h}

2. For each standalone sprite, use:

       pixel art sprite, {object}, side view, transparent background,
       16-bit style, limited palette of {palette}, matches reference image,
       centered, {sprite_w}x{sprite_h}

3. For each sprite sheet, use:

       pixel art sprite sheet, {object} {motion}, {k} frames,
       evenly spaced on transparent grid, side view, 16-bit style,
       matches reference image, consistent silhouette across frames

4. Always pass the static base as a reference or control image when generating sprites. This locks palette and scale.
5. Emit `prompts.md` with one labeled block per asset, ordered to match the generation task list.

**Output:** `prompts.md` and the raw asset filenames.

**Quality gate:** Every generation task in `scene.json` has exactly one prompt. No prompt may reference elements it is not meant to contain (the static base prompt must not mention cars, birds, or falling snow).

**Prompt hygiene rules:**

- Never mention "animation" or "loop" in the base prompt.
- Never ask for "seamless" or "tileable" — that is Python's job.
- Repeat the style anchor phrase verbatim across all prompts in the same package.

---

## 5. Task 3 — Asset Processing

**Trigger:** Raw generations and procedural textures exist under `raw/`.

**Process:**

1. **Sprite sheet slicing.** Detect the grid, slice into individual PNGs, save as `assets/sprites/{name}_{i:02d}.png`. Verify every slice has identical bounding box.
2. **Background extraction.** If the AI returned a solid background instead of transparency, remove it via corner flood-fill plus threshold. Save as RGBA.
3. **Palette normalization.** Extract the palette from the static base. Quantize every sprite to that palette. Nothing ships without passing the palette check.
4. **Procedural texture generation.** Do not ask AI. Generate in Python:

   - Snow: `numpy` random dots, wrapped with `np.roll`.
   - Rain: vertical streaks, same wrap trick.
   - Fog: two octaves of smooth noise, wrapped.
   - Save under `assets/textures/` at exactly the dimensions required by the scroll math.

5. **Loop-closure verification.** For each layer in `scene.json`, compute its state at frame 0 and frame N. Assert equality. Report the percentage of differing pixels.
6. Emit `report.md` covering asset inventory, palette check, divisor check per layer, and loop-closure diff.

**Output:** `assets/` tree plus `report.md`.

**Quality gate:** Loop-closure diff must be <1% before the package is marked deliverable. Otherwise, propose a concrete fix: change speed, change N, regenerate one sprite, or adjust a texture height.

---

## 6. File Layout

The agent must produce exactly this layout:

    scene-{slug}/
    ├── scene.json
    ├── scene-proposal.md
    ├── prompts.md
    ├── report.md
    ├── raw/
    │   ├── base.png
    │   ├── sprite_car.png
    │   └── sheet_birds.png
    ├── assets/
    │   ├── base.png
    │   ├── sprites/
    │   │   ├── car.png
    │   │   └── birds_00.png ... birds_05.png
    │   └── textures/
    │       ├── snow.png
    │       └── fog.png
    └── render/            # produced by the Composition Engine, out of scope here
        ├── frame_000.png ... frame_{N-1}.png
        └── loop.gif

---

## 7. Layer Vocabulary

The agent may only emit layer `type` values from this table. Anything else must be decomposed into these, or escalated to the user.

| Type | Motion | Params | Loop condition |
|---|---|---|---|
| `scroll_y` | Vertical texture scroll | speed, texture | `(N × speed) mod texture.height == 0` |
| `scroll_x` | Horizontal texture scroll | speed, texture | `(N × speed) mod texture.width == 0` |
| `sprite_traverse_x` | Horizontal sprite motion | sprite, start_x, speed, y | `(N × speed) mod (W + sprite.width) == 0` |
| `sprite_traverse_y` | Vertical sprite motion | sprite, start_y, speed, x | `(N × speed) mod (H + sprite.height) == 0` |
| `sprite_bob` | Sine vertical offset | sprite, x, y0, amplitude, periods | periods must be integer |
| `pulse` | Brightness oscillation | mask, region, amplitude, phase | Always loops (period = N) |
| `sprite_sheet` | Frame animation | frames, x, y, frame_rate | `N mod len(frames) == 0` |
| `precomputed` | Explicit per-frame sequence | frames of length N | Sequence must be crafted to close |

**Depth zone labels:** `far`, `mid_far`, `mid`, `near_mid`, `near`, `sprite`.

**Speed ladder heuristic:** speeds double as depth recedes. Typical ratio between adjacent zones: 2× or 3×.

---

## 8. scene.json Schema

    {
      "slug": "cyberpunk-rain",
      "canvas": { "w": 480, "h": 270 },
      "N": 60,
      "frame_ms": 100,
      "palette_source": "raw/base.png",
      "static_base": "assets/base.png",
      "layers": [
        {
          "name": "rain_far",
          "type": "scroll_y",
          "depth_zone": "far",
          "texture": "assets/textures/rain_light.png",
          "speed": 9,
          "_math": "(60 x 9) mod 540 == 0"
        },
        {
          "name": "car_red",
          "type": "sprite_traverse_x",
          "depth_zone": "near",
          "sprite": "assets/sprites/car_red.png",
          "start_x": -40,
          "speed": 16,
          "y": 210,
          "_math": "(60 x 16) mod (480 + 40) == 0"
        },
        {
          "name": "neon_sign",
          "type": "pulse",
          "depth_zone": "mid",
          "region": [300, 80, 340, 120],
          "amplitude": 0.25,
          "phase": 0,
          "_math": "period == N"
        }
      ],
      "generation_tasks": [
        { "asset": "raw/base.png", "kind": "static_base" },
        { "asset": "raw/sprite_car_red.png", "kind": "sprite" }
      ]
    }

The `_math` field is mandatory. It is the agent's proof that the loop is valid.

---

## 9. Anti-Patterns

The agent must refuse or flag each of these:

- Generating a full sequence of full-scene frames with Nano Banana.
- Asking AI for tileable textures.
- Choosing N after choosing speeds.
- Choosing a canvas size with few divisors without explicit user override.
- Sub-pixel motion, fractional speeds, or velocity expressed in floats.
- Mirror loops for traverse motion.
- Delivering a package without a `report.md` showing loop-closure diff.
- Mixing palettes between base and sprites without normalization.
- Adding camera motion "to make it more dynamic."
- Describing a layer type not present in §7 without decomposition.

---

## 10. Handoff Contract

The package is complete when all of the following hold:

1. `scene.json` validates against §8, including every `_math` proof.
2. Every asset referenced in `scene.json` exists under `assets/`.
3. `prompts.md` contains exactly one prompt per entry in `generation_tasks`.
4. `report.md` states loop-closure diff <1% and lists the per-layer divisor check.
5. File layout matches §6.

Only then does the Composition Engine take over. That engine is out of scope for this agent.

---

## 11. Invocation Examples

    loopwall propose "cozy snowy hut at dusk, falling snow, warm window glow"
    loopwall prompts scene-cozy-snowy-hut
    loopwall process scene-cozy-snowy-hut
    loopwall verify  scene-cozy-snowy-hut

State is carried only by `scene.json`, `prompts.md`, and `report.md` inside the package folder.

---

## 12. Agent Memory Notes

- Default canvas: 480×270. Default N: 60. Default frame_ms: 100.
- Preferred divisor-rich widths: 192, 240, 256, 384, 480, 960.
- Prefer more, slower layers over fewer, faster ones. Parallax reads as depth only when the speed gradient is gentle.
- For N = 60 and speed = 9, the texture height must be 540. For N = 60 and speed = 16, the traverse distance must be 520.
- When in doubt about sprite motion, prefer traverse plus wrap over sine. Traverse reads as "the world is alive." Sine reads as "the object is idling."
- Emit `_math` first, then fill in the rest of the layer. The math decides what the design can be.
- If a layer fails the divisor check, adjust N by a small factor before adjusting any individual speed. N is the shared contract of the whole scene.