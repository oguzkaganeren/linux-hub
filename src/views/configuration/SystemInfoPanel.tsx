import React, { useCallback } from "react";
import BlurredCard from "../../components/BlurredCard";
import Panel from "../../components/configuration/Panel";
import { useAppSelector } from "../../store/hooks";
import { translations } from "../../data/translations";

const SystemInfoPanel: React.FC = () => {
  const language = useAppSelector((state) => state.app.language);
  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );
  const sysInfo = {
    cpu: "Intel Core i7-11800H @ 2.30GHz (16 Cores)",
    gpu: "NVIDIA GeForce RTX 3070 Mobile",
    ram: { total: 16, used: 6.4 },
    swap: { total: 8, used: 1.2 },
    host: "LinuxHub",
    os: "Linux Hub OS",
  };

  return (
    <Panel title={t("system_info")}>
      <BlurredCard className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <span className="font-semibold">{t("cpu")}:</span> {sysInfo.cpu}
        </div>
        <div>
          <span className="font-semibold">{t("gpu")}:</span> {sysInfo.gpu}
        </div>
        <div>
          <span className="font-semibold">{t("hostname")}:</span> {sysInfo.host}
        </div>
        <div>
          <span className="font-semibold">{t("os_version")}:</span> {sysInfo.os}
        </div>
        <div>
          <div className="flex justify-between font-semibold text-sm mb-1">
            <span>{t("memory_ram")}</span>
            <span>
              {sysInfo.ram.used.toFixed(1)} GB / {sysInfo.ram.total} GB
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-[var(--primary-color)] h-2.5 rounded-full"
              style={{
                width: `${(sysInfo.ram.used / sysInfo.ram.total) * 100}%`,
              }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between font-semibold text-sm mb-1">
            <span>{t("swap")}</span>
            <span>
              {sysInfo.swap.used.toFixed(1)} GB / {sysInfo.swap.total} GB
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-purple-500 h-2.5 rounded-full"
              style={{
                width: `${(sysInfo.swap.used / sysInfo.swap.total) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </BlurredCard>
    </Panel>
  );
};

export default SystemInfoPanel;
