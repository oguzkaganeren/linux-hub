// model.rs
use serde::{Serialize};

// --- Core System Data Model ---

#[derive(Serialize, Clone, Debug)]
pub struct SystemData {
    pub os_info: OsInfo,
    pub boot_time_s: u64,
    pub uptime_s: u64,
    pub load_average: LoadAverage,
    pub memory: MemoryInfo,
    pub cpu: CpuSnapshot,
    pub disks: Vec<DiskInfo>,
    pub networks: Vec<NetworkData>,
    pub processes: Vec<ProcessSnapshot>,
    pub components: Vec<ComponentSnapshot>,
    pub users: Vec<UserInfo>,
}

#[derive(Serialize, Clone, Debug)]
pub struct OsInfo {
    pub name: String,
    pub kernel_version: String,
    pub os_version: String,
    pub long_os_version: String,
    pub host_name: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct LoadAverage {
    pub one_min: f64,
    pub five_min: f64,
    pub fifteen_min: f64,
}

#[derive(Serialize, Clone, Debug)]
pub struct MemoryInfo {
    pub total_kb: u64,
    pub available_kb: u64,
    pub used_kb: u64,
    pub total_swap_kb: u64,
    pub used_swap_kb: u64,
}

#[derive(Serialize, Clone, Debug)]
pub struct CpuSnapshot {
    pub physical_cores: Option<usize>,
    pub global_usage_percent: f32,
    pub brand: String,
    pub vendor_id: String,
    pub individual_cpus: Vec<CpuDetails>,
}

#[derive(Serialize, Clone, Debug)]
pub struct CpuDetails {
    pub name: String,
    pub usage_percent: f32,
    pub frequency_mhz: u64,
}

#[derive(Serialize, Clone, Debug)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub total_gb: f64,
    pub available_gb: f64,
}

#[derive(Serialize, Clone, Debug)]
pub struct NetworkData {
    pub interface_name: String,
    pub mac_address: String,
    pub received_bytes: u64,
    pub total_received_bytes: u64,
    pub transmitted_bytes: u64,
    pub total_transmitted_bytes: u64,
}

#[derive(Serialize, Clone, Debug)]
pub struct ProcessSnapshot {
    pub pid: u32,
    pub name: String,
    pub status: String,
    pub cpu_usage_percent: f32,
}

#[derive(Serialize, Clone, Debug)]
pub struct ComponentSnapshot {
    pub label: String,
    pub temperature_c: f32,
    pub max_c: f32,
    pub critical_c: Option<f32>,
}

#[derive(Serialize, Clone, Debug)]
pub struct UserInfo {
    pub name: String,
    pub groups: Vec<String>,
}

// --- Kernel Info Structures (from lib.rs) ---

#[derive(Debug, Serialize)]
pub struct KernelInfo {
    pub running_kernel: String,
    pub installed_kernels: Vec<InstalledKernel>,
    pub installable_kernels: Vec<InstallableKernel>,
}

#[derive(Debug, Serialize)]
pub struct InstalledKernel {
    pub name: String,
    pub version: String,
    pub flavor: String,
}

#[derive(Debug, Serialize)]
pub struct InstallableKernel {
    pub package_name: String,
    pub version: String,
    pub description: String,
    pub flavor: String,
}