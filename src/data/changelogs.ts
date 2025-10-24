export const kernelChangelogs: Record<string, string> = {
  'linux65': `
- **Security:** Patched several security vulnerabilities (CVE-2023-XXXX, CVE-2023-YYYY).
- **Drivers:** Updated Intel and AMD GPU drivers for better performance.
- **Filesystem:** Btrfs performance improvements and fixes.
- **Networking:** Added support for new Realtek Ethernet controllers.
  `,
  'linux64': `
- **Performance:** Scheduler improvements for multi-core CPUs.
- **Security:** Addressed a potential privilege escalation issue.
- **Drivers:** Initial support for next-gen WiFi cards.
- **Core:** Various bug fixes and stability improvements.
  `,
  'linux61': `
- **LTS:** Backported critical security fixes from newer kernels.
- **Stability:** Improved handling of I/O errors.
- **Drivers:** Fixed issues with certain older NVIDIA GPUs.
- **Power Management:** Enhanced suspend/resume reliability on laptops.
  `,
  'linux515': `
- **LTS:** Long-term support branch with ongoing security updates.
- **Compatibility:** Improved support for older hardware.
- **Filesystem:** Ext4 journaling enhancements.
- **Core:** Minor bug fixes and performance tweaks.
  `
};
