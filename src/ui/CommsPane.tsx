import { useEffect, useRef, useState } from "react";
import { store } from "../engine/gameStore";
import { useGame } from "../state/useGame";
import { HexFace } from "./HexFace";
import { speak, primeVoice, isSpeaking, voiceSupported, cancelVoice } from "../voice";
import { nextTrack } from "../music";
import type { CommsEntry, CommsReply } from "../engine/types";

// The "old BBS comms server" side panel. New HEX transmissions arrive from the
// store, are revealed with a typewriter effect (and read aloud as they type
// when voice is on), and pulse the Guy Fawkes "face in code" while HEX speaks.
// At story beats, pre-written player replies are offered as clickable chips
// that post into the feed as YOU> and draw a tailored HEX response.

type Speaker = "hex" | "you";
interface Item {
  id: number;
  shown: string;
  full: string;
  done: boolean;
  speaker: Speaker;
}

const TICK_MS = 28;
const CHARS_PER_TICK = 2;

export function CommsPane() {
  useGame(); // re-render on music/voice setting changes
  const [items, setItems] = useState<Item[]>(() =>
    store.getComms().map((e) => ({ id: e.id, shown: e.text, full: e.text, done: true, speaker: e.speaker ?? "hex" })),
  );
  const [active, setActive] = useState(false);
  const [replies, setReplies] = useState<CommsReply[]>(() => store.getOfferedReplies());
  const feedRef = useRef<HTMLDivElement>(null);

  const queueRef = useRef<CommsEntry[]>([]);
  const typingRef = useRef<{ id: number; full: string; pos: number; speaker: Speaker } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function pump() {
    // Start the next queued line if idle.
    if (typingRef.current === null) {
      const next = queueRef.current.shift();
      if (!next) {
        stopTimer();
        return;
      }
      const speaker: Speaker = next.speaker ?? "hex";
      typingRef.current = { id: next.id, full: next.text, pos: 0, speaker };
      setItems((prev) => [...prev, { id: next.id, shown: "", full: next.text, done: false, speaker }]);
      if (speaker === "hex") {
        speak(next.text); // only HEX is voiced + animates the face
        setActive(true);
      }
    }
    const t = typingRef.current;
    t.pos = Math.min(t.full.length, t.pos + (reduced ? t.full.length : CHARS_PER_TICK));
    const shown = t.full.slice(0, t.pos);
    setItems((prev) => prev.map((it) => (it.id === t.id ? { ...it, shown } : it)));
    if (t.pos >= t.full.length) {
      setItems((prev) => prev.map((it) => (it.id === t.id ? { ...it, done: true } : it)));
      typingRef.current = null;
    }
  }

  function ensureTimer() {
    if (!timerRef.current) timerRef.current = setInterval(pump, TICK_MS);
  }

  useEffect(() => {
    const unsub = store.onComms((entry) => {
      queueRef.current.push(entry);
      if ((entry.speaker ?? "hex") === "hex") setActive(true);
      ensureTimer();
    });
    const unsubReplies = store.onReplies((r) => setReplies(r));
    // Hold the face "active" while HEX is typing or the voice is still speaking.
    const poll = setInterval(() => {
      const t = typingRef.current;
      setActive((t !== null && t.speaker === "hex") || isSpeaking());
    }, 220);
    return () => {
      unsub();
      unsubReplies();
      clearInterval(poll);
      stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items]);

  // Click the feed to skip the typewriter: finish everything instantly.
  function skip() {
    cancelVoice();
    const pending = queueRef.current.splice(0);
    const current = typingRef.current;
    typingRef.current = null;
    stopTimer();
    setItems((prev) => {
      const completed = prev.map((it) =>
        current && it.id === current.id ? { ...it, shown: it.full, done: true } : it,
      );
      const extra: Item[] = pending.map((e) => ({
        id: e.id,
        shown: e.text,
        full: e.text,
        done: true,
        speaker: e.speaker ?? "hex",
      }));
      return [...completed, ...extra];
    });
    setActive(false);
  }

  const voiceOn = store.profile.voiceEnabled;
  const musicOn = store.profile.musicEnabled;

  function toggleVoice() {
    const next = !voiceOn;
    store.setVoiceEnabled(next);
    if (next) {
      // Unlock + confirm audio within this click gesture.
      const last = items[items.length - 1];
      primeVoice(last ? last.full : "HEX online.");
    }
  }

  return (
    <div className="panel comms-pane">
      <div className="comms-header">
        <span className="glow-green">◉ COMMS // HEX</span>
        <span className="comms-status">{active ? "LIVE" : "ONLINE"}</span>
      </div>

      <HexFace active={active} />

      <div className="comms-feed" ref={feedRef} onClick={skip} title="click to skip typing">
        {items.length === 0 ? (
          <p className="muted">// awaiting transmission…</p>
        ) : (
          items.map((e) => (
            <div key={e.id} className={`comms-line ${e.speaker === "you" ? "you" : ""}`}>
              <span className="comms-caret">{e.speaker === "you" ? "YOU>" : "HEX>"}</span> {e.shown}
              {!e.done && <span className="comms-cursor">▋</span>}
            </div>
          ))
        )}
      </div>

      {replies.length > 0 && (
        <div className="comms-replies">
          <div className="comms-replies-label">▸ respond:</div>
          {replies.map((r, i) => (
            <button
              key={i}
              type="button"
              className="comms-reply"
              onClick={() => {
                skip(); // flush any still-typing HEX backlog so the reply is immediate
                store.chooseReply(i);
              }}
            >
              {r.text}
            </button>
          ))}
        </div>
      )}

      <div className="comms-controls">
        <button
          className={`comms-btn ${voiceOn ? "on" : ""}`}
          onClick={toggleVoice}
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
        <div className="comms-music-row">
          <input
            className="comms-volume"
            type="range"
            min={0}
            max={100}
            defaultValue={Math.round(store.profile.musicVolume * 100)}
            onChange={(e) => store.setMusicVolume(Number(e.target.value) / 100)}
            aria-label="music volume"
          />
          <button className="comms-skip" onClick={() => nextTrack()} title="Next track">
            ⏭
          </button>
        </div>
      )}
    </div>
  );
}
