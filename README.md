# 🎬 Teleprompter

A cross-platform desktop teleprompter (macOS + Windows) built with Tauri v2 + React.
Floats above all apps, stays invisible in screen shares, and gets out of your way.

---

## ⬇️ Download

Grab the latest build from [Releases](../../releases/latest):

| Platform | File |
|---|---|
| macOS Apple Silicon (M1/M2/M3) | `Teleprompter_*_aarch64.dmg` |
| macOS Intel | `Teleprompter_*_x64.dmg` |
| Windows | `Teleprompter_*_x64-setup.exe` |

### macOS — first launch (unsigned app)

macOS blocks apps not from the App Store. Two options:

**Option A — right-click method (easiest):**
1. Open the `.dmg` and drag `Teleprompter.app` to Applications
2. Right-click the app → **Open** → **Open** (only needed once)

**Option B — terminal (if Option A doesn't work):**
```bash
xattr -cr /Applications/Teleprompter.app
```

### Windows — first launch (unsigned app)

Windows SmartScreen will show "Windows protected your PC":
1. Click **More info**
2. Click **Run anyway**

---

## ✨ Features

| | |
|---|---|
| 🔒 Screen share invisible | Hidden in Zoom, Google Meet, OBS, Loom, Teams |
| 🪟 Always-on-top | Floats above every app |
| 👁 Opacity | CSS-driven, real-time, works on all platforms |
| ⏩ Auto-scroll | Smooth RAF-based, 0.1× – 10× speed |
| ⏪ Reverse | Scroll backwards |
| 🪞 Mirror | Flip horizontally for hardware setups |
| 🖱 Pass-through | Mouse events fall through to windows below |
| 💾 Save / Load | Native file dialogs |
| ✦ AI Summarize | Condense script to bullet points |

---

## ⌨️ Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `↑` / `↓` | Speed up / down |
| `Esc` | Editor ↔ Teleprompter |
| `R` | Toggle Reverse |
| `M` | Toggle Mirror |
| `T` | Toggle Pass-Through (keyboard-only mode) |

---

## 🛠 Build from source

```bash
# Prerequisites: Node.js 18+, Rust (rustup.rs)
git clone https://github.com/likhith1542/teleprompter
cd teleprompter
npm install
npm run tauri dev        # development
npm run tauri build      # production build
```

---

## 🚀 Release a new version

```bash
./release.sh             # patch: 1.0.0 → 1.0.1
./release.sh minor       # minor: 1.0.0 → 1.1.0
./release.sh major       # major: 1.0.0 → 2.0.0
./release.sh 1.2.3       # exact version
```

GitHub Actions builds for macOS (arm64 + x64) and Windows automatically.

---

## 🔒 Screen Share Invisibility

**macOS** — `NSWindowSharingNone` via ObjC:
```objc
[nsWindow setSharingType:NSWindowSharingNone]; // 0
```

**Windows** — `SetWindowDisplayAffinity`:
```c
SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE); // Win10 2004+
```

Requires `"macOSPrivateApi": true` in `tauri.conf.json`.

---

## 📄 License

MIT
