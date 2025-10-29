use serde::Serialize;
use std::process::Stdio;
use std::time::{Duration, SystemTime};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::time::timeout;
use serde_json::json;
use tokio::fs::File;
use chrono::{DateTime, Utc};
use futures::future;

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------
const COMMAND_TIMEOUT: Duration = Duration::from_secs(300); // 5 min per pacman op
const BATCH_TIMEOUT: Duration = Duration::from_secs(60);    // per package check
const PACMAN_LOG_PATH: &str = "/var/log/pacman.log"; // Standard path for pacman log

// -----------------------------------------------------------------------------
// Data structures
// -----------------------------------------------------------------------------
#[derive(Debug, Serialize)]
pub struct PacmanResult {
    pub success: bool,
    pub message: String,
    pub operation: String,
    pub package_name: Option<String>,
}

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

#[derive(Debug, Serialize)]
pub struct SystemUpdateStatus {
    pub updates_available: bool,
    pub pending_updates_count: usize,
    // ISO 8601 formatted String from chrono
    pub last_update_date: Option<String>, 
    pub check_success: bool,
    pub message: String,
}

// -----------------------------------------------------------------------------
// Helper: emit progress to the frontend
// -----------------------------------------------------------------------------
fn emit_progress(handle: &AppHandle, step: &str, detail: &str) {
    let progress = PacmanProgress {
        current_step: step.to_string(),
        detail: detail.to_string(),
        timestamp: SystemTime::now(),
    };
    let _ = handle.emit("pacman-progress", progress);
}

// -----------------------------------------------------------------------------
// Helper: run a command with streamed output + timeout
// -----------------------------------------------------------------------------
async fn run_command_with_output(
    program: &str,
    args: &[&str],
    app_handle: &AppHandle,
    op_desc: &str,
) -> Result<(String, String), String> {
    let prog = program.to_string();
    let args_str = args.join(" ");
    emit_progress(app_handle, op_desc, &format!("Running: {} {}", prog, args_str));

    let mut child = Command::new(program)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|e| format!("Failed to spawn {}: {}", prog, e))?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    let mut stdout_reader = BufReader::new(stdout).lines();
    let mut stderr_reader = BufReader::new(stderr).lines();

    let out_handle = app_handle.clone();
    let err_handle = app_handle.clone();

    let stdout_task = tokio::spawn(async move {
        while let Ok(Some(line)) = stdout_reader.next_line().await {
            emit_progress(&out_handle, "STDOUT", &line);
        }
    });

    let stderr_task = tokio::spawn(async move {
        while let Ok(Some(line)) = stderr_reader.next_line().await {
            emit_progress(&err_handle, "STDERR", &line);
        }
    });

    // Wait for the child with timeout
    let output = timeout(COMMAND_TIMEOUT, child.wait_with_output())
        .await
        .map_err(|_| format!("Command timed out after {:?}", COMMAND_TIMEOUT))?
        .map_err(|e| e.to_string())?;

    let _ = tokio::join!(stdout_task, stderr_task);

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    Ok((stdout, stderr))
}

// -----------------------------------------------------------------------------
// Tauri command: install / remove / update (single operation)
// -----------------------------------------------------------------------------
#[tauri::command]
pub async fn manage_pacman_package(
    app_handle: AppHandle,
    operation: String,
    package_name: Option<String>,
) -> String {
    // Note: The logic for "update" here is now primarily handled by run_system_update,
    // but kept here for backward compatibility/simplicity of single package update if needed.
    
    let original_pkg = package_name.clone();

    let pkg_owned: String = match package_name.clone() {
        Some(p) => p,
        None if operation.as_str() != "update" => {
            return json!(PacmanResult {
                success: false,
                message: "Package name required for install/remove.".into(),
                operation,
                package_name: None,
            })
            .to_string();
        },
        _ => String::new(), // Allows update operation without pkg name
    };

    let (program, args_vec, op_desc): (&str, Vec<&str>, &str) = match operation.as_str() {
        "install" => (
            "pkexec",
            vec!["pacman", "-S", "--noconfirm", &pkg_owned],
            "Installation",
        ),
        "remove" => (
            "pkexec",
            vec!["pacman", "-Rns", "--noconfirm", &pkg_owned],
            "Removal",
        ),
        "update" => ("pkexec", vec!["pacman", "-Syu", "--noconfirm"], "System Update"),
        _ => {
            return json!(PacmanResult {
                success: false,
                message: format!("Invalid operation: {}", operation),
                operation,
                package_name: original_pkg,
            })
            .to_string();
        }
    };

    emit_progress(&app_handle, op_desc, &format!("Starting {}...", op_desc));

    match run_command_with_output(program, &args_vec, &app_handle, op_desc).await {
        Ok((_, _)) => {
            let msg = format!("{} completed successfully.", op_desc);
            emit_progress(&app_handle, op_desc, &msg);
            json!(PacmanResult {
                success: true,
                message: msg,
                operation,
                package_name: original_pkg,
            })
            .to_string()
        }
        Err(e) => {
            emit_progress(&app_handle, op_desc, &format!("Failed: {}", e));
            json!(PacmanResult {
                success: false,
                message: e,
                operation,
                package_name: original_pkg,
            })
            .to_string()
        }
    }
}

// -----------------------------------------------------------------------------
// Helper: extract a version string from pacman output
// -----------------------------------------------------------------------------
fn parse_version_from_line(line: &str) -> Option<String> {
    // pacman -Q  →  "pkgname 1.2.3-1"
    if let Some(v) = line.split_whitespace().nth(1) {
        return Some(v.to_string());
    }

    // pacman -Si → "Version : 1.2.3-2"
    if let Some(colon_part) = line.split(':').nth(1) {
        let trimmed = colon_part.trim();
        if let Some(v) = trimmed.split_whitespace().next() {
            return Some(v.to_string());
        }
    }

    None
}

// -----------------------------------------------------------------------------
// Tauri command: check **multiple** packages in parallel
// -----------------------------------------------------------------------------
#[tauri::command]
pub async fn check_packages_status(
    app_handle: AppHandle,
    package_names: Vec<String>,
) -> String {
    if package_names.is_empty() {
        return json!(vec![] as Vec<PackageStatus>).to_string();
    }

    emit_progress(
        &app_handle,
        "BATCH_CHECK",
        &format!("Checking {} packages...", package_names.len()),
    );

    let tasks = package_names.into_iter().map(|pkg| {
        let handle = app_handle.clone();
        tokio::spawn(async move {
            let mut status = PackageStatus {
                name: pkg.clone(),
                installed: false,
                current_version: None,
                available_update: false,
                latest_version: None,
                check_success: true,
                message: format!("Checking {}", pkg),
            };

            // ---------- 1. pacman -Q (installed?) ----------
            let q_res = timeout(
                BATCH_TIMEOUT,
                Command::new("pacman").args(["-Q", &pkg]).output(),
            )
            .await;

            match q_res {
                Ok(Ok(out)) if out.status.success() => {
                    let txt = String::from_utf8_lossy(&out.stdout);
                    if let Some(ver) = parse_version_from_line(&txt) {
                        status.installed = true;
                        status.current_version = Some(ver.clone());
                        emit_progress(&handle, "INSTALLED", &format!("{} v{}", pkg, ver));
                    }
                }
                _ => {
                    emit_progress(&handle, "NOT_INSTALLED", &format!("{} is not installed", pkg));
                }
            }

            // ---------- 2. pacman -Si (repo version) ----------
            let si_res = timeout(
                BATCH_TIMEOUT,
                Command::new("pacman").args(["-Si", &pkg]).output(),
            )
            .await;

            match si_res {
                Ok(Ok(out)) if out.status.success() => {
                    let txt = String::from_utf8_lossy(&out.stdout);
                    if let Some(ver_line) = txt.lines().find(|l| l.trim().starts_with("Version")) {
                        if let Some(latest) = parse_version_from_line(ver_line) {
                            status.latest_version = Some(latest.clone());

                            if status.installed {
                                if status.current_version.as_deref() != Some(&latest) {
                                    status.available_update = true;
                                    emit_progress(
                                        &handle,
                                        "UPDATE_AVAILABLE",
                                        &format!(
                                            "{}: {} to {}",
                                            pkg,
                                            status.current_version.as_deref().unwrap_or("?"),
                                            latest
                                        ),
                                    );
                                } else {
                                    emit_progress(&handle, "UP_TO_DATE", &format!("{} is up to date", pkg));
                                }
                            }
                        }
                    }
                }
                _ => {
                    status.check_success = false;
                    status.message = format!("Package '{}' not found in repositories", pkg);
                    emit_progress(&handle, "NOT_IN_REPO", &status.message);
                }
            }

            status
        })
    });

    // ---- Collect all results ------------------------------------------------
    let results = future::join_all(tasks).await;

    let mut final_results = Vec::with_capacity(results.len());
    for res in results {
        match res {
            Ok(st) => final_results.push(st),
            Err(e) => final_results.push(PackageStatus {
                name: "unknown".into(),
                installed: false,
                current_version: None,
                available_update: false,
                latest_version: None,
                check_success: false,
                message: format!("Task error: {}", e),
            }),
        }
    }

    json!(final_results).to_string()
}

// -----------------------------------------------------------------------------
// Backward-compatible wrapper (single package)
// -----------------------------------------------------------------------------
#[tauri::command]
pub async fn check_package_status(app_handle: AppHandle, package_name: String) -> String {
    check_packages_status(app_handle, vec![package_name]).await
}

// -----------------------------------------------------------------------------
// Helper: Get Last Update Date with Chrono
// -----------------------------------------------------------------------------
async fn get_last_update_date(app_handle: &AppHandle) -> Option<String> {
    emit_progress(app_handle, "LAST_UPDATE", &format!("Reading log file: {}", PACMAN_LOG_PATH));
    
    let file = match File::open(PACMAN_LOG_PATH).await {
        Ok(f) => f,
        Err(e) => {
            emit_progress(app_handle, "LOG_ERROR", &format!("Failed to open log: {}", e));
            return None;
        }
    };

    let reader = BufReader::new(file);
    let mut lines = reader.lines();
    let mut last_date_time: Option<DateTime<Utc>> = None;

    while let Ok(Some(line)) = lines.next_line().await {
        if line.contains("[ALPM] transaction completed") {
            if let Some(start) = line.find('[') {
                if let Some(end) = line.find(']') {
                    let timestamp_str = &line[start + 1..end];
                    
                    match DateTime::parse_from_str(timestamp_str, "%Y-%m-%dT%H:%M:%S%#z") {
                        Ok(dt) => {
                            last_date_time = Some(dt.with_timezone(&Utc));
                        },
                        Err(e) => {
                            emit_progress(app_handle, "DATE_PARSE_ERROR", &format!("Failed to parse date '{}': {}", timestamp_str, e));
                        }
                    }
                }
            }
        }
    }
    
    if let Some(dt) = last_date_time {
        let formatted_date = dt.to_rfc3339();
        emit_progress(app_handle, "LAST_UPDATE", &format!("Found last update: {}", formatted_date));
        Some(formatted_date)
    } else {
        emit_progress(app_handle, "LAST_UPDATE", "No successful system update entry found in log.");
        None
    }
}

// -----------------------------------------------------------------------------
// TAURI COMMAND: Check System Updates
// -----------------------------------------------------------------------------
#[tauri::command]
pub async fn check_system_updates(app_handle: AppHandle) -> String {
    emit_progress(&app_handle, "SYSTEM_UPDATE_CHECK", "Starting system update check...");

    let mut status = SystemUpdateStatus {
        updates_available: false,
        pending_updates_count: 0,
        last_update_date: None,
        check_success: true,
        message: "Check successful.".into(),
    };

    // --- 1. Check for available updates (`pacman -Qu`) ---
    emit_progress(&app_handle, "UPDATES_AVAILABLE", "Running pacman -Qu...");
    
    match timeout(Duration::from_secs(15), Command::new("pacman").args(["-Qu"]).output()).await {
        Ok(Ok(output)) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            
            let updates_count = stdout.lines().filter(|l| !l.trim().is_empty()).count();
            
            status.pending_updates_count = updates_count;
            status.updates_available = updates_count > 0;
            
            if status.updates_available {
                status.message = format!("{} updates are available.", updates_count);
                emit_progress(&app_handle, "UPDATES_AVAILABLE", &status.message);
            } else {
                status.message = "System is up to date.".into();
                emit_progress(&app_handle, "UPDATES_AVAILABLE", &status.message);
            }
        }
        Ok(Err(e)) => {
            status.check_success = false;
            status.message = format!("Failed to run 'pacman -Qu': {}", e);
            emit_progress(&app_handle, "ERROR", &status.message);
        }
        Err(_) => {
            status.check_success = false;
            status.message = "Command 'pacman -Qu' timed out.".into();
            emit_progress(&app_handle, "ERROR", &status.message);
        }
    }

    // --- 2. Get last update date ---
    status.last_update_date = get_last_update_date(&app_handle).await;
        
    // Update the final message
    if status.last_update_date.is_some() {
        let date_str = status.last_update_date.as_ref().unwrap();
        if status.updates_available {
            status.message = format!("{}. Last update: {}", status.message, date_str);
        } else {
            status.message = format!("System is up to date. Last update: {}", date_str);
        }
    } else if status.check_success {
        status.message = format!("{}. Note: Could not determine last update date (check log file access).", status.message);
    }

    json!(status).to_string()
}
