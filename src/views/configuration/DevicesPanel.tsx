import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, X, Loader, RefreshCw } from "lucide-react";
import { listen } from "@tauri-apps/api/event";

import BlurredCard from "../../components/BlurredCard";
import Panel from "../../components/configuration/Panel";
import AppIcon from "../../components/icons";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  addPrinter,
  removePrinter,
  bluetoothDeviceDiscovered,
  bluetoothDeviceRemoved,
} from "../../store/appSlice";
import { translations } from "../../data/translations";
import {
  BluetoothDevice,
  PrinterDevice,
  BluetoothDeviceEvent,
} from "../../types";
import * as bluetooth from "../../lib/bluetooth";

const DevicesPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { language, bluetoothDevices, printers } = useAppSelector(
    (state) => state.app
  );

  const [isDiscovering, setIsDiscovering] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      unlisten = await listen<BluetoothDeviceEvent>(
        "bluetooth-device-update",
        (event) => {
          const update = event.payload;
          if (update.type === "discovered") {
            dispatch(bluetoothDeviceDiscovered(update.device));
          } else if (update.type === "removed") {
            dispatch(bluetoothDeviceRemoved(update.address));
          }
        }
      );
    };

    const fetchInitialDevices = async () => {
      try {
        const devices = await bluetooth.listPairedDevices();
        devices.forEach((device) =>
          dispatch(bluetoothDeviceDiscovered(device))
        );
      } catch (error) {
        toast.error(`Failed to load paired devices: ${error}`);
      }
    };

    setupListener();
    fetchInitialDevices();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [dispatch]);

  const handleStartDiscovery = async () => {
    setIsDiscovering(true);
    toast(t("toast_searching_devices"));
    try {
      await bluetooth.startDiscovery();
      // Discovery usually runs for a short period. We'll stop the visual indicator after 20s.
      setTimeout(() => setIsDiscovering(false), 20000);
    } catch (error) {
      toast.error(String(error));
      setIsDiscovering(false);
    }
  };

  const createDeviceActionHandler = (
    action: (address: string) => Promise<any>,
    successMsg: string,
    errorMsg: string
  ) => {
    return async (device: BluetoothDevice) => {
      setPendingAction(device.address);
      try {
        await action(device.address);
        toast.success(`${device.name || device.address}: ${successMsg}`);
      } catch (error) {
        toast.error(`${device.name || device.address}: ${errorMsg}. ${error}`);
      } finally {
        setPendingAction(null);
      }
    };
  };

  const handleConnect = createDeviceActionHandler(
    bluetooth.connectDevice,
    "Connected",
    "Connection failed"
  );
  const handleDisconnect = createDeviceActionHandler(
    bluetooth.disconnectDevice,
    "Disconnected",
    "Disconnect failed"
  );
  const handlePair = createDeviceActionHandler(
    bluetooth.pairDevice,
    "Pairing successful",
    "Pairing failed"
  );
  const handleRemove = async (device: BluetoothDevice) => {
    setPendingAction(device.address);
    try {
      await bluetooth.removeDevice(device.address);
      // Optimistically remove from UI
      dispatch(bluetoothDeviceRemoved(device.address));
      toast.success(`${device.name || device.address}: Removed`);
    } catch (error) {
      toast.error(
        `${device.name || device.address}: Failed to remove. ${error}`
      );
    } finally {
      setPendingAction(null);
    }
  };

  // --- Printer logic (unchanged) ---
  const handleAddPrinter = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
      loading: t("toast_searching_devices"),
      success: () => {
        const newPrinter: PrinterDevice = {
          id: `pr-${Date.now()}`,
          name: "Canon PIXMA TS6420a",
          status: "Ready",
        };
        dispatch(addPrinter(newPrinter));
        return t("toast_device_added");
      },
      error: "Failed to add device",
    });
  };

  const handleRemovePrinter = (id: string) => {
    dispatch(removePrinter(id));
    toast.success(t("toast_device_removed"));
  };

  const getStatusChip = (status: string) => {
    const s = status.toLowerCase();
    let colorClasses =
      "bg-gray-200 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300";
    if (s.includes("connected") || s.includes("ready")) {
      colorClasses =
        "bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300";
    } else if (s.includes("offline") || s.includes("disconnected")) {
      colorClasses =
        "bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300";
    } else if (s.includes("printing")) {
      colorClasses =
        "bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300";
    }
    return (
      <span
        className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorClasses}`}
      >
        {status}
      </span>
    );
  };

  const renderBluetoothDeviceActions = (device: BluetoothDevice) => {
    if (pendingAction === device.address) {
      return <Loader size={20} className="animate-spin text-gray-500" />;
    }
    return (
      <div className="flex items-center gap-2">
        {!device.paired && (
          <button
            onClick={() => handlePair(device)}
            className="px-3 py-1 text-sm bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors"
          >
            Pair
          </button>
        )}
        {device.paired && !device.connected && (
          <button
            onClick={() => handleConnect(device)}
            className="px-3 py-1 text-sm bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 transition-colors"
          >
            Connect
          </button>
        )}
        {device.connected && (
          <button
            onClick={() => handleDisconnect(device)}
            className="px-3 py-1 text-sm bg-yellow-500 text-black font-semibold rounded-md hover:bg-yellow-600 transition-colors"
          >
            Disconnect
          </button>
        )}
        {device.paired && (
          <button
            onClick={() => handleRemove(device)}
            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-500/20 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>
    );
  };

  return (
    <Panel title={t("device_management")}>
      {/* Bluetooth Devices */}
      <BlurredCard className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t("bluetooth_devices")}</h2>
          <button
            onClick={handleStartDiscovery}
            disabled={isDiscovering}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:brightness-90 transition-all disabled:opacity-70 disabled:cursor-wait"
          >
            {isDiscovering ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {isDiscovering ? "Scanning..." : "Scan for Devices"}
          </button>
        </div>
        <div className="space-y-2">
          {bluetoothDevices.map((device) => (
            <div
              key={device.address}
              className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <AppIcon
                  name="bluetooth"
                  className="w-5 h-5 text-gray-600 dark:text-gray-300 flex-shrink-0"
                />
                <div className="overflow-hidden">
                  <p className="font-medium truncate">
                    {device.name || "Unknown Device"}
                  </p>
                  <p className="text-xs font-mono text-gray-500">
                    {device.address}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {device.connected && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                    Connected
                  </span>
                )}
                {device.paired && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                    Paired
                  </span>
                )}
                {renderBluetoothDeviceActions(device)}
              </div>
            </div>
          ))}
          {bluetoothDevices.length === 0 && !isDiscovering && (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              No Bluetooth devices found. Try scanning.
            </div>
          )}
        </div>
      </BlurredCard>

      {/* Printers */}
      <BlurredCard className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t("printers")}</h2>
          <button
            onClick={handleAddPrinter}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:brightness-90 transition-all"
          >
            <Plus size={16} /> {t("add_printer")}
          </button>
        </div>
        <div className="space-y-2">
          {printers.map((printer) => (
            <div
              key={printer.id}
              className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <AppIcon
                  name="printer"
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                />
                <p className="font-medium">{printer.name}</p>
              </div>
              <div className="flex items-center gap-4">
                {getStatusChip(printer.status)}
                <button
                  onClick={() => handleRemovePrinter(printer.id)}
                  className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </BlurredCard>
    </Panel>
  );
};

export default DevicesPanel;
