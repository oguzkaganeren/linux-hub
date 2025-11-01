import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import toast from 'react-hot-toast';
import { AppDispatch } from '../store/store';
import { setPrinters, removePrinterByName } from '../store/appSlice';
import { PrinterDevice } from '../types';

const mapPrinterFromRust = (rustPrinter: any): PrinterDevice => {
    // Clean device_uri: extract the actual URI part (e.g., usb://...)
    let deviceUri = rustPrinter.device_uri || '';
    const uriMatch = deviceUri.match(/(usb|socket|dnssd|ipp|ipps|cups-pdf):\/\/.*/);
    if (uriMatch) {
        deviceUri = uriMatch[0];
    }

    // The backend description is a long string of attributes, extract the actual description.
    // It's usually the first part in single quotes.
    let description = rustPrinter.description || '';
    const descriptionMatch = description.match(/'(.*?)'/);
    if (descriptionMatch && descriptionMatch[1]) {
        description = descriptionMatch[1];
    } else {
        // Fallback if parsing fails.
        description = rustPrinter.name;
    }

    // The backend location is also messy. Try to parse the real location
    // from the full description attribute string.
    let location = rustPrinter.location || '';
    const fullAttributeString = rustPrinter.description || '';
    const locationMatch = fullAttributeString.match(/printer-location=([^ ]+)/);
    if (locationMatch && locationMatch[1]) {
        location = locationMatch[1];
    } else {
        // Fallback: use the first word from the messy location field.
        location = location.split(' ')[0];
    }
    
    return {
        name: rustPrinter.name,
        deviceUri: deviceUri,
        description: description,
        location: location,
        isDefault: rustPrinter.is_default,
        state: rustPrinter.state,
        acceptingJobs: rustPrinter.accepting_jobs,
    };
};

export const getPrinters = async (): Promise<void> => {
  await invoke('get_printers');
};

export const addPrinterCmd = async (params: { 
    name: string; 
    deviceUri: string; 
    ppd: string; 
    description: string; 
    location: string 
}): Promise<void> => {
    await invoke('add_printer_cmd', {
        name: params.name,
        deviceUri: params.deviceUri,
        ppd: params.ppd,
        description: params.description,
        location: params.location,
    });
};

export const removePrinterCmd = async (name: string): Promise<void> => {
  await invoke('remove_printer_cmd', { name });
};

let unlisten: (() => void) | undefined;

export const initPrinterListener = async (dispatch: AppDispatch): Promise<() => void> => {
  if (unlisten) {
    unlisten();
  }
  
  unlisten = await listen('printer-event', (event) => {
    try {
        // FIX: The payload from Tauri is a JSON string which needs to be parsed.
        const data = JSON.parse(event.payload as string);
        console.log('Printer Event (Parsed):', data);

        if (data.List) {
            // FIX: Map and clean the potentially malformed data from the backend.
            const printers = data.List.map(mapPrinterFromRust);
            dispatch(setPrinters(printers));
        } else if (data.Added) {
            toast.success(`Printer added: ${data.Added}`);
            getPrinters(); // Re-fetch list to get full details
        } else if (data.Removed) {
            toast.success(`Printer removed: ${data.Removed}`);
            dispatch(removePrinterByName(data.Removed));
        } else if (data.Error) {
            toast.error(`Printer operation error: ${data.Error}`);
        }
    } catch(e) {
        console.error("Failed to parse printer event payload:", e, event.payload);
        toast.error('Failed to process printer update from system.');
    }
  });

  return () => {
    if (unlisten) {
      unlisten();
      unlisten = undefined;
    }
  };
};