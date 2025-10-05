
use tauri::Manager;
use std::process::Command;
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn run_shell_command_with_result(command: String) -> String {
  let output = Command::new("sh").arg("-c").arg(command).output().unwrap();
  return format!("{:?}", String::from_utf8_lossy(&output.stdout));
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()  .setup(|app| {
    #[cfg(debug_assertions)] // only include this code on debug builds
    {
      let window = app.get_webview_window("main").unwrap();
      window.open_devtools();
      window.close_devtools();
    }
    Ok(())
  })
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
      run_shell_command_with_result
    ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
