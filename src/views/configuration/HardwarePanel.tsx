import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, ExternalLink, Info } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";

import Panel from "../../components/configuration/Panel";
import BlurredCard from "../../components/BlurredCard";
import AppIcon from "../../components/icons";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { install } from "../../store/packagesSlice";
import { translations } from "../../data/translations";
import {
  HardwareInfo,
  Gpu,
  DriverPackage,
  DriverVariant,
  PackageStatus,
  NetworkCard,
  OtherCard,
} from "../../types";

const VENDOR_MAP: Record<string, { name: string; icon: string }> = {
  "8086": { name: "Intel", icon: "intel" },
  "10de": { name: "NVIDIA", icon: "nvidia" },
  "1002": { name: "AMD", icon: "amd" },
  "10ec": { name: "Realtek", icon: "network" }, // Added for network card
};

const GpuCard: React.FC<{ gpu: Gpu }> = ({ gpu }) => {
  const vendorId = gpu.vendor.startsWith("10de") ? "10de" : gpu.vendor; // Handle NVIDIA model name in vendor
  const vendorInfo = VENDOR_MAP[vendorId.toLowerCase()] || {
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
}> = ({ variant, isActive }) => {
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.app.language);
  const packagesState = useAppSelector((state) => state.packages.packagesState);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const handleInstall = (packages: string[]) => {
    packages.forEach((pkg) => dispatch(install(pkg)));
  };

  const getVariantStatus = () => {
    let isInstalling = false;
    let isError = false;
    let progress = 0;
    let installingCount = 0;

    if (!variant.packages || variant.packages.length === 0) {
      return { status: "not-installed" };
    }

    for (const pkg of variant.packages) {
      const state = packagesState[pkg];
      if (state?.status === PackageStatus.Installing) {
        isInstalling = true;
        progress += state.progress || 0;
        installingCount++;
      }
      if (state?.status === PackageStatus.Error) {
        isError = true;
      }
    }

    if (isInstalling) {
      return {
        status: "installing",
        progress: installingCount > 0 ? progress / installingCount : 0,
      };
    }
    if (isError) {
      return { status: "error" };
    }
    if (isActive) {
      return { status: "installed" };
    }
    return { status: "not-installed" };
  };

  const variantStatus = getVariantStatus();

  const renderButton = () => {
    switch (variantStatus.status) {
      case "installed":
        return (
          <div className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-green-700 dark:text-green-300 font-semibold">
            <Check size={16} />
            <span>{t("installed")}</span>
          </div>
        );
      case "installing":
        return (
          <div className="w-full text-center">
            <div className="w-full bg-gray-300/50 dark:bg-gray-700/50 rounded-full h-2">
              <motion.div
                className="bg-[var(--primary-color)] h-2 rounded-full"
                animate={{ width: `${variantStatus.progress || 0}%` }}
                transition={{ duration: 0.3, ease: "linear" }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {t("installing")}
            </p>
          </div>
        );
      case "error":
        return (
          <button
            onClick={() => handleInstall(variant.packages)}
            className="px-4 py-1.5 text-sm bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors"
          >
            {t("retry")}
          </button>
        );
      default: // 'not-installed'
        return (
          <button
            onClick={() => handleInstall(variant.packages)}
            className="px-4 py-1.5 text-sm bg-[var(--primary-color)] text-white font-semibold rounded-md hover:brightness-90 transition-all"
          >
            {t("install")}
          </button>
        );
    }
  };

  return (
    <div
      className={`flex justify-between items-center p-3 rounded-md transition-colors ${
        isActive
          ? "bg-[var(--primary-color)]/10"
          : "hover:bg-gray-100/50 dark:hover:bg-gray-800/20"
      }`}
    >
      <div className="flex-grow pr-4 overflow-hidden">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{variant.name}</p>
          {variant.instructions && (
            <div className="relative group">
              <Info
                size={14}
                className="text-gray-400 dark:text-gray-500 cursor-help"
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {variant.instructions}
              </div>
            </div>
          )}
        </div>
        <p
          className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate"
          title={variant.packages.join(" ")}
        >
          {variant.packages.join(" ")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {variant.wiki_url && (
          <a
            href={variant.wiki_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              open(variant.wiki_url!);
            }}
            className="p-1.5 rounded-full text-gray-500 hover:text-[var(--primary-color)] transition-colors"
            title={`Open Wiki for ${variant.name}`}
          >
            <ExternalLink size={16} />
          </a>
        )}
        <div className="w-24 flex justify-end">{renderButton()}</div>
      </div>
    </div>
  );
};

const VendorDriversCard: React.FC<{
  vendor: string;
  driverPackage: DriverPackage;
  gpus: Gpu[];
}> = ({ vendor, driverPackage }) => {
  const packagesState = useAppSelector((state) => state.packages.packagesState);
  const [isExpanded, setIsExpanded] = useState(true);

  const isVariantInstalled = (variant: DriverVariant) => {
    if (!variant.packages || variant.packages.length === 0) {
      return false;
    }
    return variant.packages.every((pkg) => {
      const state = packagesState[pkg];
      return state?.status === PackageStatus.Installed;
    });
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
                  isActive={isVariantInstalled(variant)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NetworkCardComponent: React.FC<{ card: NetworkCard }> = ({ card }) => {
  const vendorInfo = VENDOR_MAP[card.vendor.toLowerCase()] || {
    name: card.vendor,
    icon: "network",
  };
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50">
      <AppIcon
        name={vendorInfo.icon}
        className="w-10 h-10 text-gray-600 dark:text-gray-400 flex-shrink-0"
      />
      <div className="flex-grow overflow-hidden">
        <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
          {card.model}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Vendor: {vendorInfo.name} ({card.vendor})
        </p>
      </div>
    </div>
  );
};

const OtherCardComponent: React.FC<{ card: OtherCard }> = ({ card }) => {
  return (
    <div className="p-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50">
      <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
        {card.raw}
      </p>
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

    const detectedVendors = new Set(
      hardwareInfo.gpus.map(
        (gpu) => VENDOR_MAP[gpu.vendor.toLowerCase()]?.name || gpu.vendor
      )
    );

    return (
      <div className="space-y-6">
        <BlurredCard className="p-4 md:p-6">
          <h2 className="text-xl font-bold mb-4">Detected GPUs</h2>
          <div className="space-y-2">
            {hardwareInfo.gpus.map((gpu) => (
              <GpuCard key={`${gpu.vendor}-${gpu.model}`} gpu={gpu} />
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
            {Object.entries(hardwareInfo.driver_packages)
              .filter(([vendor]) => detectedVendors.has(vendor))
              .map(([vendor, pkg]) => (
                <VendorDriversCard
                  key={vendor}
                  vendor={vendor}
                  driverPackage={pkg}
                  gpus={hardwareInfo.gpus}
                />
              ))}
          </div>
        </div>

        {hardwareInfo.network_cards &&
          hardwareInfo.network_cards.length > 0 && (
            <BlurredCard className="p-4 md:p-6">
              <h2 className="text-xl font-bold mb-4">Network Cards</h2>
              <div className="space-y-2">
                {hardwareInfo.network_cards.map((card) => (
                  <NetworkCardComponent key={card.model} card={card} />
                ))}
              </div>
            </BlurredCard>
          )}

        {hardwareInfo.other_cards && hardwareInfo.other_cards.length > 0 && (
          <BlurredCard className="p-4 md:p-6">
            <h2 className="text-xl font-bold mb-4">Other Hardware</h2>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
              {hardwareInfo.other_cards.map((card, index) => (
                <OtherCardComponent key={index} card={card} />
              ))}
            </div>
          </BlurredCard>
        )}
      </div>
    );
  };

  return <Panel title={t("hardware_configuration")}>{renderContent()}</Panel>;
};

export default HardwarePanel;
