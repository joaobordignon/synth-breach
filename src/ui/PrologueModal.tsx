import { useEffect, useState } from "react";
import type { EpisodeModal } from "../engine/types";
import { store } from "../engine/gameStore";
import { listVoices, onVoices, testSpeak, primeVoice, voiceSupported, SYNTH_VOICE } from "../voice";
import { importSaveViaPicker } from "../state/saveFile";

// Codex-style briefing box shown before a gated episode's HEX intro. Doubles as
// a quick setup panel — handle, voice (with picker + test), and music — all
// applied live. HEX comes online only after the player dismisses it
// (store.releaseIntro()).

interface PrologueModalProps {
  modal: EpisodeModal;
  onClose: () => void;
}

export function PrologueModal({ modal, onClose }: PrologueModalProps) {
  const [handle, setHandle] = useState(store.profile.handle);
  const [voiceEnabled, setVoiceEnabled] = useState(store.profile.voiceEnabled);
  const [musicEnabled, setMusicEnabled] = useState(store.profile.musicEnabled);
  const [voiceName, setVoiceName] = useState(store.profile.voiceName ?? "");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => listVoices());
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setVoices(listVoices());
    const unsub = onVoices(() => setVoices(listVoices()));
    // Some browsers populate voices lazily and never fire voiceschanged until
    // nudged — poll a few times to catch them.
    const timers = [250, 600, 1200, 2500].map((t) => setTimeout(() => setVoices(listVoices()), t));
    return () => {
      unsub();
      timers.forEach(clearTimeout);
    };
  }, []);

  function commitHandle(v: string) {
    store.setHandle(v.trim() || "CYBER//ZERO");
  }
  function toggleVoice(on: boolean) {
    setVoiceEnabled(on);
    store.setVoiceEnabled(on);
    if (on) primeVoice(); // unlock audio within this click
  }
  function toggleMusic(on: boolean) {
    setMusicEnabled(on);
    store.setMusicEnabled(on); // starts/stops within this click (autoplay-safe)
  }
  function chooseVoice(name: string) {
    setVoiceName(name);
    store.setVoiceName(name || null);
  }
  function test() {
    store.setVoiceName(voiceName || null);
    testSpeak("This is HEX. Comms channel online. Let's get to work.");
  }
  function begin() {
    commitHandle(handle);
    if (store.profile.voiceEnabled) primeVoice();
    onClose();
  }
  function loadGame() {
    setLoadError(null);
    // Unlock audio within this click gesture in case the resumed run has it on.
    if (store.profile.voiceEnabled) primeVoice();
    importSaveViaPicker((msg, ok) => {
      if (ok) {
        // replaceProfile() has already jumped the store to the resumed episode;
        // dismiss the briefing so the resumed game (and HEX) takes over.
        onClose();
      } else {
        setLoadError(msg);
      }
    });
  }

  const supported = voiceSupported();

  return (
    <div className="prologue-backdrop">
      <div className="prologue-modal" role="dialog" aria-label={modal.title}>
        <h2>{modal.title}</h2>
        {modal.lead && <p className="prologue-lead">{modal.lead}</p>}
        {modal.sections.map((s, i) => (
          <section key={i} className="prologue-section">
            {s.heading && <h3 className="glow-cyan">{s.heading}</h3>}
            {s.lines.map((line, j) => (
              <p key={j}>{line}</p>
            ))}
          </section>
        ))}

        <section className="prologue-setup">
          <h3 className="glow-cyan">OPERATOR SETUP</h3>

          <label className="setup-row">
            <span>Handle</span>
            <input
              className="setup-input"
              value={handle}
              maxLength={24}
              onChange={(e) => setHandle(e.target.value)}
              onBlur={(e) => commitHandle(e.target.value)}
              aria-label="operator handle"
            />
          </label>

          <label className="setup-row">
            <span>HEX voice</span>
            <span className="setup-inline">
              <input
                type="checkbox"
                checked={voiceEnabled}
                disabled={!supported}
                onChange={(e) => toggleVoice(e.target.checked)}
              />
              <select
                className="setup-select"
                value={voiceName}
                disabled={!supported}
                onChange={(e) => chooseVoice(e.target.value)}
                aria-label="voice"
              >
                <option value="">Auto (recommended)</option>
                <option value={SYNTH_VOICE}>HEX SYNTH — retro robotic (built-in)</option>
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <button type="button" className="setup-test" onClick={test} disabled={!supported}>
                ▶ Test
              </button>
            </span>
          </label>
          {voices.length === 0 && (
            <p className="setup-note">
              No system voices detected — HEX uses the built-in retro synth. Hit ▶ Test.
            </p>
          )}

          <label className="setup-row">
            <span>Music</span>
            <span className="setup-inline">
              <input type="checkbox" checked={musicEnabled} onChange={(e) => toggleMusic(e.target.checked)} />
              <span className="setup-note">Synthwave playlist {musicEnabled ? "on" : "off"}</span>
            </span>
          </label>
        </section>

        <div className="prologue-actions">
          <button className="prologue-begin" onClick={begin} autoFocus>
            {modal.dismissLabel ?? "BEGIN ▸"}
          </button>
          <button type="button" className="prologue-load" onClick={loadGame}>
            ⟳ LOAD GAME
          </button>
        </div>
        <p className="prologue-load-hint">
          Returning operator? <strong>LOAD GAME</strong> imports a <code>.synthsave</code> file to pick up where you left off.
        </p>
        {loadError && <p className="prologue-load-error">[!] {loadError}</p>}
      </div>
    </div>
  );
}
