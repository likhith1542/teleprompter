export interface AppState {
  // Content
  script: string;

  // Typography
  fontSize: number;
  fontFamily: string;
  textAlign: "left" | "center" | "right";
  lineHeight: number;
  textColor: string;

  // Scroll
  isPlaying: boolean;
  speed: number;
  reversed: boolean;
  scrollPosition: number;

  // Window
  opacity: number;
  alwaysOnTop: boolean;
  clickThrough: boolean;
  screenShareInvisible: boolean;
  lockPosition: boolean;

  // Display
  mirrorText: boolean;
  theme: "dark" | "light" | "green" | "amber";

  // Background
  bgColor: string;
  bgOpacity: number;
}

export const FONT_FAMILIES = [
  { label: "Space Mono", value: "'Space Mono', monospace" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
];

export const THEMES = {
  dark: { bg: "#000000", text: "#ffffff" },
  light: { bg: "#ffffff", text: "#000000" },
  green: { bg: "#001a00", text: "#00ff41" },
  amber: { bg: "#1a0f00", text: "#ffb300" },
};

export const DEFAULT_STATE: AppState = {
  script:
    "Welcome to Teleprompter.\n\nThis text will scroll automatically when you press Play.\n\nYou can adjust the speed, font, opacity, and many other settings in the control panel.\n\nPress Space to Play/Pause.\nPress ↑↓ to adjust speed.\nPress Esc to return to editor.\n\nStart reading from here...\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.\n\nNisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n\nExcepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",

  fontSize: 42,
  fontFamily: "'Space Mono', monospace",
  textAlign: "center",
  lineHeight: 1.6,
  textColor: "#ffffff",

  isPlaying: false,
  speed: 2,
  reversed: false,
  scrollPosition: 0,

  opacity: 0.92,
  alwaysOnTop: true,
  clickThrough: false,
  screenShareInvisible: true,
  lockPosition: false,

  mirrorText: false,
  theme: "dark",

  bgColor: "#000000",
  bgOpacity: 0.85,
};
