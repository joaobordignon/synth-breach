import { store } from "../engine/gameStore";
import { useGame } from "../state/useGame";
import { AuthBar } from "./AuthBar";

const ACT_LABEL = ["PROLOGUE", "ACT I", "ACT II", "ACT III", "ACT IV"];

export function Header() {
  useGame();
  const ep = store.episode;
  const score = store.profile.score;
  const muted = store.profile.audioMuted;

  return (
    <div className="panel header">
      <span className="glow-pink">
        ⚡ SYNTH // BREACH [{ACT_LABEL[ep.act]} — {ep.title.toUpperCase()}]
      </span>
      <span className="header-right">
        <AuthBar />
        <span className="glow-cyan">{store.profile.handle}</span>
        <span className="glow-cyan">SCORE {score}</span>
        <span title="audio">{muted ? "🔇" : "🔊"}</span>
      </span>
    </div>
  );
}
