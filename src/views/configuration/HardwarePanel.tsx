import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, ExternalLink } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";

import Panel from "../../components/configuration/Panel";
import BlurredCard from "../../components/BlurredCard";
import AppIcon from "../../components/icons";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { install } from "../../store/packagesSlice";
import { translations } from "../../data/translations";
import { HardwareInfo, Gpu, DriverPackage, DriverVariant } from "../../types";

const VENDOR_MAP: Record<string, { name: string; icon: string }> = {
  "8086": { name: "Intel", icon: "intel" },
  "10de": { name: "NVIDIA", icon: "nvidia" },
  "1002": { name: "AMD", icon: "amd" },
};

const GpuCard: React.FC<{ gpu: Gpu }> = ({ gpu }) => {
  const vendorInfo = VENDOR_MAP[gpu.vendor.toLowerCase()] || {
    name: gpu.vendor,
    icon: "hardware",
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50">
      <AppIcon
        name={vendorInfo.icon}
        className="w-10 h-10 text-[var(--primary-color)] flex-shrink-0"
      />
      <div className="flex-grow overflow-hidden">
        <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
          {vendorInfo.name} {gpu.model}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
          {gpu.driver_type} ({gpu.driver_module})
        </p>
      </div>
      {gpu.in_use && (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300">
          Active
        </span>
      )}
    </div>
  );
};

const DriverVariantRow: React.FC<{
  variant: DriverVariant;
  isActive: boolean;
  onInstall: (packages: string[]) => void;
}> = ({ variant, isActive, onInstall }) => (
  <div
    className={`flex justify-between items-center p-3 rounded-md transition-colors ${
      isActive
        ? "bg-[var(--primary-color)]/10"
        : "hover:bg-gray-100/50 dark:hover:bg-gray-800/20"
    }`}
  >
    <div>
      <p className="font-semibold">{variant.name}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
        {variant.packages.join(" ")}
      </p>
    </div>
    <div className="flex items-center gap-2">
      {isActive ? (
        <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-green-700 dark:text-green-300 font-semibold">
          <Check size={16} />
          <span>Active</span>
        </div>
      ) : (
        <button
          onClick={() => onInstall(variant.packages)}
          className="px-4 py-1.5 text-sm bg-[var(--primary-color)] text-white font-semibold rounded-md hover:brightness-90 transition-all"
        >
          Install
        </button>
      )}
    </div>
  </div>
);

const VendorDriversCard: React.FC<{
  vendor: string;
  driverPackage: DriverPackage;
  gpus: Gpu[];
}> = ({ vendor, driverPackage, gpus }) => {
  const dispatch = useAppDispatch();
  const [isExpanded, setIsExpanded] = useState(true);
  const vendorGpus = gpus.filter(
    (g) => (VENDOR_MAP[g.vendor.toLowerCase()]?.name || g.vendor) === vendor
  );
  const activeModule = vendorGpus.find((g) => g.in_use)?.driver_module;

  const handleInstall = (packages: string[]) => {
    // In a real scenario, you might want to confirm with the user first
    // and handle dependencies or conflicts.
    packages.forEach((pkg) => dispatch(install(pkg)));
  };

  return (
    <div className="bg-gray-100/50 dark:bg-gray-800/40 rounded-lg overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
      <button
        onClick={() => setIsExpanded((e) => !e)}
        className="w-full flex justify-between items-center p-3 text-left bg-gray-200/50 dark:bg-gray-900/30"
      >
        <div className="flex items-center gap-3">
          <AppIcon
            name={
              VENDOR_MAP[
                Object.keys(VENDOR_MAP).find(
                  (key) => VENDOR_MAP[key].name === vendor
                ) || ""
              ]?.icon || "hardware"
            }
            className="w-6 h-6"
          />
          <h3 className="text-lg font-bold">{vendor} Drivers</h3>
        </div>
        <div className="flex items-center gap-4">
          {driverPackage.wiki_url && (
            <a
              href={driverPackage.wiki_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                open(driverPackage.wiki_url);
              }}
              className="p-1 rounded-full text-gray-500 hover:text-[var(--primary-color)] transition-colors"
              title="Open Wiki Page"
            >
              <ExternalLink size={16} />
            </a>
          )}
          <ChevronDown
            className={`w-6 h-6 transition-transform ${
              isExpanded ? "" : "-rotate-90"
            }`}
          />
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2">
              {driverPackage.variants.map((variant) => (
                <DriverVariantRow
                  key={variant.name}
                  variant={variant}
                  // A simple heuristic to check if the driver is active
                  isActive={
                    !!activeModule &&
                    variant.packages.some((p) => p.includes(activeModule))
                  }
                  onInstall={handleInstall}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HardwarePanel: React.FC = () => {
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const language = useAppSelector((state) => state.app.language);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  useEffect(() => {
    const fetchHardwareInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        // Add a small delay for better UX on fast systems
        await new Promise((resolve) => setTimeout(resolve, 500));
        const hardwareDataString: string = await invoke("hardware_info");
        const hardwareData: HardwareInfo = JSON.parse(hardwareDataString);
        setHardwareInfo(hardwareData);
      } catch (err) {
        console.error("Failed to fetch hardware info:", err);
        setError("Could not load hardware information.");
      } finally {
        setLoading(false);
      }
    };
    fetchHardwareInfo();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6 animate-pulse">
          <div className="bg-gray-200/80 dark:bg-gray-800/50 rounded-2xl p-6 h-32"></div>
          <div className="bg-gray-200/80 dark:bg-gray-800/50 rounded-2xl p-6 h-48"></div>
        </div>
      );
    }

    if (error) {
      return (
        <BlurredCard>
          <div className="flex flex-col items-center justify-center p-10 gap-4 text-red-500">
            <AppIcon name="error" className="w-12 h-12" />
            <p className="font-semibold text-lg">{error}</p>
          </div>
        </BlurredCard>
      );
    }

    if (!hardwareInfo) {
      return (
        <BlurredCard>
          <div className="flex flex-col items-center justify-center p-10 gap-4 text-gray-500">
            <p className="font-semibold text-lg">
              No hardware information available.
            </p>
          </div>
        </BlurredCard>
      );
    }

    return (
      <div className="space-y-6">
        <BlurredCard className="p-4 md:p-6">
          <h2 className="text-xl font-bold mb-4">Detected GPUs</h2>
          <div className="space-y-2">
            {hardwareInfo.gpus.map((gpu) => (
              <GpuCard key={gpu.model} gpu={gpu} />
            ))}
          </div>
        </BlurredCard>

        {hardwareInfo.hybrid && (
          <BlurredCard className="p-4 md:p-6">
            <h2 className="text-xl font-bold mb-2">Hybrid Graphics Setup</h2>
            <p className="text-gray-600 dark:text-gray-400">
              A hybrid graphics system has been detected. The recommended setup
              is{" "}
              <strong className="text-gray-800 dark:text-gray-200">
                {hardwareInfo.hybrid.recommended_variant}
              </strong>
              .
            </p>
          </BlurredCard>
        )}

        <div>
          <h2 className="text-xl font-bold mb-4">Available Drivers</h2>
          <div className="space-y-4">
            {Object.entries(hardwareInfo.driver_packages).map(
              ([vendor, pkg]) => (
                <VendorDriversCard
                  key={vendor}
                  vendor={vendor}
                  driverPackage={pkg}
                  gpus={hardwareInfo.gpus}
                />
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return <Panel title={t("hardware_configuration")}>{renderContent()}</Panel>;
};

export default HardwarePanel;
