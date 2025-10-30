// system.rs - FINAL, DEFINITIVE CORRECTED VERSION
use tauri::{AppHandle, Wry}; 
use tauri::Emitter; // NEW: Explicitly import the Emitter trait as required by the compiler
use sysinfo::{
    Components, Disks, Networks, System, Users, CpuRefreshKind,
    MemoryRefreshKind, RefreshKind, ProcessRefreshKind, 
};
use std::time::Duration;
use crate::model::*; // Import the shared data models

// Define the event name for the frontend to listen to
pub const SYSTEM_INFO_EVENT: &str = "system-info-update";

/// Gathers the current state of system information into the SystemData struct.
pub fn get_system_data(
    sys: &mut System, 
    networks: &mut Networks, 
    disks: &Disks, 
    components: &Components, 
    users: &Users
) -> SystemData {
    
    // 1. Refresh what changes frequently: CPU, Memory, Processes
    let refresh_kind = RefreshKind::nothing()
        .with_cpu(CpuRefreshKind::everything())
        .with_memory(MemoryRefreshKind::everything())
        .with_processes(ProcessRefreshKind::everything()); // Fixed sysinfo argument

    sys.refresh_specifics(refresh_kind);
    
    networks.refresh(false); // Fixed sysinfo argument

    // --- 2. Gather OS Info (Static) ---
    let os_info = OsInfo {
        name: System::name().unwrap_or_else(|| "<unknown>".to_owned()),
        kernel_version: System::kernel_version().unwrap_or_else(|| "<unknown>".to_owned()),
        os_version: System::os_version().unwrap_or_else(|| "<unknown>".to_owned()),
        long_os_version: System::long_os_version().unwrap_or_else(|| "<unknown>".to_owned()),
        host_name: System::host_name().unwrap_or_else(|| "<unknown>".to_owned()),
    };

    // --- 3. Gather Uptime and Load (Dynamic) ---
    let load_avg = System::load_average();

    // --- 4. Gather Memory Info (Dynamic) ---
    let memory = MemoryInfo {
        total_kb: sys.total_memory() / 1_000,
        available_kb: sys.available_memory() / 1_000,
        used_kb: sys.used_memory() / 1_000,
        total_swap_kb: sys.total_swap() / 1_000,
        used_swap_kb: sys.used_swap() / 1_000,
    };

    // --- 5. Gather CPU Info (Dynamic) ---
    let individual_cpus: Vec<CpuDetails> = sys.cpus().iter().map(|cpu| CpuDetails {
        name: cpu.name().to_string(),
        usage_percent: cpu.cpu_usage(),
        frequency_mhz: cpu.frequency(),
    }).collect();

    let cpu = CpuSnapshot {
        physical_cores: System::physical_core_count(),
        global_usage_percent: sys.global_cpu_usage(),
        brand: sys.cpus().get(0).map(|c| c.brand().to_string()).unwrap_or_else(|| "<unknown>".to_owned()),
        vendor_id: sys.cpus().get(0).map(|c| c.vendor_id().to_string()).unwrap_or_else(|| "<unknown>".to_owned()),
        individual_cpus,
    };

    // --- 6. Gather Disk Info (Mostly Static) ---
    let disks: Vec<DiskInfo> = disks.list().iter().map(|disk| DiskInfo {
        name: disk.name().to_string_lossy().into_owned(),
        mount_point: disk.mount_point().to_string_lossy().into_owned(),
        total_gb: disk.total_space() as f64 / 1024_f64.powi(3),
        available_gb: disk.available_space() as f64 / 1024_f64.powi(3),
    }).collect();

    // --- 7. Gather Network Info (Dynamic) ---
    let networks: Vec<NetworkData> = networks.list().iter().map(|(name, data)| NetworkData {
        interface_name: name.clone(),
        mac_address: data.mac_address().to_string(),
        received_bytes: data.received(),
        total_received_bytes: data.total_received(),
        transmitted_bytes: data.transmitted(),
        total_transmitted_bytes: data.total_transmitted(),
    }).collect();

    // --- 8. Gather Processes (Dynamic, Top 10 by CPU) ---
    let mut processes_vec: Vec<_> = sys.processes().values().collect();
    processes_vec.sort_by(|a, b| b.cpu_usage().partial_cmp(&a.cpu_usage()).unwrap_or(std::cmp::Ordering::Equal));
    let processes: Vec<ProcessSnapshot> = processes_vec.iter().take(10).map(|p| ProcessSnapshot {
        pid: p.pid().as_u32(),
        name: p.name().to_string_lossy().into_owned(),
        status: format!("{:?}", p.status()),
        cpu_usage_percent: p.cpu_usage(),
    }).collect();

    // --- 9. Gather Components (Temperature, Dynamic) ---
    let components: Vec<ComponentSnapshot> = components.iter().filter_map(|c| {
        if let Some(temp) = c.temperature() {
            Some(ComponentSnapshot {
                label: c.label().to_string(),
                temperature_c: temp,
                max_c: c.max().unwrap_or(0.0),
                critical_c: c.critical(),
            })
        } else {
            None
        }
    }).collect();

    // --- 10. Gather Users (Static) ---
    let users: Vec<UserInfo> = users.list().iter().map(|u| UserInfo {
        name: u.name().to_string(),
        groups: u.groups().iter().map(|g| g.name().to_string()).collect(),
    }).collect();

    // --- 11. Assemble the final data structure ---
    SystemData {
        os_info,
        boot_time_s: System::boot_time(),
        uptime_s: System::uptime(),
        load_average: LoadAverage {
            one_min: load_avg.one,
            five_min: load_avg.five,
            fifteen_min: load_avg.fifteen,
        },
        memory,
        cpu,
        disks,
        networks,
        processes,
        components,
        users,
    }
}

/// The asynchronous main function to run the live system monitoring loop.
pub fn run_live_monitor(app_handle: AppHandle<Wry>) {
    std::thread::spawn(move || {
        let mut sys = System::new();
        let disks = Disks::new_with_refreshed_list();
        let components = Components::new_with_refreshed_list();
        let users = Users::new_with_refreshed_list();
        let mut networks = Networks::new_with_refreshed_list();

        // Main monitoring loop
        loop {
            let data = get_system_data(&mut sys, &mut networks, &disks, &components, &users);

            match serde_json::to_string(&data) {
                Ok(json) => {
                    // FIX: The Emitter trait is now in scope, allowing the use of .emit()
                    if let Err(e) = app_handle.emit(SYSTEM_INFO_EVENT, json) {
                        eprintln!("Failed to emit system info event: {}", e);
                    }
                },
                Err(e) => {
                    eprintln!("Failed to serialize system data: {}", e);
                }
            }

            // Wait for the next update (e.g., every 1 second)
            std::thread::sleep(Duration::from_secs(1));
        }
    });
}

// Command to start the monitoring (will be called from lib.rs)
#[tauri::command]
pub fn start_system_monitor(app_handle: AppHandle<Wry>) -> Result<(), String> {
    run_live_monitor(app_handle);
    Ok(())
}