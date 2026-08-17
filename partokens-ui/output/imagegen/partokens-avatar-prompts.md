# Partokens monochrome avatar redesign

## Direction

Refine the existing Partokens `P` through geometry alone. The design is strictly monochrome: no blue accent, routing metaphor, token, node, internal line, or added symbol.

Visual anchors:

- Existing mark: `packages/design-system/src/components/partokens-mark.tsx`
- Light mode: surface `#ffffff`, mark `#1f2328`
- Dark mode: surface `#0d1117`, mark `#f0f6fc`
- Shape: compact rounded-square avatar, optically centered, 17% safe area
- Character: quiet technical, precise, restrained, timeless

The refinement comes from:

- a smoother and more compact outer bowl
- a more regular inner counter
- consistent optical stroke weight
- a natural continuous transition into the diagonal stem
- matching restrained diagonal terminal cuts

## Generation sequence

1. Use `partokens-mark-reference.png` as the structural reference for the dark version.
2. Validate the dark result at 16 px and 32 px.
3. Use the approved dark result and original mark as references for the light version.
4. Reject any light result with geometry drift or chromatic color.

Settings: `gpt-image-2`, `1024x1024`, high quality, PNG, edit endpoint. Do not set `input_fidelity`; `gpt-image-2` always uses high fidelity for image inputs.

```bash
OPENAI_BASE_URL=https://partokens.com/v1 python3 /Users/dj/.codex/skills/.system/imagegen/scripts/image_gen.py edit \
  --model gpt-image-2 \
  --image output/imagegen/partokens-mark-reference.png \
  --prompt-file output/imagegen/partokens-avatar-monochrome-dark-prompt.txt \
  --size 1024x1024 \
  --quality high \
  --output-format png \
  --out output/imagegen/partokens-avatar-monochrome-dark.png
```

```bash
OPENAI_BASE_URL=https://partokens.com/v1 python3 /Users/dj/.codex/skills/.system/imagegen/scripts/image_gen.py edit \
  --model gpt-image-2 \
  --image output/imagegen/partokens-avatar-monochrome-dark.png \
  --image output/imagegen/partokens-mark-reference.png \
  --prompt-file output/imagegen/partokens-avatar-monochrome-light-prompt.txt \
  --size 1024x1024 \
  --quality high \
  --output-format png \
  --out output/imagegen/partokens-avatar-monochrome-light.png
```

## Acceptance checks

- The original P identity remains recognizable without a wordmark.
- The mark is one uninterrupted foreground shape.
- Only neutral monochrome tones are present.
- Dark and light versions have matching geometry.
- The silhouette remains clean at 16 px and 32 px.
- There is no internal decoration, stray text, watermark, glow, gradient, or scene.
