import { useState } from "react";
import { useSeraphim } from "../state/SeraphimState";

export function MemoryView() {
  const { memories, addMemory, clearMemories } = useSeraphim();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  function submit() {
    if (!key.trim() || !value.trim()) {
      return;
    }
    addMemory({ category: "operator", key: key.trim(), value: value.trim() });
    setKey("");
    setValue("");
  }

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Memory</h1>
          <p>MOCK local memories persisted in localStorage. Not synced to web TiDB.</p>
        </div>
        <button type="button" className="secondary-button" onClick={clearMemories}>
          Clear
        </button>
      </header>

      <div className="card">
        <div className="form-grid">
          <input
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder="Memory key"
          />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Memory value"
          />
          <button type="button" onClick={submit}>
            Add Mock Memory
          </button>
        </div>
      </div>

      <div className="card-grid">
        {memories.map((memory) => (
          <article key={memory.id} className="card">
            <div className="card-topline">
              <strong>{memory.key}</strong>
              <span className="status-pill pending">{memory.source}</span>
            </div>
            <p>{memory.value}</p>
            <div className="muted">{memory.category}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
