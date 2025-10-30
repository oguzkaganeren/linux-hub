import React, { useCallback } from "react";
import BlurredCard from "../../components/BlurredCard";
import Panel from "../../components/configuration/Panel";
import AppIcon from "../../components/icons";
import { useAppSelector } from "../../store/hooks";
import { translations } from "../../data/translations";
import { selectSystemInfo, selectSystemStatus } from "../../store/systemSlice";

const StoragePanel: React.FC = () => {
  const language = useAppSelector((state) => state.app.language);
  const sysInfo = useAppSelector(selectSystemInfo);
  const status = useAppSelector(selectSystemStatus);

  const disks = sysInfo?.disks || [];
  const loading = status === "idle";
  const error =
    status === "failed" ? "Could not load storage information." : null;

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6 animate-pulse">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center p-10 text-red-500">
          <AppIcon name="error" className="w-8 h-8 mr-2" />
          <span>{error}</span>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {disks.map((d) => {
          const totalGb = d.total_gb;
          const usedGb = totalGb - d.available_gb;
          const usage = totalGb > 0 ? (usedGb / totalGb) * 100 : 0;

          return (
            <div key={d.name}>
              <div className="flex justify-between font-semibold text-sm mb-1">
                <span>
                  {d.name} ({d.mount_point})
                </span>
                <span>
                  {usedGb.toFixed(1)} GB / {totalGb.toFixed(1)} GB
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-[var(--primary-color)] h-2.5 rounded-full"
                  style={{ width: `${usage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Panel title={t("storage_devices")}>
      <BlurredCard className="p-6">{renderContent()}</BlurredCard>
    </Panel>
  );
};

export default StoragePanel;
