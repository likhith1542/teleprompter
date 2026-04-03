import { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AppState, FONT_FAMILIES, THEMES } from "../types";
import "./ControlPanel.css";

interface Props {
  state: AppState;
  update: (patch: Partial<AppState>) => void;
  onLaunch: () => void;
}

export default function ControlPanel({ state, update, onLaunch }: Props) {
  const [tab, setTab] = useState<"script" | "display" | "window" | "shortcuts">("script");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const saveScript = async () => {
    try {
      await invoke("save_script", { content: state.script });
    } catch (e) {
      console.error(e);
    }
  };

  const loadScript = async () => {
    try {
      const content = await invoke<string>("load_script");
      if (content) update({ script: content });
    } catch (e) {
      console.error(e);
    }
  };

  const summarizeWithAI = async () => {
    if (!state.script.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Convert the following teleprompter script into concise bullet points (3-8 bullets, each under 15 words) that capture the key points. Return ONLY the bullet points, one per line starting with "• ":\n\n${state.script}`,
            },
          ],
        }),
      });
      const data = await resp.json();
      const text = data.content
        ?.map((c: { type: string; text?: string }) => (c.type === "text" ? c.text : ""))
        .join("");
      if (text) update({ script: text });
    } catch (e) {
      setAiError("AI summarization failed. Check your API key setup.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="cp">
      {/* Header */}
      <div className="cp__header" data-tauri-drag-region>
        <div className="cp__logo">
          <span className="cp__logo-dot" />
          TELEPROMPTER
        </div>
        <button className="cp__launch" onClick={onLaunch}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          LAUNCH
        </button>
      </div>

      {/* Tabs */}
      <div className="cp__tabs">
        {(["script", "display", "window", "shortcuts"] as const).map((t) => (
          <button
            key={t}
            className={`cp__tab ${tab === t ? "cp__tab--active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="cp__body">
        {/* SCRIPT TAB */}
        {tab === "script" && (
          <div className="cp__section">
            <div className="cp__row cp__row--between">
              <label className="cp__label">SCRIPT</label>
              <div className="cp__row" style={{ gap: 8 }}>
                <button className="cp__btn cp__btn--sm" onClick={loadScript}>
                  LOAD
                </button>
                <button className="cp__btn cp__btn--sm" onClick={saveScript}>
                  SAVE
                </button>
                <button
                  className={`cp__btn cp__btn--sm cp__btn--accent ${aiLoading ? "cp__btn--loading" : ""}`}
                  onClick={summarizeWithAI}
                  disabled={aiLoading}
                  title="Summarize to bullet points using AI"
                >
                  {aiLoading ? "..." : "✦ AI"}
                </button>
              </div>
            </div>
            {aiError && <p className="cp__error">{aiError}</p>}
            <textarea
              className="cp__textarea"
              value={state.script}
              onChange={(e) => update({ script: e.target.value })}
              placeholder="Paste your script here..."
              spellCheck
            />
            <p className="cp__hint">
              {state.script.split(/\s+/).filter(Boolean).length} words ·{" "}
              {state.script.length} chars
            </p>
          </div>
        )}

        {/* DISPLAY TAB */}
        {tab === "display" && (
          <div className="cp__section">
            {/* Font Size */}
            <div className="cp__field">
              <label className="cp__label">FONT SIZE — {state.fontSize}px</label>
              <input
                type="range"
                min="16"
                max="120"
                value={state.fontSize}
                onChange={(e) => update({ fontSize: parseInt(e.target.value) })}
                style={{ "--val": `${((state.fontSize - 16) / 104) * 100}%` } as React.CSSProperties}
              />
            </div>

            {/* Font Family */}
            <div className="cp__field">
              <label className="cp__label">FONT FAMILY</label>
              <select
                className="cp__select"
                value={state.fontFamily}
                onChange={(e) => update({ fontFamily: e.target.value })}
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Text Align */}
            <div className="cp__field">
              <label className="cp__label">TEXT ALIGNMENT</label>
              <div className="cp__row" style={{ gap: 8 }}>
                {(["left", "center", "right"] as const).map((a) => (
                  <button
                    key={a}
                    className={`cp__btn ${state.textAlign === a ? "cp__btn--on" : ""}`}
                    onClick={() => update({ textAlign: a })}
                  >
                    {a === "left" ? "⬛▪▪" : a === "center" ? "▪⬛▪" : "▪▪⬛"}
                    &nbsp;{a.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height */}
            <div className="cp__field">
              <label className="cp__label">LINE SPACING — {state.lineHeight}×</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={state.lineHeight}
                onChange={(e) => update({ lineHeight: parseFloat(e.target.value) })}
                style={{ "--val": `${((state.lineHeight - 1) / 2) * 100}%` } as React.CSSProperties}
              />
            </div>

            {/* Text Color */}
            <div className="cp__field">
              <label className="cp__label">TEXT COLOR</label>
              <div className="cp__row" style={{ gap: 8 }}>
                {Object.entries(THEMES).map(([name, theme]) => (
                  <button
                    key={name}
                    className={`cp__color-btn ${state.textColor === theme.text && state.bgColor === theme.bg ? "cp__color-btn--on" : ""}`}
                    style={{ "--c": theme.text, "--bg": theme.bg } as React.CSSProperties}
                    onClick={() => update({ textColor: theme.text, bgColor: theme.bg })}
                    title={name}
                  >
                    {name.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Opacity */}
            <div className="cp__field">
              <label className="cp__label">
                BACKGROUND OPACITY — {Math.round(state.bgOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={state.bgOpacity}
                onChange={(e) => update({ bgOpacity: parseFloat(e.target.value) })}
                style={{ "--val": `${state.bgOpacity * 100}%` } as React.CSSProperties}
              />
            </div>

            {/* Mirror */}
            <div className="cp__field">
              <div className="cp__row cp__row--between">
                <label className="cp__label">MIRROR TEXT (physical setup)</label>
                <Toggle
                  on={state.mirrorText}
                  onChange={(v) => update({ mirrorText: v })}
                />
              </div>
            </div>
          </div>
        )}

        {/* WINDOW TAB */}
        {tab === "window" && (
          <div className="cp__section">
            {/* Window Opacity */}
            <div className="cp__field">
              <label className="cp__label">
                WINDOW OPACITY — {Math.round(state.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={state.opacity}
                onChange={(e) => update({ opacity: parseFloat(e.target.value) })}
                style={{ "--val": `${state.opacity * 100}%` } as React.CSSProperties}
              />
            </div>

            <div className="cp__toggles">
              <ToggleRow
                label="ALWAYS ON TOP"
                desc="Float above all other windows"
                on={state.alwaysOnTop}
                onChange={(v) => update({ alwaysOnTop: v })}
              />
              <ToggleRow
                label="SCREEN SHARE INVISIBLE"
                desc="Hidden in Zoom, OBS, Meet, Loom"
                on={state.screenShareInvisible}
                onChange={(v) => update({ screenShareInvisible: v })}
                accent
              />
              <ToggleRow
                label="CLICK-THROUGH MODE"
                desc="Mouse clicks pass to window below"
                on={state.clickThrough}
                onChange={(v) => update({ clickThrough: v })}
              />
              <ToggleRow
                label="LOCK POSITION"
                desc="Prevent accidental window moves"
                on={state.lockPosition}
                onChange={(v) => update({ lockPosition: v })}
              />
            </div>

            <div className="cp__info-box">
              <span className="cp__info-icon">🔒</span>
              <p>
                <strong>Screen Share Invisibility</strong> uses OS-level window APIs:
                <br />
                macOS → <code>sharingType = .none</code>
                <br />
                Windows → <code>SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)</code>
              </p>
            </div>
          </div>
        )}

        {/* SHORTCUTS TAB */}
        {tab === "shortcuts" && (
          <div className="cp__section">
            <div className="cp__shortcuts">
              {[
                ["Space", "Play / Pause"],
                ["↑ / ↓", "Speed up / down"],
                ["Esc", "Toggle Editor ↔ Teleprompter"],
                ["R", "Toggle Reverse"],
                ["M", "Toggle Mirror"],
                ["T", "Toggle Pass-Through (keyboard-only mode)"],
              ].map(([key, desc]) => (
                <div key={key} className="cp__shortcut">
                  <kbd className="cp__kbd">{key}</kbd>
                  <span className="cp__shortcut-desc">{desc}</span>
                </div>
              ))}
            </div>

            <div className="cp__speed-preview">
              <label className="cp__label">SCROLL SPEED — {state.speed.toFixed(1)}×</label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={state.speed}
                onChange={(e) => update({ speed: parseFloat(e.target.value) })}
                style={{ "--val": `${((state.speed - 0.1) / 9.9) * 100}%` } as React.CSSProperties}
              />
              <div className="cp__speed-marks">
                <span>SLOW</span>
                <span>NORMAL</span>
                <span>FAST</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".txt,.md"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => update({ script: ev.target?.result as string });
          reader.readAsText(file);
        }}
      />
    </div>
  );
}

// Reusable toggle
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`toggle ${on ? "toggle--on" : ""}`}
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
    >
      <span className="toggle__knob" />
    </button>
  );
}

function ToggleRow({
  label,
  desc,
  on,
  onChange,
  accent,
}: {
  label: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
  accent?: boolean;
}) {
  return (
    <div className={`cp__toggle-row ${accent ? "cp__toggle-row--accent" : ""}`}>
      <div>
        <div className="cp__label">{label}</div>
        <div className="cp__desc">{desc}</div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}
