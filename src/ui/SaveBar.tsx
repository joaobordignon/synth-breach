import { store } from "../engine/gameStore";
import { exportSave, importSaveViaPicker } from "../state/saveFile";

// Download / import the save file — the offline "continue on any device" flow.
// Clicking is a user gesture, so the download and the file picker are allowed.

export function SaveBar() {
  return (
    <span className="save-bar">
      <button className="save-btn" onClick={() => exportSave()} title="Download your save file">
        ⇩ SAVE
      </button>
      <button
        className="save-btn"
        onClick={() =>
          importSaveViaPicker((msg, ok) => store.api.print(`[${ok ? "✓" : "!"}] ${msg}`, ok ? "success" : "error"))
        }
        title="Load a save file to continue"
      >
        ⇧ LOAD
      </button>
    </span>
  );
}
