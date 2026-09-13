import networking from "../codex/networking.json";
import cryptography from "../codex/cryptography.json";
import pentesting from "../codex/pentesting.json";
import webSecurity from "../codex/webSecurity.json";

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
  entries: CodexEntry[];
}

const TOPICS = [networking, cryptography, pentesting, webSecurity] as CodexTopic[];

interface CodexModalProps {
  open: boolean;
  onClose: () => void;
}

export function CodexModal({ open, onClose }: CodexModalProps) {
  if (!open) return null;

  return (
    <div className="codex-modal">
      <button className="codex-close" onClick={onClose} aria-label="Close Codex">
        [ESC] Close
      </button>
      <h2>CODEX // Reference Library</h2>
      {TOPICS.map((topic) => (
        <section key={topic.topic}>
          <h3 className="glow-cyan">{topic.title}</h3>
          {topic.entries.map((entry) => (
            <details key={entry.id}>
              <summary>{entry.term}</summary>
              <p>{entry.body}</p>
              {entry.example && <pre>{entry.example}</pre>}
            </details>
          ))}
        </section>
      ))}
    </div>
  );
}
