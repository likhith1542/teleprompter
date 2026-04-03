import { useEffect, useRef, useCallback, useState } from "react";
import { AppState } from "../types";
import FloatingToolbar from "./FloatingToolbar";
import HotkeyStrip from "./HotkeyStrip";
import "./TeleprompterView.css";

interface Props {
  state: AppState;
  update: (patch: Partial<AppState>) => void;
  onBack: () => void;
}

export default function TeleprompterView({ state, update, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isPlayingRef = useRef(state.isPlaying);
  const speedRef = useRef(state.speed);
  const reversedRef = useRef(state.reversed);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { isPlayingRef.current = state.isPlaying; }, [state.isPlaying]);
  useEffect(() => { speedRef.current = state.speed; }, [state.speed]);
  useEffect(() => { reversedRef.current = state.reversed; }, [state.reversed]);

  // ── RAF scroll loop ────────────────────────────────────────────────────────
  const tick = useCallback((timestamp: number) => {
    if (!containerRef.current) { animRef.current = requestAnimationFrame(tick); return; }
    if (!isPlayingRef.current) { lastTimeRef.current = 0; animRef.current = requestAnimationFrame(tick); return; }

    if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
    const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = timestamp;

    const el = containerRef.current;
    const pxPerSec = speedRef.current * 30;
    const maxScroll = el.scrollHeight - el.clientHeight;

    if (reversedRef.current) {
      const next = Math.max(0, el.scrollTop - pxPerSec * delta);
      el.scrollTop = next;
      if (next <= 0) update({ isPlaying: false });
    } else {
      const next = Math.min(maxScroll, el.scrollTop + pxPerSec * delta);
      el.scrollTop = next;
      if (next >= maxScroll - 1) update({ isPlaying: false });
    }
    animRef.current = requestAnimationFrame(tick);
  }, [update]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [tick]);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = state.scrollPosition;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toolbar auto-hide ──────────────────────────────────────────────────────
  // Only applies when click-through is OFF (when ON, OS handles everything)
  const showToolbar = useCallback(() => {
    if (state.clickThrough) return;
    setToolbarVisible(true);
    clearTimeout(hideTimerRef.current);
    if (isPlayingRef.current) {
      hideTimerRef.current = setTimeout(() => setToolbarVisible(false), 2500);
    }
  }, [state.clickThrough]);

  useEffect(() => {
    window.addEventListener("mousemove", showToolbar);
    return () => window.removeEventListener("mousemove", showToolbar);
  }, [showToolbar]);

  useEffect(() => {
    if (state.isPlaying && !state.clickThrough) {
      hideTimerRef.current = setTimeout(() => setToolbarVisible(false), 2500);
    } else {
      setToolbarVisible(true);
      clearTimeout(hideTimerRef.current);
    }
  }, [state.isPlaying, state.clickThrough]);

  const handleReset = useCallback(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;
    lastTimeRef.current = 0;
    update({ isPlaying: false, scrollPosition: 0 });
  }, [update]);

  function hexToRgb(hex: string) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : null;
  }
  const bgRgb = hexToRgb(state.bgColor);
  const cssBackground = bgRgb
    ? `rgba(${bgRgb.r},${bgRgb.g},${bgRgb.b},${state.bgOpacity})`
    : "rgba(0,0,0,0.9)";

  return (
    // No pointer-events override here — the OS set_ignore_cursor_events handles
    // click-through at the window level. CSS pointer-events:none on the root
    // would also break the scroll container and the HotkeyStrip, so we don't do it.
    <div className="tp-root" style={{ background: cssBackground }}>
      <div className="tp-fade-top" />
      <div className="tp-fade-bottom" />
      <div className="tp-eyeline" />

      <div
        ref={containerRef}
        className="tp-scroll"
        onWheel={(e) => {
          if (containerRef.current) containerRef.current.scrollTop += e.deltaY;
        }}
      >
        <div className="tp-spacer-top" />
        <p
          className="tp-text"
          style={{
            fontSize: state.fontSize,
            fontFamily: state.fontFamily,
            textAlign: state.textAlign,
            lineHeight: state.lineHeight,
            color: state.textColor,
            transform: state.mirrorText ? "scaleX(-1)" : "none",
            whiteSpace: "pre-wrap",
          }}
        >
          {state.script}
        </p>
        <div className="tp-spacer-bottom" />
      </div>

      {/* FloatingToolbar: bottom-center, hidden during playback + in CT mode */}
      <FloatingToolbar
        visible={toolbarVisible && !state.clickThrough}
        state={state}
        update={update}
        onBack={onBack}
        onReset={handleReset}
      />

      {/* HotkeyStrip: sits above FloatingToolbar (bottom: 90px) in interactive
          mode, or shows keyboard reminder toast in click-through mode */}
      <HotkeyStrip
        state={state}
        update={update}
        onBack={onBack}
        onReset={handleReset}
      />
    </div>
  );
}
