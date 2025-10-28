use serde::Serialize;
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, BufReader};
// FIX: Import AppHandle and the Emitter trait for the .emit() method
use tauri::{AppHandle, Emitter}; 
use serde_json::json;
use std::time::SystemTime;

// --- Data Structures ---

/// Represents the overall result of the package operation.
#[derive(Debug, Serialize)]
pub struct PacmanResult {
    pub success: bool,
    pub message: String,
    pub operation: String,
    pub package_name: Option<String>,
}

/// Represents a progress update during a long operation.
/// Sent via Tauri events to the frontend.
#[derive(Debug, Serialize, Clone)]
pub struct PacmanProgress {
    pub current_step: String,
    pub detail: String,
    pub timestamp: SystemTime,
}

#[derive(Debug, Serialize, Clone)]
pub struct PackageStatus {
    pub name: String,
    pub installed: bool,
    pub current_version: Option<String>,
    pub available_update: bool,
    pub latest_version: Option<String>,
    pub check_success: bool,
    pub message: String,
}


// --- Event Emitter Function ---

/// Emits a progress update to the frontend via the Tauri event system.
fn emit_progress(handle: &AppHandle, step: &str, detail: &str) {
    let progress = PacmanProgress {
        current_step: step.to_string(),
        detail: detail.to_string(),
        timestamp: SystemTime::now(),
    };
    // FIX: Use handle.emit()
    let _ = handle.emit("pacman-progress", progress); 
}

// --- Main Tauri Command Function ---

#[tauri::command]
pub async fn manage_pacman_package(
    app_handle: AppHandle, // Needed for event emission
    operation: String,
    package_name: Option<String>,
) -> String {
    
    let mut command_args: Vec<String> = Vec::new();
    let op_desc;

    // --- 1. Build the Command Arguments based on operation ---
    match operation.as_str() {
        "install" => {
            command_args.extend(vec!["pacman".into(), "-S".into(), "--noconfirm".into()]);
            op_desc = "Installation";
            if let Some(pkg) = &package_name {
                command_args.push(pkg.clone());
            } else {
                 return json!(PacmanResult {
                    success: false,
                    message: "Package name is required for install.".to_string(),
                    operation: operation.clone(), package_name: None,
                }).to_string();
            }
        }
        "remove" => {
             command_args.extend(vec!["pacman".into(), "-Rns".into(), "--noconfirm".into()]);
             op_desc = "Removal";
             if let Some(pkg) = &package_name {
                command_args.push(pkg.clone());
             } else {
                 return json!(PacmanResult {
                    success: false,
                    message: "Package name is required for remove.".to_string(),
                    operation: operation.clone(), package_name: None,
                }).to_string();
             }
        }
        "update" => {
            command_args.extend(vec!["pacman".into(), "-Syu".into(), "--noconfirm".into()]);
            op_desc = "System Update";
        }
        _ => {
            return json!(PacmanResult {
                success: false,
                message: format!("Invalid operation: {}", operation),
                operation,
                package_name,
            }).to_string();
        }
    }


    // --- 2. Setup the Asynchronous pkexec Command ---
    emit_progress(&app_handle, op_desc, &format!("Executing elevated command via pkexec: {}", command_args.join(" ")));

    // Use pkexec for graphical privilege elevation
    // The command arguments contain the program to run ("pacman") followed by its args.
    let cmd = tokio::process::Command::new("pkexec") 
        .args(&command_args)
        .stdout(Stdio::piped()) 
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|e| format!("Failed to spawn command: {}", e));

    let mut child = match cmd {
        Ok(c) => c,
        Err(e) => {
            emit_progress(&app_handle, op_desc, &format!("Error: {}", e));
            return json!(PacmanResult {
                success: false, message: e, operation, package_name,
            }).to_string();
        }
    };
    
    // Extract and buffer the output streams for line-by-line reading
    let stdout = child.stdout.take().expect("Failed to get stdout handle");
    let stderr = child.stderr.take().expect("Failed to get stderr handle");

    let stdout_reader = BufReader::new(stdout);
    let stderr_reader = BufReader::new(stderr);
    let mut stdout_lines = stdout_reader.lines();
    let mut stderr_lines = stderr_reader.lines();

    // Clone handles for use in spawned threads
    let cloned_handle_out = app_handle.clone();
    let cloned_handle_err = app_handle.clone();
    
    // --- 3. Concurrently Process Output Streams ---
    
    // Task to read STDOUT lines and emit as progress
    let stdout_task = tokio::spawn(async move {
        while let Ok(Some(line)) = stdout_lines.next_line().await {
            emit_progress(&cloned_handle_out, "STDOUT", &line);
        }
    });

    // Task to read STDERR lines and emit as progress
    let stderr_task = tokio::spawn(async move {
        while let Ok(Some(line)) = stderr_lines.next_line().await {
            emit_progress(&cloned_handle_err, "STDERR", &line);
        }
    });
    
    // Wait for the stream readers to finish
    let _ = tokio::join!(stdout_task, stderr_task);
    
    // --- 4. Wait for Command to Finish and Process Exit Code ---
    
    let exit_status = child.wait().await;
    
    match exit_status {
        Ok(status) if status.success() => {
            emit_progress(
                &app_handle,
                op_desc,
                &format!("Operation successful. Exit code: {}", status.code().unwrap_or(0)),
            );
            json!(PacmanResult {
                success: true,
                message: format!("{} completed successfully.", op_desc),
                operation,
                package_name,
            }).to_string()
        }
        Ok(status) => {
            emit_progress(
                &app_handle,
                op_desc,
                &format!("Operation failed! Exit code: {}", status.code().unwrap_or(1)),
            );
            json!(PacmanResult {
                success: false,
                message: format!("{} failed with exit code: {}", op_desc, status.code().unwrap_or(1)),
                operation,
                package_name,
            }).to_string()
        }
        Err(e) => {
            emit_progress(&app_handle, op_desc, &format!("Command execution error: {}", e));
            json!(PacmanResult {
                success: false,
                message: format!("Command execution error: {}", e),
                operation,
                package_name,
            }).to_string()
        }
    }
}

#[tauri::command]
pub async fn check_package_status(app_handle: AppHandle, package_name: String) -> String {
    let mut status = PackageStatus {
        name: package_name.clone(),
        installed: false,
        current_version: None,
        available_update: false,
        latest_version: None,
        check_success: true,
        message: format!("Status check for {} initiated.", package_name),
    };
    
    emit_progress(&app_handle, "STATUS_CHECK", &format!("Checking installation status for: {}", package_name));

    // --- Step A: Check Installed Status and Current Version (pacman -Q) ---
    // pacman -Q will exit with code 0 if installed, 1 if not installed.
    match tokio::process::Command::new("pacman")
        .args(&["-Q", &package_name])
        .output()
        .await
    {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);

            if output.status.success() {
                // Example output: "htop 3.2.2-1"
                status.installed = true;
                if let Some(version_str) = stdout.split_whitespace().nth(1) {
                    status.current_version = Some(version_str.to_string());
                }
                emit_progress(&app_handle, "STATUS_CHECK", &format!("{} is installed. Version: {}", package_name, status.current_version.as_deref().unwrap_or("N/A")));
            } else {
                // Package is not installed
                status.installed = false;
                emit_progress(&app_handle, "STATUS_CHECK", &format!("{} is NOT installed.", package_name));
            }
        }
        Err(e) => {
            status.check_success = false;
            status.message = format!("Failed to execute pacman -Q: {}", e);
            emit_progress(&app_handle, "STATUS_CHECK_ERROR", &status.message);
            return json!(status).to_string();
        }
    }

    // --- Step B: Check Latest Version in Repositories (pacman -Si) ---
    emit_progress(&app_handle, "STATUS_CHECK", &format!("Checking latest repository version for: {}", package_name));

    match tokio::process::Command::new("pacman")
        .args(&["-Si", &package_name])
        .output()
        .await
    {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            
            if output.status.success() {
                // Parse the output to find the "Version" field
                if let Some(line) = stdout.lines().find(|l| l.trim().starts_with("Version")) {
                    // Extract the version string (e.g., "Version       : 3.2.2-2")
                    let latest_version = line.split(':').nth(1).unwrap_or("").trim().to_string();
                    
                    status.latest_version = Some(latest_version.clone());
                    
                    // Compare versions only if the package is installed
                    if status.installed {
                        // Simple string comparison usually works for pacman versions
                        if status.current_version.as_ref().map_or(false, |v| v != &latest_version) {
                            status.available_update = true;
                            emit_progress(&app_handle, "UPDATE_AVAILABLE", &format!("Update available! {} -> {}", status.current_version.as_deref().unwrap_or("N/A"), latest_version));
                        } else {
                            emit_progress(&app_handle, "STATUS_CHECK", "Package is up-to-date.");
                        }
                    }
                }
            } else {
                // If pacman -Si fails, the package likely doesn't exist in repositories
                status.check_success = false;
                status.message = format!("Package '{}' not found in repositories.", package_name);
                emit_progress(&app_handle, "STATUS_CHECK_ERROR", &status.message);
            }
        }
        Err(e) => {
            status.check_success = false;
            status.message = format!("Failed to execute pacman -Si: {}", e);
            emit_progress(&app_handle, "STATUS_CHECK_ERROR", &status.message);
        }
    }

    // --- 3. Return Final Status ---
    json!(status).to_string()
}