use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::process::Command;

const NVIDIA_VENDOR: &str = "10de";
const AMD_VENDOR:    &str = "1002";
const INTEL_VENDOR:  &str = "8086";

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct HardwareInfo {
    pub gpus: Vec<GpuInfo>,
    pub network_cards: Vec<NetworkCardInfo>,
    pub other_cards: Vec<HashMap<String, String>>,
    pub driver_packages: HashMap<String, DriverPackageInfo>,
    pub hybrid: Option<HybridInfo>,
}

/* ---------- GPU ---------- */
#[derive(Serialize, Deserialize, Debug, Default, Clone)]   // <-- added Clone
pub struct GpuInfo {
    pub vendor: String,
    pub model: String,
    pub driver_type: String,          // "proprietary" | "open_source" | "unknown"
    pub driver_module: String,        // kernel module name
    pub in_use: bool,                 // true if this GPU is the one currently rendering
}

/* ---------- Network ---------- */
#[derive(Serialize, Deserialize, Debug, Default)]
pub struct NetworkCardInfo {
    pub vendor: String,
    pub model: String,
    pub device: String,
}

/* ---------- Driver packages ---------- */
#[derive(Serialize, Deserialize, Debug)]
pub struct DriverPackageInfo {
    pub r#type: String,               // "proprietary" | "open_source"
    pub packages: Vec<String>,
    pub instructions: String,
    pub wiki_url: String,
    pub variants: Vec<DriverVariant>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DriverVariant {
    pub name: String,
    pub packages: Vec<String>,
    pub instructions: String,
    pub wiki_url: Option<String>,
}

/* ---------- Hybrid info ---------- */
#[derive(Serialize, Deserialize, Debug)]
pub struct HybridInfo {
    pub primary: String,
    pub secondary: String,
    pub switch_method: String,
    pub recommended_variant: String,
}

/* --------------------------------------------------------------- */
pub fn get_hardware_info() -> Result<HardwareInfo, String> {
    let mut info = HardwareInfo::default();

    // ---------- 1. PCI devices ----------
    let lspci = run_cmd("lspci", &["-nnk"])?;
    let pci_lines = lspci.lines().map(|s| s.to_string()).collect::<Vec<_>>(); // <-- no mut

    // ---------- 2. Loaded kernel modules ----------
    let lsmod = run_cmd("lsmod", &[])?;
    let loaded_modules: HashSet<String> = lsmod
        .lines()
        .filter_map(|l| l.split_whitespace().next().map(|s| s.to_string()))
        .collect();

    // ---------- 3. Xorg / Wayland renderer ----------
    let renderer = detect_current_renderer();

    // ---------- 4. Parse GPUs ----------
    let gpus = parse_gpus(&pci_lines, &loaded_modules, &renderer); // <-- no mut
    info.gpus = gpus;

    // ---------- 5. Hybrid detection ----------
    if info.gpus.len() > 1 {
        info.hybrid = detect_hybrid(&info.gpus, &loaded_modules);
    }

    // ---------- 6. Network & other cards ----------
    parse_other_devices(&pci_lines, &mut info);

    // ---------- 7. Driver package catalogue ----------
    populate_driver_catalog(&mut info);

    Ok(info)
}

/* ----------------------------------------------------------------- */
fn parse_gpus(
    lines: &[String],
    loaded: &HashSet<String>,
    renderer: &str,
) -> Vec<GpuInfo> {
    let mut gpus = Vec::new();
    let mut cur: Option<GpuInfo> = None;

    for line in lines {
        // VGA or 3D controller line
        if line.contains("VGA compatible controller") || line.contains("3D controller") {
            let (vendor, model) = extract_pci_info(line);
            cur = Some(GpuInfo {
                vendor: vendor.clone(),
                model: model.clone(),
                driver_type: "unknown".to_string(),
                driver_module: "unknown".to_string(),
                in_use: false,
            });
        }
        // "Kernel driver in use: …"
        else if let Some(ref mut gpu) = cur {
            if line.contains("Kernel driver in use:") {
                let module = line.split(':').nth(1).unwrap_or("").trim().to_string();
                gpu.driver_module = module.clone();
                gpu.driver_type = if module == "nvidia" {
                    "proprietary".to_string()
                } else {
                    "open_source".to_string()
                };

                // mark as currently rendering
                if renderer.contains(&module) || renderer.contains(&gpu.vendor) {
                    gpu.in_use = true;
                }

                gpus.push(gpu.clone());   // <-- now works
                cur = None;
            }
        }
    }
    gpus
}

/* ----------------------------------------------------------------- */
fn detect_hybrid(gpus: &[GpuInfo], loaded: &HashSet<String>) -> Option<HybridInfo> {
    let mut intel = None;
    let mut discrete = None;

    for g in gpus {
        if g.vendor.contains(INTEL_VENDOR) {
            intel = Some(g);
        } else if g.vendor.contains(NVIDIA_VENDOR) || g.vendor.contains(AMD_VENDOR) {
            discrete = Some(g);
        }
    }

    let (primary, secondary) = if let (Some(i), Some(d)) = (intel, discrete) {
        if i.in_use { (i, d) } else { (d, i) }
    } else {
        return None;
    };

    // Detect switch method
    let mut method = "none".to_string();
    if loaded.contains("nvidia") {
        if Command::new("prime-run").arg("--version").output().is_ok() {
            method = "prime-run".to_string();
        } else if std::path::Path::new("/usr/bin/optimus-manager").exists() {
            method = "optimus-manager".to_string();
        }
    }

    let rec = if primary.vendor.contains(NVIDIA_VENDOR) {
        "PRIME (nvidia-prime)".to_string()
    } else {
        "Intel iGPU (default)".to_string()
    };

    Some(HybridInfo {
        primary: primary.vendor.clone(),
        secondary: secondary.vendor.clone(),
        switch_method: method,
        recommended_variant: rec,
    })
}

/* ----------------------------------------------------------------- */
fn parse_other_devices(lines: &[String], info: &mut HardwareInfo) {
    for line in lines {
        if line.contains("Ethernet controller") || line.contains("Network controller") {
            let (vendor, model) = extract_pci_info(line);
            info.network_cards.push(NetworkCardInfo {
                vendor,
                model: model.clone(),
                device: extract_device_id(line),
            });
        } else if !line.contains("VGA") && line.contains('[') {
            let mut map = HashMap::new();
            map.insert("raw".to_string(), line.clone());
            info.other_cards.push(map);
        }
    }
}

/* ----------------------------------------------------------------- */
fn populate_driver_catalog(info: &mut HardwareInfo) {
    // ---------- NVIDIA ----------
    let mut nvidia = DriverPackageInfo {
        r#type: "proprietary".to_string(),
        packages: vec!["nvidia".to_string(), "nvidia-utils".to_string()],
        instructions: "sudo pacman -S nvidia nvidia-utils".to_string(),
        wiki_url: "https://wiki.archlinux.org/title/NVIDIA".to_string(),
        variants: vec![],
    };
    nvidia.variants.push(DriverVariant {
        name: "Open-source (nouveau)".to_string(),
        packages: vec!["xf86-video-nouveau".to_string()],
        instructions: "Blacklist nvidia module → edit /etc/modprobe.d/nouveau.conf".to_string(),
        wiki_url: Some("https://wiki.archlinux.org/title/Nouveau".to_string()),
    });
    nvidia.variants.push(DriverVariant {
        name: "PRIME (nvidia-prime)".to_string(),
        packages: vec!["nvidia-prime".to_string()],
        instructions: "sudo pacman -S nvidia-prime; prime-run <app>".to_string(),
        wiki_url: Some("https://wiki.archlinux.org/title/PRIME".to_string()),
    });
    nvidia.variants.push(DriverVariant {
        name: "optimus-manager".to_string(),
        packages: vec!["optimus-manager".to_string(), "optimus-manager-qt".to_string()],
        instructions: "sudo pacman -S optimus-manager; systemctl enable optimus-manager".to_string(),
        wiki_url: Some("https://github.com/Askannz/optimus-manager/wiki".to_string()),
    });
    info.driver_packages.insert("NVIDIA".to_string(), nvidia);

    // ---------- AMD ----------
    let amd = DriverPackageInfo {
        r#type: "open_source".to_string(),
        packages: vec!["mesa".to_string(), "xf86-video-amdgpu".to_string(), "vulkan-radeon".to_string()],
        instructions: "sudo pacman -S mesa xf86-video-amdgpu vulkan-radeon".to_string(),
        wiki_url: "https://wiki.archlinux.org/title/AMDGPU".to_string(),
        variants: vec![DriverVariant {
            name: "Legacy Radeon".to_string(),
            packages: vec!["xf86-video-ati".to_string()],
            instructions: "For pre-GCN cards".to_string(),
            wiki_url: Some("https://wiki.archlinux.org/title/ATI".to_string()),
        }],
    };
    info.driver_packages.insert("AMD".to_string(), amd);

    // ---------- Intel ----------
    let intel = DriverPackageInfo {
        r#type: "open_source".to_string(),
        packages: vec!["mesa".to_string(), "vulkan-intel".to_string()],
        instructions: "sudo pacman -S mesa vulkan-intel".to_string(),
        wiki_url: "https://wiki.archlinux.org/title/Intel_graphics".to_string(),
        variants: vec![],
    };
    info.driver_packages.insert("Intel".to_string(), intel);
}

/* ----------------------------------------------------------------- */
fn detect_current_renderer() -> String {
    if let Ok(out) = run_cmd("glxinfo", &["|", "grep", "OpenGL renderer"]) {
        return out.trim().to_string();
    }
    if let Ok(out) = run_cmd("weston-info", &["|", "grep", "renderer"]) {
        return out.trim().to_string();
    }
    "unknown".to_string()
}

/* ----------------------------------------------------------------- */
fn run_cmd(cmd: &str, args: &[&str]) -> Result<String, String> {
    Command::new(cmd)
        .args(args)
        .output()
        .map_err(|e| format!("{}: {}", cmd, e))
        .and_then(|o| {
            if o.status.success() {
                Ok(String::from_utf8_lossy(&o.stdout).to_string())
            } else {
                Err(format!("{} exited {}", cmd, o.status))
            }
        })
}

/* ----------------------------------------------------------------- */
fn extract_pci_info(line: &str) -> (String, String) {
    let vendor = line
        .split('[')
        .nth(1)
        .and_then(|s| s.split(':').next())
        .unwrap_or("????")
        .to_uppercase();
    let model = line.split(':').nth(2).unwrap_or("").trim().to_string();
    (vendor, model)
}
fn extract_device_id(line: &str) -> String {
    line.split('[')
        .nth(1)
        .and_then(|s| s.split(']').next())
        .unwrap_or("")
        .to_string()
}