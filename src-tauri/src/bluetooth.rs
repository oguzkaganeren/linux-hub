// src/bluetooth.rs

use tauri::{AppHandle, Emitter, Runtime};
use bluer::{
    Adapter,
    Session,
    AdapterEvent, 
};
use crate::model::{
    BLUETOOTH_DEVICE_EVENT,
    BluetoothDevice,
    CommandResult,
    DeviceUpdate,
    parse_address,
};
use anyhow::Context;
use futures::stream::StreamExt;

// Utility function to get the default adapter
async fn get_adapter() -> anyhow::Result<Adapter> {
    let session = Session::new().await.context("Failed to get bluer session")?;
    let adapter = session.default_adapter().await.context("Failed to get default adapter")?;
    adapter.set_powered(true).await.context("Failed to power on adapter")?;
    Ok(adapter)
}

// Helper to send events to the frontend
fn emit_device_update<R: Runtime>(app_handle: &AppHandle<R>, update: DeviceUpdate) {
    if let Err(e) = app_handle.emit(BLUETOOTH_DEVICE_EVENT, update) {
        eprintln!("Failed to emit event: {}", e);
    }
}
#[tauri::command]
pub async fn list_paired_devices() -> Result<Vec<BluetoothDevice>, CommandResult> {
    let adapter = match get_adapter().await {
        Ok(a) => a,
        // Return a JSON-serializable CommandResult error for Tauri
        Err(e) => return Err(CommandResult::from(e)), 
    };

    let mut paired_devices: Vec<BluetoothDevice> = Vec::new();

    // Iterate over all devices known to BlueZ (which includes paired devices)
    match adapter.device_addresses().await.context("Failed to get known device addresses") {
        Ok(addresses) => {
            for address in addresses {
                // adapter.device() is synchronous
                if let Ok(device) = adapter.device(address) {
                    // Check the paired status property
                    if device.is_paired().await.unwrap_or(false) {
                        let dev_info = BluetoothDevice::from_bluer_device(&device).await;
                        paired_devices.push(dev_info);
                    }
                }
            }
        }
        Err(e) => {
            return Err(CommandResult::from(e));
        }
    }

    // Returning Ok(Vec<T>) results in a successful JSON array response
    Ok(paired_devices)
}
/// Command to start a continuous device discovery and emit updates to the frontend.
#[tauri::command]
pub async fn start_discovery<R: Runtime>(app_handle: AppHandle<R>) -> CommandResult {
    let adapter = match get_adapter().await {
        Ok(a) => a,
        Err(e) => return CommandResult::from(e),
    };

    tauri::async_runtime::spawn(async move {
        // Start discovery on the adapter.
        let discovery = match adapter.discover_devices().await.context("Failed to start device discovery") {
            Ok(d) => d,
            Err(e) => {
                eprintln!("Discovery failed to start: {}", e);
                return;
            }
        };

        eprintln!("Starting device discovery...");
        
        // Emit initial list of known devices
        for address in adapter.device_addresses().await.unwrap_or_default() {
            if let Ok(device) = adapter.device(address) {
                 let dev_info = BluetoothDevice::from_bluer_device(&device).await;
                 emit_device_update(&app_handle, DeviceUpdate::Discovered { device: dev_info });
            }
        }

        let mut adapter_events = adapter.events().await.unwrap();

        while let Some(event) = adapter_events.next().await {
            match event {
                // CORRECTED: Using DeviceAdded for both new devices and significant updates
                AdapterEvent::DeviceAdded(addr) => {
                    if let Ok(device) = adapter.device(addr) {
                        let dev_info = BluetoothDevice::from_bluer_device(&device).await;
                        emit_device_update(&app_handle, DeviceUpdate::Discovered { device: dev_info });
                    }
                },
                AdapterEvent::DeviceRemoved(addr) => {
                    emit_device_update(&app_handle, DeviceUpdate::Removed { address: addr.to_string() });
                },
                
                // Fallback for other AdapterEvents (like PropertyChanged for the Adapter itself)
                _ => {},
            }
        }

        drop(discovery);
    });
    
    CommandResult::ok("Bluetooth device discovery started.")
}

/// Command to attempt a connection to a specific device.
#[tauri::command]
pub async fn connect_device<R: Runtime>(app_handle: AppHandle<R>, address: String) -> CommandResult {
    let address_obj = match parse_address(&address) {
        Ok(a) => a,
        Err(e) => return CommandResult::from(e),
    };

    let adapter = match get_adapter().await {
        Ok(a) => a,
        Err(e) => return CommandResult::from(e),
    };

    // adapter.device() is synchronous.
    let device = match adapter.device(address_obj).context("Device not found") {
        Ok(d) => d,
        Err(e) => return CommandResult::from(e),
    };

    match device.connect().await {
        Ok(_) => {
            if let Ok(dev_info) = adapter.device(address_obj) {
                let dev_model = BluetoothDevice::from_bluer_device(&dev_info).await;
                emit_device_update(&app_handle, DeviceUpdate::Discovered { device: dev_model });
            }
            CommandResult::ok(format!("Successfully connected to {}", address))
        },
        Err(e) => CommandResult::error(format!("Failed to connect to {}: {}", address, e)),
    }
}

/// Command to disconnect from a specific device.
#[tauri::command]
pub async fn disconnect_device<R: Runtime>(app_handle: AppHandle<R>, address: String) -> CommandResult {
    let address_obj = match parse_address(&address) {
        Ok(a) => a,
        Err(e) => return CommandResult::from(e),
    };

    let adapter = match get_adapter().await {
        Ok(a) => a,
        Err(e) => return CommandResult::from(e),
    };

    // adapter.device() is synchronous.
    let device = match adapter.device(address_obj).context("Device not found") {
        Ok(d) => d,
        Err(e) => return CommandResult::from(e),
    };

    match device.disconnect().await {
        Ok(_) => {
            if let Ok(dev_info) = adapter.device(address_obj) {
                let dev_model = BluetoothDevice::from_bluer_device(&dev_info).await;
                emit_device_update(&app_handle, DeviceUpdate::Discovered { device: dev_model });
            }
            CommandResult::ok(format!("Successfully disconnected from {}", address))
        },
        Err(e) => CommandResult::error(format!("Failed to disconnect from {}: {}", address, e)),
    }
}

/// Command to pair with a specific device.
#[tauri::command]
pub async fn pair_device(address: String) -> CommandResult {
    let address_obj = match parse_address(&address) {
        Ok(a) => a,
        Err(e) => return CommandResult::from(e),
    };

    let adapter = match get_adapter().await {
        Ok(a) => a,
        Err(e) => return CommandResult::from(e),
    };

    // adapter.device() is synchronous.
    let device = match adapter.device(address_obj).context("Device not found") {
        Ok(d) => d,
        Err(e) => return CommandResult::from(e),
    };

    match device.pair().await {
        Ok(_) => CommandResult::ok(format!("Successfully paired with {}", address)),
        Err(e) => CommandResult::error(format!("Failed to pair with {}: {}", address, e)),
    }
}

/// Command to remove a device (unpair/forget).
#[tauri::command]
pub async fn remove_device(address: String) -> CommandResult {
    let address_obj = match parse_address(&address) {
        Ok(a) => a,
        Err(e) => return CommandResult::from(e),
    };

    let adapter = match get_adapter().await {
        Ok(a) => a,
        Err(e) => return CommandResult::from(e),
    };

    // Bluer's remove_device removes it from BlueZ's known devices list (unpairs/forgets it)
    match adapter.remove_device(address_obj).await {
        Ok(_) => CommandResult::ok(format!("Successfully removed device {}", address)),
        Err(e) => CommandResult::error(format!("Failed to remove device {}: {}", address, e)),
    }
}