# KeyHero project plan

## Product

A desktop browser rhythm typing game: choose a song and press random letter targets when their falling lights reach the hit line. Sustained notes require holding a letter. Players improve timing, typing accuracy, and combo streaks across repeated runs.

Planning assumptions: single-player first, physical keyboard, random A–Z targets, manually charted rhythms, local scores, and a React + TypeScript frontend. These are proposed defaults, not settled product requirements.

## Core gameplay

1. Choose a song and difficulty; see duration, tempo, and chart intensity.
2. Load audio and chart, optionally calibrate timing, and show a count-in.
3. Display a small set of fixed lanes above a stationary horizontal hit line. Each approaching light carries its required random letter.
4. Lights descend through the lanes. Read each target independently and press its displayed letter when it reaches the hit line.
5. Show immediate Perfect, Good, Early, Late, or Miss feedback, score, and combo.
6. Continue through the complete song, then show accuracy, timing distribution, misses, maximum combo, and personal best.

### Layout and readability

- Use large monospace letters on falling targets; the song does not provide the text.
- Start with four fixed visual lanes. Lanes provide spacing, not fixed key bindings: any lane can carry any allowed letter.
- Each target is independent, including repeated letters. Avoid simultaneous tap onsets in the MVP so players can focus on one new keystroke at a time.
- Show roughly two seconds of approaching notes; adjust this during playtesting.
- Keep lane positions fixed throughout a run. Never change a target’s assigned letter after it appears.
- Show a hold as a lettered head with a trailing bar; reserve its lane until the hold finishes.
- Show success with a shape or fill change as well as color. Offer reduced effects and adjustable text size before a run.
- Chart instrumental and vocal sections alike, following percussion, melody, or other clear musical accents.

### Input rules

- Case-insensitive A–Z initially, without spaces, punctuation, or word completion.
- Tap: a fresh keydown matches the nearest eligible unjudged note with that letter inside the timing window; break ties by chart order.
- Hold: press at its start and keep the key down until the tail reaches the hit line. Award onset points and duration credit separately. Early release loses remaining sustain credit; release after the end carries no extra penalty.
- Ignore operating-system key-repeat events. A held key cannot trigger later taps; the player must release and press again.
- Wrong keys break combo and record an error without consuming an unrelated note. Early keys outside the window do not skip ahead.
- A missed note expires automatically so the chart continues. Backspace cannot rewind the song.
- Authoring validation rejects overlapping holds on the same letter and taps that require a fresh press of a currently held letter.
- Pause on focus loss and clear pressed-key state. Resume with a count-in; interrupted holds restart through a short practice rewind, with the run marked assisted.

### Difficulty and scoring

The core mode uses random individual letters. Easy uses a small home-row letter pool, sparse beats, and few holds. Normal expands the pool and uses more musical subdivisions. Hard uses A–Z, denser rhythms, and more holds. Slower playback is available in practice. Letter pools and rhythm density are explicit difficulty settings.

Starting timing windows to tune through playtesting: Perfect within 45 ms, Good within 90 ms, and an outer hit window of 140 ms. Timing offsets apply before judgment. These values are hypotheses, not standards.

Start with 100 points for Perfect and 70 for Good, plus a capped combo multiplier. Holds split their available points between onset and successfully sustained duration. Normalize results against the chart's maximum points. Report wrong-key count and rhythm accuracy separately so spamming cannot improve the apparent result. Show successful keystrokes per second and per-letter accuracy rather than word-based speed, since targets are not words.

## Song charts: the essential content pipeline

Audio and rhythm charts are separate assets. Author tap onsets and hold durations to match recognizable beats and melody. Assign random letters independently of lyrics. Use a seeded generator constrained by the difficulty’s letter pool, minimum same-key spacing, active holds, and lane occupancy. Generate the complete validated target sequence before playback. Store the seed and generator version so retries reproduce the same challenge; a new seed starts a separate variation. Curated challenge seeds allow fair score comparisons.

Use original or appropriately licensed audio for the initial catalog. Include content permission/provenance metadata as a release requirement.

Suggested versioned chart structure:

```ts
type Note = {
  id: string;
  lane: number;         // fixed visual column
  key: string;          // seeded letter assignment resolved before play
  timeMs: number;        // onset relative to decoded audio start
  durationMs: number;    // zero for taps
};

type SongChart = {
  schemaVersion: number;
  songId: string;
  chartId: string;
  chartVersion: number;
  title: string;
  artist: string;
  audioUrl: string;
  durationMs: number;
  difficulty: 'easy' | 'normal' | 'hard';
  tempoMap: { timeMs: number; bpm: number }[];
  letterPool: string[];
  seed: string;
  generatorVersion: number;
  notes: Note[];
};
```

Store note onsets as explicit timestamps even when tempo changes. Keep chart audio alignment, player input calibration, and visual calibration as separate offsets. Validate sorted timestamps, unique IDs, allowed letters, lane occupancy, audio bounds, and impossible input patterns before playback.

Build the first short chart directly in JSON. Once gameplay feels good, build a small editor with audio playback, waveform/beat grid, rhythm note placement, letter-pool/seed controls, tap-to-record timestamps, hold editing, playback preview, validation, and JSON export. Automatic beat detection can suggest timing later; every playable rhythm chart still needs review.

## Frontend architecture

Use the existing React + TypeScript + Vite app. React owns menus, song selection, settings, and results. A game engine owns the clock, note states, input judgment, and scoring. Keep per-frame state outside React and publish HUD summaries at a limited frequency.

Render the playfield with HTML Canvas 2D, using one lane layout for lettered lights, sustain bars, and the hit line. Use ordinary DOM controls for navigation and settings.

Suggested modules:

```text
src/
  app/             navigation and screen composition
  screens/         song selection, play, results, settings
  game/            transport, judgment, scoring, input, note lifecycle
  rendering/       playfield layout and Canvas renderer
  charts/          chart types, loading, validation
  audio/           Web Audio playback and calibration
  storage/         settings and local best scores
public/songs/      catalog, audio, and chart JSON
```

### Timing and playback

Use Web Audio as the timing authority. Schedule the audio start and derive song position from the audio timeline, tracking playback speed, pause position, and calibration. requestAnimationFrame renders the current position; it must never advance the song clock by counting frames.

Map input event timestamps into the audio time domain. Where available, getOutputTimestamp connects audio output time to performance time; maintain a calibrated fallback. Compute each note's vertical position from its remaining time to hit, rather than accumulating movement every frame. This keeps visual position stable after a slow frame.

Create/resume audio from the user's Play interaction, load and decode before count-in, and recreate the source when restarting or seeking. Add slower playback in practice mode; account for its effect on pitch unless a separate pitch-preserving implementation is introduced.

Reference: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp

### State and persistence

Screen flow: song selection → loading → count-in → playing ↔ paused → results. Include a recoverable loading-error state.

Note lifecycle: upcoming → hittable → hit/holding → completed, or missed/broken.

Store settings and personal bests locally. Identify scores by song, chart version, seed, generator version, letter pool, difficulty, speed, and assistance settings. No backend is necessary for the first playable release. Accounts and authoritative leaderboards are a later project.

## Delivery sequence

### 1. Prove the interaction

Create an original 30–60 second track or test clip and one hand-authored chart. Implement audio playback, fixed lanes, random lettered targets, taps, and basic timing feedback.

Exit: a player can recognize individual targets and reliably feel that correct keystrokes match the music. Test repeated letters, dense note sequences, silence, and slow frames before adding features.

### 2. Complete the rhythm engine

Add constrained seeded letter generation, holds, wrong-key handling, combo, automatic misses, restart, pause/focus handling, and input/visual calibration. Separate deterministic judgment logic from rendering.

Exit: notes receive exactly one result, held keys cannot farm points, pause does not shift timing, and a frame stall does not change song position.

### 3. Ship the MVP loop

Add a small catalog of three cleared songs, song selection, chart difficulty, settings, results, and local bests. Include an onboarding practice chart that teaches taps and holds.

Exit: a new player can choose a song, complete a run, understand the result, and replay without developer intervention.

### 4. Make content production repeatable

Build the chart editor, chart validator, and practice section looping. Playtest chart density and timing windows with multiple typing skill levels.

Exit: another person can author and validate a playable song without editing the engine.

### 5. Expand after the core feels good

Consider ghost races, asynchronous challenges, achievements, accounts, and leaderboards. Live multiplayer needs shared song/chart identity and synchronized starts; scoring validation and cheating controls need their own design. Automatic chart generation follows a proven manual content workflow.

## Verification

- Unit tests for judgment-window boundaries, repeated letters, wrong keys, one judgment per note, sustain credit, early release, and score caps.
- Transport tests for pause/resume, restart, calibration signs, playback speed, and timestamp conversion.
- Validator fixtures for malformed charts and unplayable same-key combinations.
- Manual end-to-end checks in target desktop browsers: audio startup, focus loss, resize, key repeat, audio device changes, low frame rate, and full-song drift.
- Playtests answer the main product question: can players recognize letters and track lights without losing the beat? If not, increase target legibility and lower density before adding visual effects.

## MVP boundaries and principal risks

MVP includes single-player desktop play, curated songs, random letter targets, tap/hold input, calibration, scoring, and local results. Defer mobile keyboards, arbitrary song uploads, automatic beat charting, live multiplayer, public leaderboards, and streaming-service integration.

The largest risks are unreadable target density, unfair random sequences or musically awkward note timing, device latency, and time spent authoring quality charts. The first short playable chart is the gate for further development. Prove it feels fun before investing in the catalog or backend.
