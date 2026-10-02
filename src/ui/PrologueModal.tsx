import { useEffect, useState } from "react";
import type { EpisodeModal } from "../engine/types";
import { store } from "../engine/gameStore";
import { listVoices, onVoices, testSpeak, primeVoice, voiceSupported } from "../voice";

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

  useEffect(() => {
    setVoices(listVoices());
    return onVoices(() => setVoices(listVoices()));
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
          {!supported && <p className="setup-note">Your browser has no speech voices available.</p>}

          <label className="setup-row">
            <span>Music</span>
            <span className="setup-inline">
              <input type="checkbox" checked={musicEnabled} onChange={(e) => toggleMusic(e.target.checked)} />
              <span className="setup-note">Synthwave playlist {musicEnabled ? "on" : "off"}</span>
            </span>
          </label>
        </section>

        <button className="prologue-begin" onClick={begin} autoFocus>
          {modal.dismissLabel ?? "BEGIN ▸"}
        </button>
      </div>
    </div>
  );
}
