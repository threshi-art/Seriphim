import { useState } from "react";
import { useSeraphim } from "../state/SeraphimState";

export function ChatView() {
  const { chat, sendMessage, clearChat } = useSeraphim();
  const [draft, setDraft] = useState("");

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    sendMessage(trimmed);
    setDraft("");
  }

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Chat</h1>
          <p>Mock briefing channel. Data-style structure; no external model calls.</p>
        </div>
        <button type="button" className="secondary-button" onClick={clearChat}>
          Clear
        </button>
      </header>

      <div className="chat-window">
        {chat.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            <div className="message-meta">
              {message.role} · {message.mode} ·{" "}
              {new Date(message.createdAt).toLocaleString()}
            </div>
            <div>{message.content}</div>
          </div>
        ))}
      </div>

      <div className="chat-input-row">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Give Seraphim a mission..."
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <button type="button" onClick={submit}>
          Send
        </button>
      </div>
    </section>
  );
}
