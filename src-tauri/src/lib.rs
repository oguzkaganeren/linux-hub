use std::process::Command;
use tauri::Manager;
use std::fs;
use std::path::PathBuf;
use base64::{engine::general_purpose, Engine as _};
use std::process::Command as StdCommand;
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn run_shell_command_with_result(command: String) -> String {
    let output = Command::new("sh").arg("-c").arg(command).output().unwrap();
    return format!("{:?}", String::from_utf8_lossy(&output.stdout));
}

#[tauri::command]
fn get_system_user_info() -> String {
    let username = whoami::username();
    let realname = whoami::realname();

    // Combine into a simple JSON string or a structured object for the frontend
    format!("{{\"username\": \"{}\", \"realname\": \"{}\"}}", username, realname)
}

#[tauri::command]
fn get_user_profile_photo_base64() -> Result<String, String> {
    // 1. Get the user's home directory
    let mut face_path: PathBuf = home::home_dir().ok_or("Could not find home directory")?;

    // 2. Append the standard Linux profile picture filename
    face_path.push(".face");

    // 3. Check if the file exists
    if !face_path.exists() {
        // If .face doesn't exist, you might check other common locations here (see Method 2)
        return Err("User profile photo (.face) not found.".into());
    }

    // 4. Read the file contents
    let image_bytes = fs::read(&face_path)
        .map_err(|e| format!("Failed to read .face file: {}", e))?;

    // 5. Determine the MIME type (assuming JPEG or PNG, you may need better file-type detection)
    let mime_type = if face_path.extension().map_or(false, |ext| ext == "png") {
        "image/png"
    } else {
        // Default to JPEG, but real-world usage may require a better check
        "image/jpeg"
    };

    // 6. Encode the bytes to Base64
    let base64_image = general_purpose::STANDARD.encode(image_bytes);

    // 7. Return as a Data URL for the frontend
    Ok(format!("data:{};base64,{}", mime_type, base64_image))
}

/// Executes a given command string using pkexec to gain root privileges.
///
/// This function triggers the native PolicyKit graphical password prompt.
///
/// @param command_to_run: The command string to execute (e.g., "apt update").
/// @returns A Result containing the combined stdout/stderr output on success, 
///          or a detailed error message on failure (including user cancellation).
#[tauri::command]
fn run_elevated_command(command_to_run: String) -> Result<String, String> {
    
    // --- Security Note ---
    // It is safer to pass arguments separately rather than using "sh -c",
    // but for simple commands, this structure is functional for pkexec.
    
    // 1. Prepare the full pkexec command
    let mut command = StdCommand::new("/usr/bin/pkexec");
    
    // This structure passes the command string to a shell for execution with elevated rights.
    command.arg("sh").arg("-c").arg(&command_to_run);

    // 2. Execute and capture output
    match command.output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let combined_output = format!("{}\n{}", stdout, stderr);
            
            if output.status.success() {
                // Command successfully ran with elevation (exit code 0)
                Ok(combined_output)
            } else {
                // Command failed, possibly due to user cancellation or incorrect command
                let exit_code = output.status.code().unwrap_or(-1);
                
                // Common check for pkexec/PolicyKit failures (like user cancelling or auth failure)
                if stderr.contains("not authorized") || exit_code == 127 || stderr.contains("authentication failed") {
                    Err(format!("Root permission denied or cancelled by user. (Exit Code: {})", exit_code))
                } else {
                    Err(format!("Elevated command failed (Exit Code: {}). Output: {}", exit_code, combined_output))
                }
            }
        }
        Err(e) => {
            // Failed to even spawn the process (e.g., pkexec not found)
            Err(format!("Failed to spawn pkexec process: {}", e))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
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
        .invoke_handler(tauri::generate_handler![run_shell_command_with_result,
            get_system_user_info,
            get_user_profile_photo_base64,
            run_elevated_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
