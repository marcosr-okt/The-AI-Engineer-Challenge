import React, { useState, useRef } from "react";

export default function Home() {
  const [developerMessage, setDeveloperMessage] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [apiKey, setApiKey] = useState("");
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
          model: "gpt-4.1-mini", // always use this model
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
    <div className="container">
      <div className="form-section" id="form-section">
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
                style={{ maxWidth: "100%" }}
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
                rows={3}
                style={{ maxWidth: "100%" }}
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
                rows={3}
                style={{ maxWidth: "100%" }}
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
      </div>
      <div
        className="output-section"
        id="output-section"
        style={{
          // Ensure output-section matches form-section height on desktop
          height: "auto"
        }}
      >
        <strong>Response:</strong>
        <pre style={{ width: "100%", overflowX: "auto" }}>
          {response}
        </pre>
      </div>
      <style jsx>{`
        @media (max-width: 768px) {
          .container {
            flex-direction: column;
            gap: 1rem;
            min-height: unset;
            padding: 0 0.5rem;
          }
          .form-section,
          .output-section {
            padding: 1.2rem 0.8rem;
            min-width: 0;
            width: 100%;
            box-sizing: border-box;
          }
          .form-section input,
          .form-section textarea {
            width: 100% !important;
            min-width: 0;
            box-sizing: border-box;
          }
          .output-section {
            min-width: 0;
            width: 100%;
            max-width: 100%;
            max-height: 400px;
            overflow-y: auto;
            height: auto !important;
          }
          .output-section pre {
            width: 100%;
            max-width: 100%;
            overflow-x: auto;
          }
        }
        @media (min-width: 769px) {
          .container {
            align-items: stretch;
          }
          .form-section,
          .output-section {
            height: auto;
          }
          .output-section {
            height: auto;
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>
      <style jsx>{`
        /* Match output-section height to form-section on desktop */
        @media (min-width: 769px) {
          .output-section {
            height: 100%;
          }
        }
      `}</style>
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            function matchHeights() {
              if (window.innerWidth > 768) {
                var form = document.getElementById('form-section');
                var out = document.getElementById('output-section');
                if (form && out) {
                  out.style.height = form.offsetHeight + "px";
                }
              } else {
                var out = document.getElementById('output-section');
                if (out) out.style.height = "auto";
              }
            }
            window.addEventListener('resize', matchHeights);
            window.addEventListener('DOMContentLoaded', matchHeights);
            setTimeout(matchHeights, 100);
          })();
        `
      }} />
    </div>
  );
}