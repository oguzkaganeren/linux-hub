import { invoke, InvokeArgs } from '@tauri-apps/api/core';
import { CommandResult, BluetoothDevice } from '../types';

/**
 * Calls the Rust backend command and handles the promise result.
 * @param cmd The Rust command name (e.g., 'start_discovery').
 * @param args An optional object of arguments (key names must match Rust's arguments, 
 * but are automatically converted to camelCase in JS if they're snake_case in Rust).
 */
async function callBluetoothCommand<T = CommandResult>(
  cmd: string,
  args: InvokeArgs = {}
): Promise<T> {
  try {
    const result = await invoke<T>(cmd, args);
    console.log(`[Success] ${cmd}:`, result);
    return result;
  } catch (error) {
    console.error(`[Error] ${cmd}:`, error);
    throw new Error(`Bluetooth operation failed: ${error}`);
  }
}

/**
 * Starts the Bluetooth device discovery process.
 */
export const startDiscovery = async (): Promise<CommandResult> => {
  return callBluetoothCommand('start_discovery');
};

/**
 * Connects to a specific Bluetooth device.
 * @param deviceAddress The address of the device to connect to (e.g., "AA:BB:CC:DD:EE:FF").
 */
export const connectDevice = async (deviceAddress: string): Promise<CommandResult> => {
  return callBluetoothCommand('connect_device', { deviceAddress });
};

/**
 * Disconnects from a specific Bluetooth device.
 * @param deviceAddress The address of the device to disconnect from.
 */
export const disconnectDevice = async (deviceAddress: string): Promise<CommandResult> => {
  return callBluetoothCommand('disconnect_device', { deviceAddress });
};

/**
 * Initiates the pairing process with a device.
 * @param deviceAddress The address of the device to pair with.
 */
export const pairDevice = async (deviceAddress: string): Promise<CommandResult> => {
  return callBluetoothCommand('pair_device', { deviceAddress });
};

/**
 * Removes (unpairs) a device from the system.
 * @param deviceAddress The address of the device to remove.
 */
export const removeDevice = async (deviceAddress: string): Promise<CommandResult> => {
  return callBluetoothCommand('remove_device', { deviceAddress });
};

/**
 * Retrieves a list of paired Bluetooth devices.
 */
export const listPairedDevices = async (): Promise<BluetoothDevice[]> => {
    const devices = await callBluetoothCommand<any[]>('list_paired_devices');
    // Map from Rust's snake_case to JS's camelCase if needed,
    // and match the BluetoothDevice type structure.
    return devices.map(d => ({
        name: d.name,
        address: d.address,
        connected: d.isConnected,
        paired: d.isPaired,
        rssi: d.rssi,
    }));
};
