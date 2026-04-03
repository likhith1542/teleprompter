import { AppState } from "../types";
import "./FloatingToolbar.css";

interface Props {
  visible: boolean;
  state: AppState;
  update: (patch: Partial<AppState>) => void;
  onBack: () => void;
  onReset: () => void;
}

export default function FloatingToolbar({ visible, state, update, onBack, onReset }: Props) {
  return (
    <div className={`ftb ${visible ? "ftb--visible" : ""}`}>
      {/* Reset */}
      <button className="ftb__btn" onClick={onReset} title="Reset to start">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
        </svg>
      </button>

      {/* Speed down */}
      <button
        className="ftb__btn"
        onClick={() => update({ speed: Math.max(0.1, parseFloat((state.speed - 0.5).toFixed(1))) })}
        title="↓ Slower"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13H5v-2h14v2z"/>
        </svg>
      </button>

      {/* Speed label */}
      <span className="ftb__label">{state.speed.toFixed(1)}×</span>

      {/* Speed up */}
      <button
        className="ftb__btn"
        onClick={() => update({ speed: Math.min(10, parseFloat((state.speed + 0.5).toFixed(1))) })}
        title="↑ Faster"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>

      {/* Play / Pause — primary CTA */}
      <button
        className="ftb__btn ftb__btn--primary"
        onClick={() => update({ isPlaying: !state.isPlaying })}
        title="Space"
      >
        {state.isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      {/* Reverse */}
      <button
        className={`ftb__btn ${state.reversed ? "ftb__btn--active" : ""}`}
        onClick={() => update({ reversed: !state.reversed })}
        title="R — Reverse"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
        </svg>
      </button>

      {/* Mirror */}
      <button
        className={`ftb__btn ${state.mirrorText ? "ftb__btn--active" : ""}`}
        onClick={() => update({ mirrorText: !state.mirrorText })}
        title="M — Mirror"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 21h2v-2h-2v2zm4-12h2V7h-2v2zM3 5v14c0 1.1.9 2 2 2h4v-2H5V5h4V3H5c-1.1 0-2 .9-2 2zm16-2v2h2c0-1.1-.9-2-2-2zm-8 20h2V1h-2v22zm8-6h2v-2h-2v2zM15 5h2V3h-2v2zm4 8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2z"/>
        </svg>
      </button>

      <div className="ftb__divider" />

      {/* Opacity slider */}
      <div className="ftb__slider-group">
        <svg viewBox="0 0 24 24" fill="currentColor" className="ftb__icon">
          <path d="M17.66 7.93L12 2.27 6.34 7.93c-3.12 3.12-3.12 8.19 0 11.31C7.9 20.8 9.95 21.58 12 21.58c2.05 0 4.1-.78 5.66-2.34 3.12-3.12 3.12-8.19 0-11.31z"/>
        </svg>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={state.opacity}
          onChange={(e) => update({ opacity: parseFloat(e.target.value) })}
          style={{ "--val": `${state.opacity * 100}%` } as React.CSSProperties}
          title={`Opacity: ${Math.round(state.opacity * 100)}%`}
        />
      </div>

      <div className="ftb__divider" />

      {/* Back to editor */}
      <button className="ftb__btn ftb__btn--back" onClick={onBack} title="Esc — Editor">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z"/>
        </svg>
      </button>
    </div>
  );
}
