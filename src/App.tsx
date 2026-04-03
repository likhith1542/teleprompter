import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import TeleprompterView from "./components/TeleprompterView";
import ControlPanel from "./components/ControlPanel";
import { AppState, DEFAULT_STATE } from "./types";
import "./App.css";

const tauriInvoke = (cmd: string, args?: Record<string, unknown>) =>
  invoke(cmd, args).catch(() => {});

export default function App() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [view, setView] = useState<"editor" | "teleprompter">("editor");
  const prevView = useRef(view);

  // Apply initial opacity on mount
  useEffect(() => {
    document.documentElement.style.setProperty("--window-opacity", String(DEFAULT_STATE.opacity));
  }, []);

  const update = useCallback((patch: Partial<AppState>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  // Opacity via CSS — set_background_color alpha ignored on Windows
  useEffect(() => {
    document.documentElement.style.setProperty("--window-opacity", String(state.opacity));
  }, [state.opacity]);

  useEffect(() => {
    tauriInvoke("set_always_on_top", { enabled: state.alwaysOnTop });
  }, [state.alwaysOnTop]);

  useEffect(() => {
    tauriInvoke("set_click_through", { enabled: state.clickThrough });
  }, [state.clickThrough]);

  useEffect(() => {
    tauriInvoke("set_screen_capture_excluded", { excluded: state.screenShareInvisible });
  }, [state.screenShareInvisible]);

  // On entering teleprompter: reset scroll, re-assert window flags
  // Do NOT auto-enable click-through — user opts in explicitly
  useEffect(() => {
    if (view === "teleprompter" && prevView.current !== "teleprompter") {
      tauriInvoke("set_always_on_top", { enabled: state.alwaysOnTop });
      tauriInvoke("set_screen_capture_excluded", { excluded: state.screenShareInvisible });
    }
    // On return to editor: always disable click-through
    if (view === "editor" && prevView.current !== "editor") {
      update({ clickThrough: false, isPlaying: false });
    }
    prevView.current = view;
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global keyboard shortcuts — work in ALL modes including click-through
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        return;
      }
      switch (e.key) {
        case " ":
          e.preventDefault();
          update({ isPlaying: !state.isPlaying });
          break;
        case "ArrowUp":
          e.preventDefault();
          update({ speed: Math.min(10, parseFloat((state.speed + 0.5).toFixed(1))) });
          break;
        case "ArrowDown":
          e.preventDefault();
          update({ speed: Math.max(0.1, parseFloat((state.speed - 0.5).toFixed(1))) });
          break;
        case "Escape":
          update({ isPlaying: false });
          setView((v) => (v === "teleprompter" ? "editor" : "teleprompter"));
          break;
        case "r": case "R":
          if (view === "teleprompter") update({ reversed: !state.reversed });
          break;
        case "m": case "M":
          if (view === "teleprompter") update({ mirrorText: !state.mirrorText });
          break;
        case "t": case "T":
          if (view === "teleprompter") update({ clickThrough: !state.clickThrough });
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state, update, view]);

  return (
    <div className="app" data-view={view}>
      {view === "editor" ? (
        <ControlPanel
          state={state}
          update={update}
          onLaunch={() => {
            update({ scrollPosition: 0 });
            setView("teleprompter");
          }}
        />
      ) : (
        <TeleprompterView
          state={state}
          update={update}
          onBack={() => setView("editor")}
        />
      )}
    </div>
  );
}
