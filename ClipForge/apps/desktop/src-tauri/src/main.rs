#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Create app data directory
            let app_data_dir = app.path_resolver().app_data_dir().unwrap();
            std::fs::create_dir_all(&app_data_dir).unwrap();
            
            // Create cache directory
            let cache_dir = app.path_resolver().app_cache_dir().unwrap();
            std::fs::create_dir_all(&cache_dir).unwrap();
            
            // Create config directory
            let config_dir = app.path_resolver().app_config_dir().unwrap();
            std::fs::create_dir_all(&config_dir).unwrap();
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
