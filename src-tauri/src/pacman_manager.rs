use serde::Serialize;
use std::process::Stdio;
use std::time::{Duration, SystemTime};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::time::timeout;
use serde_json::json;

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------
const COMMAND_TIMEOUT: Duration = Duration::from_secs(300); // 5 min per pacman op
const BATCH_TIMEOUT: Duration = Duration::from_secs(60);    // per package check

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
    // Keep the original for the JSON result
    let original_pkg = package_name.clone();

    // Owned string that lives for the whole function
    let pkg_owned: String = match package_name {
        Some(p) => p,
        None => {
            return json!(PacmanResult {
                success: false,
                message: "Package name required for install/remove.".into(),
                operation,
                package_name: None,
            })
            .to_string();
        }
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
    let results = futures::future::join_all(tasks).await;

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