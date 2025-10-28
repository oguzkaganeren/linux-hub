import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import BlurredCard from "../../components/BlurredCard";
import Panel from "../../components/configuration/Panel";
import AppIcon from "../../components/icons";
import { useAppSelector } from "../../store/hooks";
import { translations } from "../../data/translations";

interface Process {
  pid: number;
  name: string;
  status: string;
  cpu_usage_percent: number;
}

const ProcessesPanel: React.FC = () => {
  const language = useAppSelector((state) => state.app.language);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const infoString: string = await invoke("get_system_info");
        const infoData = JSON.parse(infoString);
        if (infoData.processes && Array.isArray(infoData.processes)) {
          const sortedProcesses = infoData.processes.sort(
            (a: Process, b: Process) =>
              b.cpu_usage_percent - a.cpu_usage_percent
          );
          setProcesses(sortedProcesses);
        } else {
          throw new Error("Process information not found in system data.");
        }
      } catch (err) {
        console.error("Failed to fetch process info:", err);
        setError("Could not load process information.");
      } finally {
        if (loading) setLoading(false);
      }
    };

    fetchProcesses();
    const interval = setInterval(fetchProcesses, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [loading]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-0 overflow-hidden animate-pulse">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-200/80 dark:bg-gray-800/50">
                <tr>
                  <th className="p-3">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-8"></div>
                  </th>
                  <th className="p-3">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                  </th>
                  <th className="p-3">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                  </th>
                  <th className="p-3 text-right">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12 ml-auto"></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 15 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-200 dark:border-gray-700/50"
                  >
                    <td className="p-3">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12"></div>
                    </td>
                    <td className="p-3">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                    </td>
                    <td className="p-3">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-10 ml-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      <div className="max-h-[60vh] overflow-y-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-gray-100/80 dark:bg-gray-800/50 backdrop-blur-sm">
            <tr>
              <th className="p-3 font-semibold">{t("pid")}</th>
              <th className="p-3 font-semibold">{t("process_name")}</th>
              <th className="p-3 font-semibold">{t("status")}</th>
              <th className="p-3 font-semibold text-right">
                {t("cpu_usage_short")}
              </th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p) => (
              <tr
                key={p.pid}
                className="border-b border-gray-200 dark:border-gray-700/50 last:border-b-0"
              >
                <td className="p-3 font-mono">{p.pid}</td>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{p.status}</td>
                <td className="p-3 font-mono text-right">
                  {p.cpu_usage_percent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Panel title={t("processes")}>
      <BlurredCard className="p-0 overflow-hidden">
        {renderContent()}
      </BlurredCard>
    </Panel>
  );
};

export default ProcessesPanel;
