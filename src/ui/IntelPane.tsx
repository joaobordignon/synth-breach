import { store } from "../engine/gameStore";
import { useGame } from "../state/useGame";

// Mission intel: the briefing, the concept list (freeCodeCamp theory), and a
// live objective checklist + WARDEN anomaly gauge driven by the game store.

export function IntelPane() {
  useGame();
  const ep = store.episode;
  const objectives = store.objectiveStatus();
  const warden = store.wardenScore;
  const wardenPct = Math.min(100, Math.round(warden * 100));
  // Episode tools: the command NAMES only — a scaffold to insert, not the
  // answer. Flags/values are for the player to work out (try `<cmd> --help`).
  const tools = Object.keys(ep.commands).filter((n) => !ep.commands[n].hidden);

  return (
    <div className="panel intel-pane">
      <h3 className="glow-pink">📜 MISSION INTEL &amp; THEORY</h3>
      {ep.subnet && <p className="subnet-tag">{ep.subnet}</p>}
      <p className="briefing">{ep.briefing}</p>

      <h4 className="glow-cyan">Objectives</h4>
      <ul className="objective-list">
        {objectives.map((o, i) => (
          <li key={i} className={o.done ? "done" : ""}>
            [{o.done ? "✓" : " "}] {o.label}
          </li>
        ))}
      </ul>

      {tools.length > 0 && (
        <>
          <h4 className="glow-cyan">Tools (click to insert · try <code>&lt;cmd&gt; --help</code>)</h4>
          <div className="tool-chips">
            {tools.map((name) => (
              <button
                key={name}
                type="button"
                className="tool-chip"
                title={`Insert "${name} " — then add the flags/values yourself (or ${name} --help)`}
                onClick={() => store.fillInput(name + " ")}
              >
                {name}
              </button>
            ))}
          </div>
        </>
      )}

      <h4 className="glow-cyan">Concepts</h4>
      <ul className="concept-list">
        {ep.concepts.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      <h4 className="glow-cyan">WARDEN anomaly</h4>
      <div className="warden-gauge" aria-label={`anomaly ${warden.toFixed(2)}`}>
        <div
          className="warden-fill"
          style={{ width: `${wardenPct}%` }}
          data-high={warden >= 0.5}
        />
        <span className="warden-val">{warden.toFixed(2)}</span>
      </div>

      <p className="hint-tip">
        <code>&lt;cmd&gt; --help</code> explains a tool · <code>intel</code> → theory · <code>intel 2</code> → syntax · <code>intel 3</code> → deep walkthrough.
      </p>
      <p className="hint-tip">
        Select text + Ctrl/Cmd+C to copy · Ctrl/Cmd+V (or right-click) to paste values into the terminal.
      </p>
    </div>
  );
}
