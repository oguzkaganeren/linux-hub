import React, { useCallback } from "react";
import BlurredCard from "../../components/BlurredCard";
import Panel from "../../components/configuration/Panel";
import { useAppSelector } from "../../store/hooks";
import { translations } from "../../data/translations";
import AppIcon from "../../components/icons";
import { selectSystemInfo, selectSystemStatus } from "../../store/systemSlice";

const SystemInfoPanel: React.FC = () => {
  const language = useAppSelector((state) => state.app.language);
  const sysInfo = useAppSelector(selectSystemInfo);
  const status = useAppSelector(selectSystemStatus);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const loading = status === "idle";
  const error =
    status === "failed"
      ? "Could not load system information. Please try again later."
      : null;

  const formatUptime = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBootTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-pulse">
          <div className="md:col-span-2 h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="md:col-span-2 h-5 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>

          <div className="md:col-span-2 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"></div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/5"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"></div>
          </div>
        </div>
      );
    }

    if (error || !sysInfo) {
      return (
        <div className="flex flex-col items-center justify-center p-10 gap-4 text-red-500">
          <AppIcon name="error" className="w-12 h-12" />
          <p className="font-semibold text-lg">
            {error || "An unknown error occurred."}
          </p>
        </div>
      );
    }

    const total_memory_gb = sysInfo.memory.total_kb / 1024 / 1024;
    const used_memory_gb = sysInfo.memory.used_kb / 1024 / 1024;
    const total_swap_gb = sysInfo.memory.total_swap_kb / 1024 / 1024;
    const used_swap_gb = sysInfo.memory.used_swap_kb / 1024 / 1024;

    const ramUsagePercent =
      total_memory_gb > 0 ? (used_memory_gb / total_memory_gb) * 100 : 0;
    const swapUsagePercent =
      total_swap_gb > 0 ? (used_swap_gb / total_swap_gb) * 100 : 0;

    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="md:col-span-2">
          <span className="font-semibold">{t("cpu")}:</span> {sysInfo.cpu.brand}{" "}
          ({sysInfo.cpu.physical_cores} Cores)
        </div>
        <div>
          <span className="font-semibold">{t("hostname")}:</span>{" "}
          {sysInfo.os_info.host_name}
        </div>
        <div>
          <span className="font-semibold">{t("os_version")}:</span>{" "}
          {sysInfo.os_info.name} {sysInfo.os_info.os_version} (
          {sysInfo.os_info.kernel_version})
        </div>

        <div>
          <span className="font-semibold">{t("uptime")}:</span>{" "}
          {formatUptime(sysInfo.uptime_s)}
        </div>
        <div>
          <span className="font-semibold">{t("boot_time")}:</span>{" "}
          {formatBootTime(sysInfo.boot_time_s)}
        </div>

        <div className="md:col-span-2">
          <span className="font-semibold">{t("load_average")}:</span>{" "}
          {sysInfo.load_average.one_min.toFixed(2)} (1m),{" "}
          {sysInfo.load_average.five_min.toFixed(2)} (5m),{" "}
          {sysInfo.load_average.fifteen_min.toFixed(2)} (15m)
        </div>

        <div className="md:col-span-2">
          <div className="flex justify-between font-semibold text-sm mb-1">
            <span>{t("memory_ram")}</span>
            <span>
              {used_memory_gb.toFixed(1)} GB / {total_memory_gb.toFixed(1)} GB
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-[var(--primary-color)] h-2.5 rounded-full"
              style={{ width: `${ramUsagePercent}%` }}
            ></div>
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="flex justify-between font-semibold text-sm mb-1">
            <span>{t("swap")}</span>
            <span>
              {used_swap_gb.toFixed(1)} GB / {total_swap_gb.toFixed(1)} GB
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-purple-500 h-2.5 rounded-full"
              style={{ width: `${swapUsagePercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Panel title={t("system_info")}>
      <BlurredCard>{renderContent()}</BlurredCard>
    </Panel>
  );
};

export default SystemInfoPanel;
