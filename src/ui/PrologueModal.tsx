import type { EpisodeModal } from "../engine/types";

// Codex-style briefing box shown before a gated episode's HEX intro. The
// player reads it and dismisses it; only then does HEX come online in the
// comms panel (store.releaseIntro()).

interface PrologueModalProps {
  modal: EpisodeModal;
  onClose: () => void;
}

export function PrologueModal({ modal, onClose }: PrologueModalProps) {
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
        <button className="prologue-begin" onClick={onClose} autoFocus>
          {modal.dismissLabel ?? "BEGIN ▸"}
        </button>
      </div>
    </div>
  );
}
