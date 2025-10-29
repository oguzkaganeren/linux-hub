// FIX: Removed self-import that was causing multiple declaration conflicts.

// FIX: Update the PackageStatus enum to include an `Error` state,
// and add an optional `error` message field to the `PackageState` interface
// to store detailed error information.
export type Page = 'landing' | 'home' | 'packages' | 'configuration' | 'about';

export type ConfigPanel = 'home' | 'system' | 'kernel' | 'mirrors' | 'updates' | 'storage' | 'personalization' | 'monitor' | 'devices' | 'locale' | 'hardware' | 'processes' | 'sensors' | 'network' | 'users';

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
  progressDetail?: string;
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

// --- Hardware Info Types ---

export interface Gpu {
  vendor: string;
  model: string;
  driver_type: 'open_source' | 'proprietary';
  driver_module: string;
  in_use: boolean;
}

export interface HybridInfo {
  primary: string;
  secondary: string;
  switch_method: string;
  recommended_variant: string;
}

export interface DriverVariant {
  name: string;
  packages: string[];
  instructions?: string;
  wiki_url?: string;
}

export interface DriverPackage {
  type: 'proprietary' | 'open_source';
  packages: string[];
  instructions: string;
  wiki_url: string;
  variants: DriverVariant[];
}

export interface NetworkCard {
  vendor: string;
  model: string;
  device: string;
}

export interface OtherCard {
  raw: string;
}

export interface HardwareInfo {
  gpus: Gpu[];
  network_cards: NetworkCard[];
  other_cards: OtherCard[];
  hybrid: HybridInfo | null;
  driver_packages: Record<string, DriverPackage>;
}
