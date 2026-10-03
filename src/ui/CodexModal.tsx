import { useEffect, useRef, useState } from "react";
import { store } from "../engine/gameStore";
import { CODEX_TOPICS, resolveCodexQuery, type CodexTopicData } from "../codex";

const TOPICS = CODEX_TOPICS;

interface CodexModalProps {
  open: boolean;
  onClose: () => void;
  /** A `codex <query>` argument — a topic, command, or term to jump to. */
  query?: string | null;
  /** Bumped each time the modal is opened, so a repeated query still re-resolves. */
  queryNonce?: number;
}

export function CodexModal({ open, onClose, query, queryNonce }: CodexModalProps) {
  const suggested = store.episode.codexTopic ?? "networking";
  const [active, setActive] = useState(suggested);
  const [highlight, setHighlight] = useState<string[]>([]);
  const firstHitRef = useRef<HTMLDetailsElement>(null);

  // Resolve `codex <query>` to a tab + entries to highlight whenever the modal
  // is (re)opened. F1 / no-query opens to the current episode's topic.
  useEffect(() => {
    if (!open) return;
    if (query) {
      const r = resolveCodexQuery(query);
      if (r) {
        setActive(r.topic);
        setHighlight(r.highlight);
        return;
      }
    }
    setActive(store.episode.codexTopic ?? "networking");
    setHighlight([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, queryNonce]);

  // Scroll the first highlighted entry into view.
  useEffect(() => {
    if (open && highlight.length > 0) firstHitRef.current?.scrollIntoView({ block: "center" });
  }, [open, highlight]);

  if (!open) return null;

  const topic: CodexTopicData = TOPICS.find((t) => t.topic === active) ?? TOPICS[0];
  let hitAssigned = false;

  return (
    <div className="codex-modal" role="dialog" aria-label="Codex reference library">
      <button className="codex-close" onClick={onClose} aria-label="Close Codex">
        [ESC] Close
      </button>
      <h2>CODEX // Reference Library</h2>
      <div className="codex-tabs">
        {TOPICS.map((t) => (
          <button
            key={t.topic}
            className={`codex-tab ${t.topic === active ? "active" : ""}`}
            onClick={() => setActive(t.topic)}
          >
            {t.title}
          </button>
        ))}
      </div>
      <section>
        <h3 className="glow-cyan">{topic.title}</h3>
        {topic.description && <p className="muted">{topic.description}</p>}
        {topic.entries.map((entry) => {
          const hit = highlight.includes(entry.id);
          const ref = hit && !hitAssigned ? firstHitRef : undefined;
          if (hit) hitAssigned = true;
          return (
            <details key={entry.id} className={hit ? "codex-hit" : ""} open={hit} ref={ref}>
              <summary>{entry.term}</summary>
              <p>{entry.body}</p>
              {entry.example && <pre>{entry.example}</pre>}
              {entry.relatedCommands && entry.relatedCommands.length > 0 && (
                <p className="codex-cmds">
                  <span className="codex-cmds-label">▸ Try in terminal:</span>{" "}
                  {entry.relatedCommands.map((cmd) => (
                    <button
                      key={cmd}
                      type="button"
                      className="codex-cmd"
                      title={`Insert "${cmd} " into the terminal (then ${cmd} --help)`}
                      onClick={() => {
                        store.fillInput(cmd + " ");
                        onClose();
                      }}
                    >
                      {cmd}
                    </button>
                  ))}
                </p>
              )}
            </details>
          );
        })}
      </section>
    </div>
  );
}
