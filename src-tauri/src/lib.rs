use tauri::{Manager, WebviewWindow};

// ─── Commands ─────────────────────────────────────────────────────────────────

/// Opacity is handled entirely via CSS (--window-opacity variable on .app).
/// set_background_color alpha is ignored on Windows, so CSS is the only
/// cross-platform approach. This stub is kept for potential future use.
#[tauri::command]
fn set_opacity(_app: tauri::AppHandle, _opacity: f64) {
    // No-op: opacity controlled by CSS variable in the frontend
}

/// Toggle always-on-top.
#[tauri::command]
fn set_always_on_top(app: tauri::AppHandle, enabled: bool) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.set_always_on_top(enabled);
    }
}

/// Exclude window from screen capture / screen share.
#[tauri::command]
fn set_screen_capture_excluded(app: tauri::AppHandle, excluded: bool) {
    if let Some(w) = app.get_webview_window("main") {
        platform::set_capture_excluded(&w, excluded);
    }
}

/// Toggle click-through (mouse events fall through to windows below).
#[tauri::command]
fn set_click_through(app: tauri::AppHandle, enabled: bool) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.set_ignore_cursor_events(enabled);
    }
}

/// Save script to a file chosen via native dialog.
#[tauri::command]
async fn save_script(app: tauri::AppHandle, content: String) -> Result<(), String> {
    use tauri_plugin_dialog::DialogExt;
    let path = app
        .dialog()
        .file()
        .add_filter("Text files", &["txt", "md"])
        .set_file_name("script.txt")
        .blocking_save_file();
    if let Some(p) = path {
        std::fs::write(p.to_string(), content).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Load script from a file chosen via native dialog.
#[tauri::command]
async fn load_script(app: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;
    let path = app
        .dialog()
        .file()
        .add_filter("Text files", &["txt", "md"])
        .blocking_pick_file();
    if let Some(p) = path {
        Ok(std::fs::read_to_string(p.to_string()).map_err(|e| e.to_string())?)
    } else {
        Ok(String::new())
    }
}

// ─── App entry ────────────────────────────────────────────────────────────────

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            let _ = window.set_always_on_top(true);
            let _ = window.set_decorations(false);
            #[cfg(target_os = "macos")]
            platform::apply_macos_tweaks(&window);

            platform::set_capture_excluded(&window, true);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_opacity,
            set_always_on_top,
            set_screen_capture_excluded,
            set_click_through,
            save_script,
            load_script,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Teleprompter");
}

// ─── Platform implementations ─────────────────────────────────────────────────

#[cfg(target_os = "macos")]
mod platform {
    use super::WebviewWindow;
    use raw_window_handle::{HasWindowHandle, RawWindowHandle};

    /// AppKitWindowHandle (rwh 0.6) only exposes `ns_view: NonNull<c_void>`.
    /// We walk up to NSWindow via -[NSView window].
    unsafe fn ns_window_ptr(
        ns_view: *mut std::ffi::c_void,
    ) -> *mut objc2::runtime::AnyObject {
        let view = ns_view as *mut objc2::runtime::AnyObject;
        if view.is_null() {
            return std::ptr::null_mut();
        }
        objc2::msg_send![view, window]
    }

    pub fn apply_macos_tweaks(window: &WebviewWindow) {
        let Ok(handle) = window.window_handle() else { return };
        let RawWindowHandle::AppKit(h) = handle.as_raw() else { return };
        unsafe {
            let ns_win = ns_window_ptr(h.ns_view.as_ptr());
            if ns_win.is_null() { return; }
            // NSFloatingWindowLevel = 3
            let _: () = objc2::msg_send![ns_win, setLevel: 3i64];
            // NSWindowCollectionBehavior: canJoinAllSpaces(1) | managed(4)
            let behavior: u64 = (1 << 0) | (1 << 2);
            let _: () = objc2::msg_send![ns_win, setCollectionBehavior: behavior];
        }
    }

    pub fn set_capture_excluded(window: &WebviewWindow, excluded: bool) {
        let Ok(handle) = window.window_handle() else { return };
        let RawWindowHandle::AppKit(h) = handle.as_raw() else { return };
        unsafe {
            let ns_win = ns_window_ptr(h.ns_view.as_ptr());
            if ns_win.is_null() { return; }
            // NSWindowSharingNone = 0, NSWindowSharingReadOnly = 1
            let sharing: u64 = if excluded { 0 } else { 1 };
            let _: () = objc2::msg_send![ns_win, setSharingType: sharing];
        }
    }
}

#[cfg(target_os = "windows")]
mod platform {
    use super::WebviewWindow;
    use raw_window_handle::{HasWindowHandle, RawWindowHandle};
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::{
        SetWindowDisplayAffinity, WDA_EXCLUDEFROMCAPTURE, WDA_NONE,
    };

    pub fn set_capture_excluded(window: &WebviewWindow, excluded: bool) {
        let Ok(handle) = window.window_handle() else { return };
        let RawWindowHandle::Win32(h) = handle.as_raw() else { return };
        // Win32WindowHandle.hwnd is NonZeroIsize in rwh 0.6
        let hwnd = HWND(h.hwnd.get() as *mut core::ffi::c_void);
        let affinity = if excluded { WDA_EXCLUDEFROMCAPTURE } else { WDA_NONE };
        unsafe { let _ = SetWindowDisplayAffinity(hwnd, affinity); }
    }
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
mod platform {
    use super::WebviewWindow;
    pub fn set_capture_excluded(_w: &WebviewWindow, _e: bool) {}
}
