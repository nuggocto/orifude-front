---
name: Orifude
description: Quiet terminal correspondence carried through a folded-paper editorial world.
colors:
  ink: "#292823"
  washi-ground: "#fbf7f1"
  washi-sheet: "#faf7f0"
  washi-deep: "#e5dccb"
  moss: "#858a72"
  moss-deep: "#626851"
  clay: "#a48b68"
  branch: "#62594d"
  ash: "#a59e91"
  ember: "#a45b52"
  terminal: "#171814"
  terminal-ink: "#e7e4d8"
  focus-oxide: "#7a3f38"
typography:
  display:
    fontFamily: '"Alegreya Variable", Georgia, serif'
    fontSize: "clamp(3.3rem, 4.7vw, 4.7rem)"
    fontWeight: 470
    lineHeight: 1.01
    letterSpacing: "-0.025em"
  headline:
    fontFamily: '"Alegreya Variable", Georgia, serif'
    fontSize: "clamp(2.6rem, 5vw, 4.75rem)"
    fontWeight: 560
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"Alegreya Variable", Georgia, serif'
    fontSize: "2rem"
    fontWeight: 560
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  body:
    fontFamily: '"Atkinson Hyperlegible Next Variable", system-ui, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  action:
    fontFamily: '"Alegreya Variable", Georgia, serif'
    fontSize: "1.2rem"
    fontWeight: 600
    lineHeight: 1.2
  label:
    fontFamily: '"Atkinson Hyperlegible Next Variable", system-ui, sans-serif'
    fontSize: "0.88rem"
    fontWeight: 650
    lineHeight: 1.55
spacing:
  xs: "0.55rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
  3xl: "4rem"
components:
  action-primary:
    backgroundColor: "{colors.moss-deep}"
    textColor: "{colors.washi-sheet}"
    typography: "{typography.action}"
    padding: "0.75rem 1.25rem"
    height: "3.25rem"
  action-text:
    textColor: "{colors.moss-deep}"
    typography: "{typography.label}"
  paper-fold:
    backgroundColor: "{colors.washi-sheet}"
    textColor: "{colors.ink}"
  terminal-panel:
    backgroundColor: "{colors.terminal}"
    textColor: "{colors.terminal-ink}"
    padding: "1.25rem 1.4rem"
---

# Design System: Orifude

## Overview

**Creative North Star: "Folded branch"**

Orifude uses a quiet editorial composition built from warm washi, ink, and a single branch that carries the eye between folded letter panels. The page should feel handled and human without becoming nostalgic theater. Broad negative space, horizontal reading, and crisp product evidence keep the material treatment usable.

The visual world is controlled rather than polished smooth. Paper silhouettes vary in angle and scale. Fine crease lines, fiber texture, and sparse moss or clay details give the folds physical character. The supplied wordmark remains clean, the squirrel courier appears only at a meaningful delivery transition, and terminal evidence stays recognizably terminal evidence.

**Key Characteristics:**

- Asymmetric folded-paper fields instead of a regular card grid.
- One irregular ink branch linking major moments without crossing copy.
- Warm, low-chroma color with moss actions and clay markers.
- Alegreya for the correspondence voice and Atkinson Hyperlegible Next for factual copy.
- Real TUI proof set against tactile paper, with little motion beyond control feedback.

## Colors

The palette is warm, muted, and materially specific. Washi dominates, ink carries copy, and the accent colors remain scarce.

### Primary

- **Deep moss:** Used for the main action, selection, link emphasis, and small process markers. It is the active color, not a broad background wash.
- **Soft moss:** Available for quieter brand accents and artwork support where deep moss would read too heavily.

### Secondary

- **Clay:** Marks sequence, status, and small handmade details such as the private-alpha dot.
- **Ember:** Reserved for warning or destructive meaning. It does not compete with the download action.

### Tertiary

- **Ink branch:** Draws connective lines, dividers, and the authored branch. Its brown cast keeps those structures softer than body copy.
- **Warm ash:** Supports quiet secondary detail where branch or ink would be too strong.

### Neutral

- **Soft ink:** The default text and strong structural color.
- **Washi ground:** The continuous page field beneath every section.
- **Washi sheet:** The lighter face of folded panels.
- **Deep washi:** Used for fold edges, paper depth, and scrollbar contrast.
- **Terminal black:** Contains recorded terminal output and install commands.
- **Terminal parchment:** Keeps terminal text warm enough to belong to the paper palette.
- **Oxide focus:** Creates the high-contrast focus outline without borrowing the moss action color.

### Named Rules

**The Scarce Accent Rule.** Moss identifies action and clay identifies small moments. Neither becomes a large decorative field.

**The Warm Black Rule.** Use soft ink and terminal black. Avoid neutral blue-black or stark pure black.

## Typography

**Display Font:** Alegreya Variable with Georgia fallback

**Body Font:** Atkinson Hyperlegible Next Variable with system sans-serif fallback

**Label/Mono Font:** Atkinson Hyperlegible Next Variable for labels; the system monospace stack for commands and checksums

**Character:** Alegreya gives headlines and controls the voice of written correspondence. Atkinson keeps privacy boundaries, release facts, and dense supporting copy easy to read.

### Hierarchy

- **Display** (470, `clamp(3.3rem, 4.7vw, 4.7rem)`, 1.01): The opening promise. Keep it to a short balanced block, normally no wider than 12 characters per line.
- **Headline** (560, `clamp(2.6rem, 5vw, 4.75rem)`, 0.98): Major section openings with tight leading and balanced wraps.
- **Title** (560, `2rem`, 0.98): Card headings, boundary labels, and compact editorial statements.
- **Body** (400, `1rem`, 1.55): Explanations and factual product copy. Long passages stay near 65 characters per line.
- **Action** (600, `1.2rem`, 1.2): Primary action labels in Alegreya. Sentence case keeps them literary rather than promotional.
- **Label** (650, `0.88rem`, 1.55): Transcript summaries, metadata, checksums, and compact process text.

### Named Rules

**The Two Voices Rule.** Alegreya speaks for invitations and section structure. Atkinson carries evidence and limits. Monospace appears only where the content is a command, checksum, or terminal recording.

## Layout

The page uses a 90rem maximum shell and generous vertical intervals. Major content groups narrow to 82rem through 94rem depending on how much room their composition needs. Desktop sections use asymmetric grids, usually a wider proof or paper field beside a narrower editorial counterpoint.

The opening scene is a composed overlap on wide screens. A hero fold, terminal fold, branch, courier, and process fold occupy one 62rem stage. At 68rem, the elements widen and restack inside a taller stage. At 46rem, every item returns to semantic document flow, the process becomes a single column, secondary navigation is reduced, and clipped silhouettes simplify without disappearing.

Spacing follows a loose editorial rhythm rather than a dense application grid. Control interiors use the smaller steps. Section gaps and paper padding use 2rem through 4rem, with larger fluid values where the fold needs breathing room. Text never depends on overlap, branch position, or rotation to preserve reading order.

**The Branch Behind Rule.** The branch may connect and frame sections, but it stays behind content and never crosses a paragraph, control, or focus outline.

## Elevation & Depth

Depth is a restrained hybrid of soft paper shadows, crease gradients, texture, rotation, and tonal layering. Paper folds share one broad ambient shadow. Terminal media and command blocks use slightly darker, tighter shadows. Flat text sections and dividers do not float.

### Shadow Vocabulary

- **Paper lift** (`0 22px 50px rgb(74 65 53 / 15%)`): Large washi folds only.
- **Action lift** (`0 10px 24px rgb(41 40 35 / 18%)`): The primary action at rest, with a slightly deeper shadow on hover and a tighter shadow when pressed.
- **Terminal proof** (`0 16px 35px rgb(41 40 35 / 20%)`): Recorded terminal media inside its paper fold.
- **Dark proof** (`0 12px 26px rgb(41 40 35 / 14%)`): Install command blocks against the page field.
- **Safety note** (`0 20px 42px rgb(41 40 35 / 20%)`): The charcoal safety panel that breaks from the paper field.

### Named Rules

**The Paper Owns the Shadow Rule.** Shadows describe a lifted sheet, proof block, or pressed action. Do not add shadow to ordinary text groups, dividers, or navigation.

## Shapes

The system has almost no rounded rectangles. Large panels use individually authored polygon silhouettes with clipped corners, uneven edges, and slight rotation. Fine diagonal gradients and borders suggest creases inside the sheet. The only true circle is a small status marker.

Supporting marks are also irregular. Principle markers skew like small folded slips, the branch uses rounded ink strokes, and the primary action is a clipped paper tab. Variations should preserve legibility and semantic order, not turn every object into a different novelty shape.

**The Fold, Don't Frame Rule.** A content container either behaves like a sheet of paper or stays flat in the page flow. Do not substitute generic rounded cards.

## Components

### Actions

- **Primary:** A deep-moss paper tab with warm light text, Alegreya labeling, a 3.25rem minimum height, and `0.75rem 1.25rem` padding. Its asymmetrical clipped outline replaces corner radius.
- **Hover / Focus:** Hover lifts the tab by 2px, darkens the moss, and deepens its shadow. Active state presses it down by 1px. Keyboard focus uses the shared 3px oxide outline with a 4px offset.
- **Text:** A strong moss text link with the ordinary link underline behavior unless its placement already supplies a clear interactive treatment.

### Cards / Containers

- **Corner Style:** Individually clipped polygon edges, usually with a rotation below 2 degrees.
- **Background:** Washi sheet for correspondence panels, terminal black for technical proof, and deep charcoal for the safety interruption.
- **Shadow Strategy:** Only lifted paper and proof blocks use the named shadows.
- **Border:** Fine branch-colored rules separate lists and suggest paper edges. They remain translucent.
- **Internal Padding:** Usually 2rem through 4rem, with fluid padding on large folds.

### Navigation

The wordmark sits on the left of a quiet top rule. Alegreya links sit on the right with generous spacing. Hover and keyboard focus draw a thin moss underline from left to right. On narrow screens, the middle link may hide while the download path stays available.

### Terminal proof

Terminal evidence uses warm parchment text on terminal black, a thin translucent border, and a compact shadow. Video remains a real recording with controls, poster, captions, fallback copy, and a visible transcript disclosure. Install commands use the same dark proof language and a system monospace stack.

### Disclosure rows

FAQ and transcript disclosures use native `details` and `summary`. Thin branch rules establish rhythm. The summary label is Alegreya for FAQ questions and a strong Atkinson label inside terminal evidence. The browser marker remains intact.

### Courier and branch

The branch is an authored, irregular SVG with round joins and a paper-aware brown. The supplied squirrel courier appears once, where delivery moves from promise to terminal proof. It is an event marker, not a mascot repeated around the page.

## Do's and Don'ts

### Do:

- **Do** use broad negative space and varied paper scale to establish hierarchy.
- **Do** keep text horizontal, crisp, and independent of decorative overlap.
- **Do** pair every terminal recording with controls, captions, fallback text, and a transcript.
- **Do** preserve visible focus and collapse transitions to `0.01ms` when reduced motion is requested.
- **Do** use the supplied wordmark and courier artwork without redrawing their identity.

### Don't:

- **Don't** turn the page into a dashboard, a stack of rounded SaaS cards, or a fake browser client.
- **Don't** add gratuitous entrance animation, parallax, drifting paper, or branch motion.
- **Don't** repeat the courier outside a meaningful delivery moment.
- **Don't** use Japanese pastiche, invented cultural claims, or decorative motifs that imply authenticity.
- **Don't** let texture, folds, branch strokes, or low contrast interfere with copy, controls, or verification data.
