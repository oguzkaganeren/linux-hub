// FIX: Removed self-import that was causing multiple declaration conflicts.

// FIX: Update the PackageStatus enum to include an `Error` state,
// and add an optional `error` message field to the `PackageState` interface
// to store detailed error information.
export type Page = 'landing' | 'home' | 'packages' | 'configuration' | 'about';

export type ConfigPanel = 'home'|'system' | 'kernel' | 'network' | 'updates' | 'storage' | 'personalization' | 'monitor' | 'devices' | 'locale' | 'hardware';

export interface App {
  name: string;
  icon: string;
  description: string;
  pkg: string;
  extra: string[];
  filter?: string[];
  desktop?: string[];
}

export interface Category {
  name: string;
  icon: string;
  description: string;
  apps: App[];
  filter?: string[];
}

export enum PackageStatus {
  NotInstalled,
  Installing,
  Installed,
  UpdateAvailable,
  Error,
}

export interface PackageState {
  status: PackageStatus;
  progress?: number;
  error?: string;
}

export type AllPackagesState = Record<string, PackageState>;

export interface Theme {
  mode: 'light' | 'dark';
  primaryColor: string;
}

export interface Kernel {
    version: string;
    releaseType: 'stable' | 'lts' | 'recommended';
    running?: boolean;
    pkg: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface BluetoothDevice {
    id: string;
    name: string;
    status: 'Connected' | 'Disconnected';
}

export interface PrinterDevice {
    id: string;
    name: string;
    status: 'Ready' | 'Offline' | 'Printing';
}

export interface SystemLocale {
  id: string; // e.g., 'en_US.UTF-8'
  name: string; // e.g., 'English (United States)'
}