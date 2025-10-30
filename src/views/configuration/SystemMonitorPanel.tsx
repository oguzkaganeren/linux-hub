import React, { useCallback } from "react";
import BlurredCard from "../../components/BlurredCard";
import Panel from "../../components/configuration/Panel";
import Gauge from "../../components/configuration/Gauge";
import { useAppSelector } from "../../store/hooks";
import { translations } from "../../data/translations";
import { selectSystemInfo, selectSystemStatus } from "../../store/systemSlice";

const SystemMonitorPanel: React.FC = () => {
  const language = useAppSelector((state) => state.app.language);
  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );
  const sysInfo = useAppSelector(selectSystemInfo);
  const status = useAppSelector(selectSystemStatus);

  const loading = status === "idle" || !sysInfo;

  const usage = {
    cpu: sysInfo?.cpu.global_usage_percent || 0,
    ram: sysInfo ? (sysInfo.memory.used_kb / sysInfo.memory.total_kb) * 100 : 0,
    disk: sysInfo
      ? (() => {
          const totalDisk = sysInfo.disks.reduce(
            (sum, d) => sum + d.total_gb,
            0
          );
          const availableDisk = sysInfo.disks.reduce(
            (sum, d) => sum + d.available_gb,
            0
          );
          const usedDisk = totalDisk - availableDisk;
          return totalDisk > 0 ? (usedDisk / totalDisk) * 100 : 0;
        })()
      : 0,
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="relative w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
        <Gauge
          percentage={usage.cpu}
          label={t("cpu_usage")}
          color="text-[var(--primary-color)]"
        />
        <Gauge
          percentage={usage.ram}
          label={t("ram_usage")}
          color="text-purple-500"
        />
        <Gauge
          percentage={usage.disk}
          label={t("disk_usage")}
          color="text-green-500"
        />
      </div>
    );
  };

  return (
    <Panel title={t("system_monitor")}>
      <BlurredCard className="p-6">
        <h2 className="text-xl font-semibold mb-6">{t("live_stats")}</h2>
        {renderContent()}
      </BlurredCard>
    </Panel>
  );
};

export default SystemMonitorPanel;
