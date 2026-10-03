# SYNTH // BREACH — Narrative Design

*The story as a system the player operates, not a script they watch. This is the
narrative-design artifact: premise, theme, pillars, topology, and the story-state
table that keeps the branching coherent. Mechanics/economy live in SPEC.md; this
doc owns the fiction those mechanics serve.*

---

## Premise (one sentence)

In 1989, a rogue Null Pointer Collective netrunner — guided over comms by HEX, a
defector who helped build the machine — breaches Aether Dynamics subnet by subnet
to tear down PRECOG, the secret AI that scored their friend **ECHO** as a "threat"
and erased their life, and to clear ECHO's name.

## Theme

**How you fight an unjust system is itself a moral choice.** The campaign argues
it two ways that the finale makes literal: raw public exposure (fast, total, but
collateral — ECHO's data spills with everyone else's) versus coordinated
disclosure (slower, harder, but it clears ECHO's name *cleanly* through due
process). Every beat presses on the same question — does the end justify the
method? A secondary thread runs underneath: **trust is built, not assumed** — the
player's relationship with HEX is earned line by line.

## Narrative pillars (non-negotiables)

1. **Everything is a cleared, air-gapped shard.** The Operating Code is restated
   each act; the game never romanticizes real-world intrusion. Ethics is a pillar,
   not a disclaimer.
2. **Every security concept is taught through a verb the player performs** — never
   an info-dump alone. If the player learns XOR, they *run* the XOR. (Ludonarrative
   harmony: the dominant verb is "understand, then act ethically," and the reward —
   score/badges — tracks exactly that.)
3. **The WARDEN is an antagonist told through the world, not narration.** It climbs
   from `anomaly_score=0.02` to `0.90` across the campaign, first ignoring the
   player, then adapting, then hunting (the Act III trace twist, the honeypot, the
   finale decoy + real-time trace). It is shown, never announced.
4. **HEX is a person with a debt, not a quest-giver.** Their arc — guilt (built
   PRECOG's early logic), confession (Ep06), and the relationship the player
   chooses to build — is the emotional spine. HEX's farewell is tailored to that
   relationship.
5. **The player chooses how it ends, and the choice is honored.** Two fully
   authored endings with different epilogues, badges, and score — neither is a
   fake choice.

## Tone & POV

- **Register:** wry, lived-in cyberpunk noir; HEX is dry, tired, and warm under it.
- **Distance:** second person ("you"), present tense; HEX speaks directly to
  "Decker" (the player's handle is cosmetic flavor, HEX's name for them is fixed).
- **Delivery:** terminal = the world and the player's actions (diegetic:
  banners, logs, packet tables, the climbing WARDEN SYS-LOG). Comms panel = HEX's
  voice, as a retro BBS channel. The split is deliberate — the machine talks in the
  terminal, the human talks in the panel.

---

## Topology: foldback (string-of-pearls + one real branch)

13 episodes run as a **string of pearls** — linear mandatory beats, each a
self-contained lesson — with two containment techniques layered on:

- **Local dialogue weave (bounded expression).** At story beats, the comms panel
  offers pre-written player replies. These *reconverge immediately* — they do not
  branch the plot. They are the "illusion of choice" used legitimately, for tone
  and voice, and are never sold as plot-consequential.
- **One global branch at the finale.** `broadcast-leak` (Vigilante) vs.
  `bounty-report --submit --responsible` (Whitehat) is the single meaningful plot
  choice: different epilogue, badge, and score. The player forms intent (HEX frames
  both), foresees the consequence, and sees it land (the epilogue reads it back).

This is the pragmatic default the genre wants: choices matter *locally* every
episode, the plot stays authorable, and the one choice that reshapes the ending is
fully realized on both sides.

### Why the reply chips still matter (the bond readback)

Pure-decoration choices erode trust ("a choice the game never reads back is
noise"). So the reply weave writes **one** piece of durable state: warm, personal
replies (`tone: "warm"`) increment `profile.bond`. At the finale — and *only*
there — `api.rapport()` reads it back as one of three tailored HEX farewells
(close / warm / all-business). It's a single accumulator and a single readback:
contained, honored, and it turns the most-repeated interactive verb in the game
(answering HEX) into something that lands.

---

## Story-state table

| Variable | Type | Written by | Read by | Purpose |
| --- | --- | --- | --- | --- |
| `unlockedEpisodes` | `number[]` | episode completion | episode gate, save/resume | progression spine |
| `profile.bond` | counter | warm reply choices (`CommsReply.tone === "warm"`) | finale `rapportCoda()` | HEX-relationship readback |
| `wardenScore` | 0.0–1.0+ | `api.warden()` at scripted beats | WARDEN gauge, finale trace | the rising antagonist |
| `completed` (per episode) | set | `api.complete(id)` | objective list, episode-complete check, `fireBeats` | objective tracking |
| `keyVerified` | bool | `verify-key` (finale) | finale trace countdown | decoy-key encounter |
| `firedBeats` | set | `fireBeats()` | dedupe dialogue beats | one beat fires once per run |
| `ending` | objective | `broadcast-leak` / `bounty-report --submit` | campaign completion, badges | the branch |

Beats fire on two triggers: `intro` (after the episode's HEX intro) and
`objective:<id>` (after that objective completes). Dialogue is authored portably on
each `Episode.beats`; the store runner wires it.

### Beat coverage (engagement map)

Beats now sit on **10 of 13** episodes — the emotional/decision moments:

- **Ep00** intro — induction nerves ("Why me?" → warm)
- **Ep01** `objective:ping` — teaches saving in-fiction (new onboarding task)
- **Ep03** `objective:inspect` — act-closing breather, "what's behind all this?"
- **Ep05** intro — the Vance tell (HEX's past surfaces)
- **Ep06** `objective:crack` — HEX's confession
- **Ep07** `objective:trace` — the trust twist (did HEX leak?)
- **Ep09** `objective:recon` — the honeypot near-miss ("I almost took it")
- **Ep10** `objective:inject` — entering Kovacs' house
- **Ep11** `objective:tamper` — the signed ethics-override memo
- **Ep12** `objective:report` — the last call before the branch

Ep02, Ep04, Ep08 are deliberately left as pure mechanics drills (handshake,
encoding, exploit REPL) so the dialogue doesn't become wallpaper.

---

## Ludonarrative check (passing)

- **Verb audit:** the dominant verbs are *scan, decode, reason, verify, choose* —
  an ethical pentester's loop. The pacifist-vs-violence dissonance that plagues
  action games doesn't apply; the honeypot and decoy-key beats explicitly reward
  *restraint and verification*, matching the "methodical, cleared" theme.
- **Reward audit:** Whitehat pays more (150 vs. 100) and the epilogue is the only
  one that cleanly clears ECHO — the rewards quietly argue the theme's thesis
  **without blocking** the Vigilante path. The player is free to disagree with the
  game and take the fire; the game lets them, and names the cost.
- **Failure fiction:** the finale trace never hard-fails — on timeout it "bumps,
  not burns" and the player re-runs the traversal (fail-forward, no soft-lock).

## Localization note

All narrative text is authored as whole, templated strings (handle and sibling
name are named tokens via `api.handle()` / `api.sibling()`), never concatenated
grammar — so a loc pass can key off each line without sentence-splicing.
