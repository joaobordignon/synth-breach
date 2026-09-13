import type { Chapter } from "../chapters/baseChapter";

interface IntelPaneProps {
  chapter: Chapter;
}

export function IntelPane({ chapter }: IntelPaneProps) {
  return (
    <div className="panel">
      <h3 className="glow-pink">📜 MISSION INTEL & THEORY</h3>
      <p>{chapter.briefing}</p>
      <h4 className="glow-cyan">Concepts</h4>
      <ul>
        {chapter.concepts.map((concept) => (
          <li key={concept}>{concept}</li>
        ))}
      </ul>
      <p style={{ color: "var(--muted-lavender, #8a79a5)" }}>
        Type <code>intel</code> for a Tier 1 hint, or <code>intel 2</code> / <code>intel 3</code> for deeper nudges.
      </p>
    </div>
  );
}
