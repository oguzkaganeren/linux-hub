import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import BlurredCard from "../../components/BlurredCard";
import Panel from "../../components/configuration/Panel";
import Gauge from "../../components/configuration/Gauge";
import { useAppSelector } from "../../store/hooks";
import { translations } from "../../data/translations";

interface SystemMonitorInfo {
  cpu: { global_usage_percent: number };
  memory: { total_kb: number; used_kb: number };
  disks: { total_gb: number; available_gb: number }[];
}

const SystemMonitorPanel: React.FC = () => {
  const language = useAppSelector((state) => state.app.language);
  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );
  const [usage, setUsage] = useState({ cpu: 0, ram: 0, disk: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const infoString: string = await invoke("get_system_info");
        const infoData: SystemMonitorInfo = JSON.parse(infoString);

        const ramUsage =
          (infoData.memory.used_kb / infoData.memory.total_kb) * 100;

        const totalDisk = infoData.disks.reduce(
          (sum, d) => sum + d.total_gb,
          0
        );
        const availableDisk = infoData.disks.reduce(
          (sum, d) => sum + d.available_gb,
          0
        );
        const usedDisk = totalDisk - availableDisk;
        const diskUsage = totalDisk > 0 ? (usedDisk / totalDisk) * 100 : 0;

        setUsage({
          cpu: infoData.cpu.global_usage_percent,
          ram: ramUsage,
          disk: diskUsage,
        });

        if (loading) setLoading(false);
      } catch (error) {
        console.error("Failed to fetch system monitor info:", error);
        // Keep old data on subsequent errors
      }
    };

    fetchUsage(); // Initial fetch
    const interval = setInterval(fetchUsage, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [loading]);

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
