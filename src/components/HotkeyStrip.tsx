import { useState, useEffect, useRef } from "react";
import { AppState } from "../types";
import "./HotkeyStrip.css";

interface Props {
  state: AppState;
  update: (patch: Partial<AppState>) => void;
  onBack: () => void;
  onReset: () => void;
}

/**
 * HotkeyStrip — two modes:
 *
 * INTERACTIVE (click-through OFF):
 *   Full controls bar. Auto-hides to a slim dot during playback,
 *   reappears on mouse move. Positioned bottom-center below the
 *   main floating toolbar so they don't overlap.
 *
 * CLICK-THROUGH ON:
 *   OS-level pass-through means NO mouse interaction is possible anywhere.
 *   We show a keyboard-shortcut reminder badge instead — purely informational.
 *   It fades out after 4s so it doesn't block reading.
 */
export default function HotkeyStrip({ state, update, onBack, onReset }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [reminderVisible, setReminderVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const reminderTimer = useRef<ReturnType<typeof setTimeout>>();
  const prevCT = useRef(state.clickThrough);

  // Auto-hide strip during playback (interactive mode only)
  useEffect(() => {
    if (state.clickThrough) return;
    clearTimeout(hideTimer.current);
    if (state.isPlaying) {
      hideTimer.current = setTimeout(() => setExpanded(false), 2500);
    } else {
      setExpanded(true);
    }
    return () => clearTimeout(hideTimer.current);
  }, [state.isPlaying, state.clickThrough]);

  // Show keyboard reminder briefly when click-through is toggled ON
  useEffect(() => {
    if (state.clickThrough && !prevCT.current) {
      setReminderVisible(true);
      clearTimeout(reminderTimer.current);
      reminderTimer.current = setTimeout(() => setReminderVisible(false), 4000);
    }
    if (!state.clickThrough) {
      setReminderVisible(false);
      setExpanded(true);
    }
    prevCT.current = state.clickThrough;
    return () => clearTimeout(reminderTimer.current);
  }, [state.clickThrough]);

  const showStrip = () => {
    if (state.clickThrough) return;
    clearTimeout(hideTimer.current);
    setExpanded(true);
    if (state.isPlaying) {
      hideTimer.current = setTimeout(() => setExpanded(false), 3000);
    }
  };

  useEffect(() => {
    if (!state.clickThrough) {
      window.addEventListener("mousemove", showStrip);
      return () => window.removeEventListener("mousemove", showStrip);
    }
  }, [state.clickThrough, state.isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  const speedDec = () => update({ speed: Math.max(0.1, parseFloat((state.speed - 0.5).toFixed(1))) });
  const speedInc = () => update({ speed: Math.min(10, parseFloat((state.speed + 0.5).toFixed(1))) });

  // ── Click-through mode: keyboard reminder only, no interactive elements ───
  if (state.clickThrough) {
    return (
      <div className={`hks-reminder ${reminderVisible ? "hks-reminder--visible" : ""}`}>
        <div className="hks-reminder__icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 4h2v2h-2v-2zM8 8h2v2H8V8zm0 4h2v2H8v-2zm-1 5l-2-2h4l-2 2zm6 0h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V8h2v2zm5 8l-2-2h4l-2 2zm1-3h-2v-2h2v2zm0-4h-2V8h2v2z"/>
          </svg>
        </div>
        <div className="hks-reminder__keys">
          <span>PASS-THROUGH ON</span>
          <div className="hks-reminder__row">
            <kbd>Space</kbd><span>play</span>
            <kbd>↑↓</kbd><span>speed</span>
            <kbd>T</kbd><span>exit</span>
            <kbd>Esc</kbd><span>editor</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Interactive mode ───────────────────────────────────────────────────────
  return (
    <div className={`hks ${expanded ? "hks--expanded" : "hks--collapsed"}`}>
      {/* Collapsed state: just a glowing dot to hint the bar exists */}
      <div className="hks__dot" onClick={() => setExpanded(true)} />

      {/* Expanded controls */}
      <div className="hks__controls">
        {/* Click-through toggle */}
        <button
          className="hks__ct-btn"
          onClick={() => update({ clickThrough: true })}
          title="T — Enable pass-through (keyboard only after)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M5.5 3.5L5.5 18L9 14.5L12 21L14 20L11 13.5H16L5.5 3.5Z" fill="currentColor" stroke="none"/>
            <line x1="3" y1="21" x2="21" y2="3"/>
          </svg>
          <span>PASS-THROUGH</span>
        </button>

        <div className="hks__sep" />

        {/* Play/Pause */}
        <button
          className={`hks__btn ${state.isPlaying ? "hks__btn--active" : ""}`}
          onClick={() => update({ isPlaying: !state.isPlaying })}
          title="Space"
        >
          {state.isPlaying
            ? <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          }
        </button>

        {/* Speed */}
        <button className="hks__btn" onClick={speedDec} title="↓"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13H5v-2h14v2z"/></svg></button>
        <span className="hks__speed">{state.speed.toFixed(1)}×</span>
        <button className="hks__btn" onClick={speedInc} title="↑"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></button>

        <div className="hks__sep" />

        {/* Reset */}
        <button className="hks__btn" onClick={onReset} title="Reset">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
        </button>

        {/* Back */}
        <button className="hks__btn hks__btn--exit" onClick={onBack} title="Esc">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z"/></svg>
        </button>
      </div>
    </div>
  );
}
