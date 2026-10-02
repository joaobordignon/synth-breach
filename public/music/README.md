# Background music

The player (`src/music.ts`) plays a **cycling playlist** of the audio files in
this folder: the set is shuffled, each track advances to the next when it ends,
and the playlist loops. If this folder has no audio files (or the browser can't
play them), it falls back to the built-in generative synthwave engine — so
music always works.

The track list is generated automatically at build time by
`scripts/gen-playlist.mjs` (runs before `npm run dev` / `npm run build`), which
writes `playlist.json` from whatever audio files are here. **You never edit a
list by hand — just add files.**

## Add tracks (up to as many as you like)

1. Grab royalty-free synthwave from <https://pixabay.com/music/search/synthwave/>
   (Pixabay's license is free for commercial use, no attribution required).
2. Drop the files straight into this folder, any names, e.g.:

   ```
   public/music/synthwave-01.mp3
   public/music/synthwave-02.mp3
   ...
   public/music/synthwave-10.mp3
   ```

   Supported: `.mp3`, `.ogg`, `.m4a`, `.wav`, `.flac`.
3. Commit & push. The GitHub Pages build regenerates `playlist.json` and the
   player cycles through all of them. In-game: **♪ MUSIC** toggles playback and
   **⏭** skips to the next track.

## Current tracks

Royalty-free synthwave from [Pixabay](https://pixabay.com/music/search/synthwave/)
(free for commercial use, no attribution required — credited here anyway):

- delosound — *Inspiring Motivation Synthwave* (two tracks)
- nickpanek — *Chill Synthwave*
- lofidreams — *Midnight Run*
- hitslab — *Synthwave Retro Music*
- turtlebeats — *Dark Synthwave / Neon Nights*
- lnplusmusic — *Synthwave 80s Retro Background Music*
- arpmedia — *Synthwave Retro 80s*
- alex-morgan — *Neon Synthwave Drive* / *Neon Drive Horizon*
- zephiramusic — *Lofi Synthwave*
