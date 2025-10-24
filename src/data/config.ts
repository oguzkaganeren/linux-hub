import { Kernel } from '../types';

// --- Data ---
export const kernels: Kernel[] = [
    { version: '6.5.3-1', releaseType: 'stable', running: true, pkg: 'linux65' },
    { version: '6.4.16-2', releaseType: 'recommended', pkg: 'linux64' },
    { version: '6.1.55-1', releaseType: 'lts', pkg: 'linux61' },
    { version: '5.15.131-1', releaseType: 'lts', pkg: 'linux515' },
];

export const devices = [
    { name: '/dev/sda1', type: 'EXT4', size: '50 GB', used: '25 GB', usage: 50 },
    { name: '/dev/sdb1', type: 'NTFS', size: '1 TB', used: '750 GB', usage: 75 },
    { name: 'Home', type: 'EXT4', size: '400 GB', used: '120 GB', usage: 30 },
];

export const colors = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6'];
