import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import BlurredCard from "../../components/BlurredCard";
import Panel from "../../components/configuration/Panel";
import AppIcon from "../../components/icons";
import { useAppSelector } from "../../store/hooks";
import { translations } from "../../data/translations";

interface Component {
  label: string;
  temperature_c: number;
  max_c: number;
  critical_c: number | null;
}

const SensorsPanel: React.FC = () => {
  const language = useAppSelector((state) => state.app.language);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const infoString: string = await invoke("get_system_info");
        const infoData = JSON.parse(infoString);
        if (infoData.components && Array.isArray(infoData.components)) {
          setComponents(infoData.components);
        } else {
          throw new Error("Sensor information not found in system data.");
        }
      } catch (err) {
        console.error("Failed to fetch sensor info:", err);
        setError("Could not load sensor information.");
      } finally {
        if (loading) setLoading(false);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [loading]);

  const getTempColor = (temp: number, critical: number | null) => {
    const crit = critical || 100;
    if (temp > crit * 0.9) return "bg-red-500";
    if (temp > crit * 0.75) return "bg-orange-500";
    return "bg-[var(--primary-color)]";
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
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

    if (components.length === 0) {
      return (
        <div className="flex items-center justify-center p-10 text-gray-500 dark:text-gray-400">
          <span>No sensor data available.</span>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {components.map((c) => {
          const temp = c.temperature_c;
          const max = c.critical_c || 100;
          const usage = max > 0 ? (temp / max) * 100 : 0;

          return (
            <div key={c.label}>
              <div className="flex justify-between font-semibold text-sm mb-1">
                <span className="truncate">{c.label}</span>
                <span>
                  {temp.toFixed(1)}°C /{" "}
                  {c.critical_c ? `${c.critical_c}°C` : "N/A"}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className={`${getTempColor(
                    temp,
                    c.critical_c
                  )} h-2.5 rounded-full`}
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
    <Panel title={t("sensors")}>
      <BlurredCard className="p-6">{renderContent()}</BlurredCard>
    </Panel>
  );
};

export default SensorsPanel;
