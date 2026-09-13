import { useSave } from "../state/SaveContext";
import type { Chapter } from "../chapters/baseChapter";

interface HeaderProps {
  chapter: Chapter;
}

export function Header({ chapter }: HeaderProps) {
  const { profile } = useSave();

  return (
    <div className="panel header">
      <span className="glow-pink">
        ⚡ SYNTH // BREACH [{chapter.act === 0 ? "PROLOGUE" : `ACT ${chapter.act}`}: {chapter.title.toUpperCase()}]
      </span>
      <span className="glow-cyan">SCORE: {profile.score}</span>
    </div>
  );
}
