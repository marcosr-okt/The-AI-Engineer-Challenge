import React, { useState, useRef } from "react";

export default function Home() {
  const [developerMessage, setDeveloperMessage] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);

  // Use environment variable for API base URL, fallback to localhost for dev
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponse("");
    setLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developer_message: developerMessage,
          user_message: userMessage,
          model,
          api_key: apiKey,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          setResponse((prev) => prev + decoder.decode(value));
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") setResponse("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAbort = () => {
    abortControllerRef.current?.abort();
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>OpenAI Chat API UI</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <div>
          <label>
            API Key:
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div>
          <label>
            Developer Message:
            <textarea
              value={developerMessage}
              onChange={(e) => setDeveloperMessage(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div>
          <label>
            User Message:
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <div>
          <label>
            Model:
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <button type="submit" disabled={loading} style={{ marginRight: 8 }}>
          {loading ? "Sending..." : "Send"}
        </button>
        {loading && (
          <button type="button" onClick={handleAbort}>
            Abort
          </button>
        )}
      </form>
      <div>
        <strong>Response:</strong>
        <pre
          style={{
            background: "#f4f4f4",
            minHeight: 100,
            padding: 10,
            whiteSpace: "pre-wrap",
          }}
        >
          {response}
        </pre>
      </div>
    </div>
  );
}