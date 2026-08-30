---
name: Orifude
description: A private terminal letter exchange made tangible through warm paper, charcoal ink, and one quiet courier.
colors:
  ink: "#31312c"
  ink-soft: "#4f4d45"
  paper: "#f3efe8"
  paper-light: "#fbf8f1"
  paper-deep: "#d8d1c4"
  moss: "#5c5c4c"
  moss-deep: "#4d4d3c"
  clay: "#765f4f"
  ember: "#914e45"
  focus-oxide: "#7a3f38"
  proof: "#393a34"
  proof-ink: "#f3efe8"
typography:
  display:
    fontFamily: '"Alegreya Variable", Georgia, serif'
    fontSize: "clamp(2.75rem, 4.6vw, 4.35rem)"
    fontWeight: 470
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"Alegreya Variable", Georgia, serif'
    fontSize: "clamp(1.35rem, 1.8vw, 1.65rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  body:
    fontFamily: '"Atkinson Hyperlegible Next Variable", system-ui, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.58
  technical:
    fontFamily: 'ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
spacing:
  xs: "0.75rem"
  sm: "1rem"
  md: "1.25rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
  3xl: "4rem"
components:
  action-primary:
    backgroundColor: "{colors.moss-deep}"
    textColor: "{colors.paper-light}"
    typography: "{typography.title}"
    padding: "0.8rem 1.25rem"
    height: "3.5rem"
  action-primary-hover:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink}"
  paper-fold:
    backgroundColor: "{colors.paper-light}"
    textColor: "{colors.ink}"
  proof-panel:
    backgroundColor: "{colors.proof}"
    textColor: "{colors.proof-ink}"
  transcript-expanded:
    backgroundColor: "{colors.paper-light}"
    textColor: "{colors.ink}"
    padding: "1.25rem"
  artifact-action:
    backgroundColor: "{colors.moss}"
    textColor: "{colors.paper-light}"
    typography: "{typography.title}"
    padding: "0.9rem 1rem"
---

# Design System: Orifude

## Overview

**Creative North Star: "The letter in transit"**

Orifude makes a private exchange tangible through two folded sheets and the supplied squirrel courier moving between them. The opening places a human promise beside a real TUI recording. The rest of the site settles into a spacious editorial rhythm, so privacy limits, install paths, checksums, and release history read as plainly as the invitation.

Warm paper, charcoal ink, muted moss, and readable literary type give the site a handled quality without turning it into a scrapbook or period piece. Fold lines are sparse and structural. The courier appears once, and every decorative layer yields to text, controls, and product evidence.

**Key Characteristics:**

- Two quiet folded sheets hold the opening promise and the real TUI proof.
- Alegreya carries invitations and section structure; Atkinson Hyperlegible Next carries facts and limits.
- Warm paper and charcoal dominate, with moss for action and clay for quiet status.
- Long sections use open editorial grids rather than repeated cards.
- Release history uses one quiet introductory fold followed by flat editorial notes.
- The courier marks delivery once and never crosses copy, video controls, or focus outlines.

## Colors

The palette stays warm and low-chroma. Paper and charcoal carry most of the page, while moss, clay, and oxide appear only when they have a job.

### Primary

- **Deep moss:** The main action color and the footer field. Its weight makes an action clear without introducing a bright digital accent.
- **Muted moss:** Archive actions, scrollbar color, and other secondary active fields.

### Secondary

- **Clay brown:** Private-alpha copy and other quiet status language.
- **Ember:** Reserved for warning or destructive meaning. It is available to the system but does not decorate the shipped landing page.
- **Oxide focus:** The shared keyboard focus outline. It remains distinct from action color.

### Neutral

- **Charcoal ink:** Default copy and the strongest structural color.
- **Soft charcoal:** Supporting explanations and dense factual copy.
- **Warm paper:** The continuous textured page field and the browser theme color.
- **Light paper:** Fold faces, selected text, and expanded disclosure surfaces.
- **Deep paper:** Fold contrast, scrollbar track, and the primary action hover state.
- **Proof charcoal:** Install guidance, safety boundaries, and terminal media grounds.
- **Proof paper:** Text on proof charcoal.

### Named Rules

**The Paper and Ink Rule.** Paper and charcoal own the page. Moss marks actions, clay marks quiet status, and neither becomes decoration.

**The Warm Black Rule.** Use charcoal or proof charcoal. Do not introduce pure black or a blue-black neutral.

## Typography

**Display Font:** Alegreya Variable with Georgia fallback

**Body Font:** Atkinson Hyperlegible Next Variable with system sans-serif fallback

**Label/Mono Font:** The system monospace stack for commands, artifacts, and SHA-256 values

**Character:** Alegreya gives the correspondence its human voice without sacrificing readability at large sizes. Atkinson separates product facts from the invitation, while monospace stays tied to terminal and verification material.

### Hierarchy

- **Display** (470, `clamp(2.75rem, 4.6vw, 4.35rem)`, 1): Opening and section statements. Short statements should fit within two lines on their intended viewport.
- **Title** (600, `clamp(1.35rem, 1.8vw, 1.65rem)`, 1.15): Questions, actions, artifact labels, and compact editorial headings.
- **Body** (400, `1rem`, 1.58): Product explanations, privacy facts, status copy, commands, and checksums. Technical content changes to the monospace family without creating another size tier. The root is 18px and becomes 16px below 38rem.

### Named Rules

**The Two Voices Rule.** Alegreya speaks for the letter and page structure. Atkinson states product facts. Monospace appears only when the content is terminal or verification material.

**The Sentence Rule.** Headlines and controls use natural sentence copy. Do not stack slogans, add tiny uppercase kickers, or turn section introductions into fragments.

## Layout

The shared header is capped at 100rem. The opening uses an asymmetric two-column grid up to 94rem wide: a larger promise fold and a narrower proof fold, separated by enough room for the courier. Supporting sections usually use an 84rem editorial measure with a statement on one side and evidence on the other. The privacy section returns to a broad 94rem folded sheet. Its introduction uses a tighter two-column alignment, with the inset heading and explanation facing inward before the facts open into a wider pair below.

Spacing is generous and variable. Section gaps commonly grow from 7rem to 13rem, while panel padding grows from 2rem to 9rem. This scale change provides hierarchy without a page full of frames. The package-manager panel appears before the manual archive and checksum controls. On desktop, its heading and commands occupy the left column while installer disclosures occupy the right; the package explanation sits beneath those disclosures. The FAQ heading sits directly above a balanced two-column disclosure grid.

The changelog uses the same header, footer, page field, and 84rem editorial measure. A quiet folded introduction opens the route. Each release then uses a flat two-column reading layout with a sticky version header beside grouped notes. Release notes do not introduce a separate visual system.

At 58rem, the opening and content grids become a single semantic column, sticky copy returns to normal flow, and the FAQ becomes one column. The install panel reflows in semantic order: heading, commands, then installer disclosures and their explanation. Changelog releases also become a linear reading flow with static release headers. Section links leave the shared header while the Changelog and GitHub actions remain available. At 38rem, the root becomes 16px, fold padding tightens, and install content reaches the narrow viewport edge without clipping commands. Decorative folds flatten on narrow screens so they cannot crop text or controls. Text remains horizontal and readable at every size.

**The Clear Passage Rule.** The courier may rest between the two opening folds, but it never crosses text, the recording, controls, or a focus outline. Do not add a page-wide branch.

**The Evidence Order Rule.** Package-manager installation comes before installers, archives, and checksum verification. Preserve that sequence on every viewport.

## Elevation & Depth

The system uses shallow physical depth. Paper texture, fine crease lines, clipped silhouettes, slight rotation, and two soft shadows establish the material. There are no glows. Most content stays flat on the page, including the journey, principles, downloads introduction, FAQ heading, and disclosure grid.

### Shadow Vocabulary

- **Paper lift** (`0 1.5rem 3.5rem rgb(74 65 53 / 12%)`): Folded paper surfaces only.
- **Proof media** (`0 1rem 2.25rem rgb(32 31 27 / 20%)`): The real TUI recording within its fold.
- **Courier contact** (`drop-shadow(0 0.8rem 1rem rgb(49 49 44 / 14%))`): The single supplied courier cutout.

### Named Rules

**The Paper Owns the Shadow Rule.** Shadows explain physical overlap. Ordinary text groups, disclosure rows, navigation, and archive lists remain flat.

## Shapes

Large paper surfaces use a few asymmetrical polygon clips, slight rotations, and hairline diagonal crease gradients. The treatment is deliberately simple. It suggests a folded letter without turning each section into origami. The main action uses a restrained clipped-paper silhouette instead of rounded corners.

When the transcript opens, its containing proof sheet drops all rotation and clipping. The result is a flat, opaque, unrotated reading surface. FAQ disclosures stay rectangular and gain a light-paper field only while open. The system has no pills, generic rounded rectangles, or card-grid silhouette.

**The Fold, Don't Frame Rule.** Use a fold only for the opening letters or a major privacy boundary. Everything else stays in the page flow or uses one broad proof field.

## Components

### Actions

- **Primary:** A deep-moss clipped tab with light paper text, Alegreya labeling, a 3.5rem minimum height, and `0.8rem 1.25rem` padding.
- **Hover / Focus:** Hover swaps to deep paper with charcoal text. Keyboard focus uses a 3px oxide outline with a 5px offset. State feedback lasts 160ms and collapses under reduced motion.
- **Text:** Strong deep-moss body text with a conventional underline. It stays quieter than the install action.

### Folded sheets

- **Shape:** Each major sheet has its own restrained polygon silhouette and rotation of about one degree or less.
- **Background:** Light paper with repeated washi texture and two fine crease gradients.
- **Depth:** Use paper lift. Folds do not become a repeated card family.
- **Opening pair:** One fold carries the promise and primary action. One carries the real TUI recording and transcript.

### Terminal proof and transcript

The recording uses native video controls, a poster, fallback text, and an adjacent native transcript disclosure. It has no caption track because subtitles would obscure the short terminal recording. The complete text alternative remains immediately below the video. The proof remains real TUI evidence, never a redrawn terminal or browser mockup.

Opening the transcript removes clipping and rotation from the whole proof sheet, then gives the transcript a light-paper reading field with `1.25rem` padding. The change has no animation. The expanded state must remain opaque and text must not overlap or bleed outside its surface.

### Install and archive controls

The package-manager block is one broad proof-charcoal field. On desktop, the large literary heading and literal monospace commands sit on the left. Native disclosures for the verified POSIX and PowerShell installers sit on the right, with the package-manager explanation beneath them. Below 58rem, those groups become one column in the same semantic order. The manual archive section follows, grouped by operating system. Moss artifact actions pair architecture and format, while the full SHA-256 value remains visible below each action.

### Disclosure grid

The FAQ heading sits immediately above the disclosures. The disclosures form a balanced two-column grid with a modest row gap on wide screens and one column below 58rem. Native markers remain visible. Open rows use a light-paper background; closed rows stay flat on the page.

### Navigation and footer

The supplied wordmark anchors the left side of the shared header and always returns home. Section links target the landing-page journey and download anchors, so they work from either route, and reveal their underline on hover or focus. Changelog and GitHub use compact actions and remain visible at every supported width. Changelog takes the current-page treatment on its own route. Section links disappear below 58rem so the permanent actions fit without clipping. Both routes end with the same flat deep-moss footer, license statement, and project links.

### Changelog release notes

The changelog is a Read-mode route within the same warm-paper, charcoal, and muted-moss identity. One quiet folded introduction establishes the page, then release history returns to the page field. Each desktop release pairs a sticky version, date, and source link with flat grouped notes. Below 58rem, the header becomes static and the release reads from top to bottom in one column.

### Courier

Use the supplied squirrel courier once between the promise and proof folds. It is a delivery cue, not a repeated mascot. It ignores pointer input and stays clear of usable content.

## Do's and Don'ts

### Do:

- **Do** keep the opening promise and real TUI proof on two quiet folded sheets.
- **Do** use broad negative space and editorial grids to separate ideas.
- **Do** keep the courier clear of text, media controls, and focus outlines.
- **Do** flatten the proof sheet into an opaque, unrotated reading surface when its transcript opens.
- **Do** place package-manager installation before manual archives and SHA-256 verification.
- **Do** keep package commands left of installer disclosures on desktop, with the package explanation beneath the disclosures, then preserve their semantic order in one column on mobile.
- **Do** keep the privacy introduction compact and inward-facing before its wider facts.
- **Do** keep changelog release headers sticky beside flat notes on desktop and static above them on mobile.
- **Do** keep the FAQ heading directly above its two-column disclosure grid, then collapse that grid to one column on mobile.
- **Do** preserve native controls, visible focus, fallback text, the adjacent transcript, semantic order, and reduced-motion behavior.

### Don't:

- **Don't** add glows, a slogan stack, a rounded-card grid, or a page-wide branch.
- **Don't** make the website look or behave like a browser participant client.
- **Don't** rotate readable text, expanded transcripts, commands, or verification data.
- **Don't** repeat or redraw the courier.
- **Don't** add Japanese pastiche or imply that the coined name is a claim of cultural authenticity.
- **Don't** animate disclosure content, drifting paper, courier movement, or decorative folds.
