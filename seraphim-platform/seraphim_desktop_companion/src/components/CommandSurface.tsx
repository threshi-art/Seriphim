import { useState } from "react";

/**
 * Deliberately presentation-only. This component never dispatches a command,
 * invokes a bridge, or mutates Desktop state.
 */
export function CommandSurface() {
  const [draft, setDraft] = useState("");

  return (
    <form
      className="command-surface"
      aria-label="Command surface"
      onSubmit={(event) => event.preventDefault()}
    >
      <span className="command-surface-glyph" aria-hidden="true">⌘</span>
      <label className="sr-only" htmlFor="cinematic-command-input">Command surface — routing disabled</label>
      <input
        id="cinematic-command-input"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Command routing is disabled in this visual review shell"
        autoComplete="off"
      />
      <span className="command-surface-status">VISUAL ONLY</span>
    </form>
  );
}
