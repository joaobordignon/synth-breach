import { useState } from "react";
import networking from "../codex/networking.json";
import cryptography from "../codex/cryptography.json";
import pentesting from "../codex/pentesting.json";
import webSecurity from "../codex/webSecurity.json";
import { store } from "../engine/gameStore";

interface CodexEntry {
  id: string;
  term: string;
  category: string;
  summary: string;
  body: string;
  example?: string;
}
interface CodexTopic {
  topic: string;
  title: string;
  description?: string;
  entries: CodexEntry[];
}

const TOPICS = [networking, cryptography, pentesting, webSecurity] as CodexTopic[];

interface CodexModalProps {
  open: boolean;
  onClose: () => void;
}

export function CodexModal({ open, onClose }: CodexModalProps) {
  // Default the open tab to whatever the current episode points at.
  const suggested = store.episode.codexTopic ?? "networking";
  const [active, setActive] = useState(suggested);
  if (!open) return null;

  const topic = TOPICS.find((t) => t.topic === active) ?? TOPICS[0];

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
        {topic.entries.map((entry) => (
          <details key={entry.id}>
            <summary>{entry.term}</summary>
            <p>{entry.body}</p>
            {entry.example && <pre>{entry.example}</pre>}
          </details>
        ))}
      </section>
    </div>
  );
}
