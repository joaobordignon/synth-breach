import { useEffect, useRef, useState } from "react";
import { store } from "../engine/gameStore";
import { useGame } from "../state/useGame";
import { HexFace } from "./HexFace";
import { speak, isSpeaking, voiceSupported } from "../voice";
import type { CommsEntry } from "../engine/types";

// The "old BBS comms server" side panel: HEX's Guy Fawkes visualizer up top,
// then a scrolling transmission feed. New HEX lines arrive here (routed out of
// the terminal), are optionally read aloud, and pulse the face while speaking.

export function CommsPane() {
  useGame(); // re-render on music/voice setting changes
  const [entries, setEntries] = useState<CommsEntry[]>(() => [...store.getComms()]);
  const [active, setActive] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const decayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = store.onComms((entry) => {
      setEntries((prev) => [...prev.slice(-299), entry]);
      setActive(true);
      speak(entry.text);
      if (decayRef.current) clearTimeout(decayRef.current);
      decayRef.current = setTimeout(() => setActive(false), 2800);
    });
    // Keep the face "transmitting" for as long as the voice is actually speaking.
    const poll = setInterval(() => {
      if (isSpeaking()) setActive(true);
    }, 250);
    return () => {
      unsub();
      clearInterval(poll);
      if (decayRef.current) clearTimeout(decayRef.current);
    };
  }, []);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  const voiceOn = store.profile.voiceEnabled;
  const musicOn = store.profile.musicEnabled;

  return (
    <div className="panel comms-pane">
      <div className="comms-header">
        <span className="glow-green">◉ COMMS // HEX</span>
        <span className="comms-status">{active ? "LIVE" : "ONLINE"}</span>
      </div>

      <HexFace active={active} />

      <div className="comms-feed" ref={feedRef}>
        {entries.length === 0 ? (
          <p className="muted">// awaiting transmission…</p>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="comms-line">
              <span className="comms-caret">HEX&gt;</span> {e.text}
            </div>
          ))
        )}
      </div>

      <div className="comms-controls">
        <button
          className={`comms-btn ${voiceOn ? "on" : ""}`}
          onClick={() => store.setVoiceEnabled(!voiceOn)}
          disabled={!voiceSupported()}
          title={voiceSupported() ? "Toggle HEX voice narration" : "Voice not supported in this browser"}
        >
          {voiceOn ? "🔊 VOICE ON" : "🔈 VOICE OFF"}
        </button>
        <button
          className={`comms-btn ${musicOn ? "on" : ""}`}
          onClick={() => store.setMusicEnabled(!musicOn)}
          title="Toggle synthwave background music"
        >
          {musicOn ? "♪ MUSIC ON" : "♪ MUSIC OFF"}
        </button>
      </div>
      {musicOn && (
        <input
          className="comms-volume"
          type="range"
          min={0}
          max={100}
          defaultValue={Math.round(store.profile.musicVolume * 100)}
          onChange={(e) => store.setMusicVolume(Number(e.target.value) / 100)}
          aria-label="music volume"
        />
      )}
    </div>
  );
}
