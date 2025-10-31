// src/printer.rs
use crate::model::Printer;
// FIX for E0603 (struct is private): Use the specific private path recommended by the compiler for v2.2.0
use printers::{get_printers, common::base::printer::Printer as LibPrinter}; 
use std::process::Command;
use tauri::{AppHandle, Emitter, Wry}; // Emitter required for .emit()

/// Helper to convert from the `printers` crate's model to our model
fn to_printer_model(p: &LibPrinter) -> Printer {
    Printer {
        name: p.name.clone(),
        uri: p.system_name.clone(),
        is_default: p.is_default,
        // FIX for E0308 (mismatched types): Convert the PrinterState enum to a String using its Debug impl
        state: format!("{:?}", p.state),
    }
}

#[tauri::command]
pub fn list_printers() -> Result<Vec<Printer>, String> {
    let all_printers = get_printers();

    let printers = all_printers
        .iter()
        .map(to_printer_model)
        .collect();

    Ok(printers)
}

#[tauri::command]
pub fn add_printer(
    app_handle: AppHandle<Wry>,
    name: String,
    uri: String,
) -> Result<(), String> {
    println!("Attempting to add printer: {} with URI: {}", name, uri);
    let output = Command::new("lpadmin")
        .args([
            "-p", &name,
            "-E",
            "-v", &uri,
            "-m", "everywhere",
        ])
        .output()
        .map_err(|e| format!("Failed to execute lpadmin: {}", e))?;

    if output.status.success() {
        println!("Printer added successfully.");
        app_handle.emit("printers-changed", ()).unwrap();
        Ok(())
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        eprintln!("Failed to add printer: {}", error_msg);
        Err(format!("lpadmin error: {}", error_msg))
    }
}

#[tauri::command]
pub fn remove_printer(app_handle: AppHandle<Wry>, name: String) -> Result<(), String> {
    println!("Attempting to remove printer: {}", name);
    let output = Command::new("lpadmin")
        .args(["-x", &name])
        .output()
        .map_err(|e| format!("Failed to execute lpadmin: {}", e))?;

    if output.status.success() {
        println!("Printer removed successfully.");
        app_handle.emit("printers-changed", ()).unwrap();
        Ok(())
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        eprintln!("Failed to remove printer: {}", error_msg);
        Err(format!("lpadmin error: {}", error_msg))
    }
}