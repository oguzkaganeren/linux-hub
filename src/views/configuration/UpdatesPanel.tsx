import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import BlurredCard from "../../components/BlurredCard";
import Panel from "../../components/configuration/Panel";
import { useAppSelector } from "../../store/hooks";
import { translations } from "../../data/translations";
import AppIcon from "../../components/icons";

interface UpdateInfo {
  updates_available: boolean;
  pending_updates_count: number;
  last_update_date: string | null;
}

const UpdatesPanel: React.FC = () => {
  const language = useAppSelector((state) => state.app.language);
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let translation =
        translations[language]?.[key] || translations["en"]?.[key] || key;
      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          translation = translation.replace(`{${paramKey}}`, String(value));
        });
      }
      return translation;
    },
    [language]
  );

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateDetail, setUpdateDetail] = useState("");

  const checkUpdates = useCallback(async () => {
    setError(null);
    try {
      const resultJson: string = await invoke("check_system_updates");
      const result = JSON.parse(resultJson);
      if (result.check_success) {
        setUpdateInfo({
          updates_available: result.updates_available,
          pending_updates_count: result.pending_updates_count,
          last_update_date: result.last_update_date,
        });
      } else {
        throw new Error(result.message || "Failed to check for updates.");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.toString());
      setUpdateInfo(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    checkUpdates().finally(() => setLoading(false));
  }, [checkUpdates]);

  const handleUpdate = useCallback(async () => {
    setIsUpdating(true);
    setUpdateProgress(0);
    setUpdateDetail(t("installing"));

    const unlisten = await listen("pacman-progress", (event) => {
      const payload = event.payload as {
        current_step: string;
        detail: string;
      };

      let progressValue: number | undefined = undefined;
      const progressFromStep = parseFloat(payload.current_step);
      if (!isNaN(progressFromStep)) {
        progressValue = progressFromStep;
      } else {
        const detailMatch = payload.detail.match(/\((\d+)\/(\d+)\)/);
        if (detailMatch) {
          const current = parseInt(detailMatch[1], 10);
          const total = parseInt(detailMatch[2], 10);
          if (!isNaN(current) && !isNaN(total) && total > 0) {
            progressValue = (current / total) * 100;
          }
        }
      }

      if (progressValue !== undefined) {
        setUpdateProgress(Math.min(100, Math.max(0, progressValue)));
      }
      setUpdateDetail(payload.detail);
    });

    try {
      const resultJson: string = await invoke("manage_pacman_package", {
        operation: "update",
      });
      const result = JSON.parse(resultJson);

      if (result.success) {
        toast.success(t("toast_update_success"));
        await checkUpdates();
      } else {
        throw new Error(result.message || "System update failed.");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(t("toast_update_failed"));
      setError(e.toString());
    } finally {
      setIsUpdating(false);
      unlisten();
    }
  }, [checkUpdates, t]);

  const formatLastCheck = (dateString: string | null) => {
    if (!dateString) return "never";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(language, {
        dateStyle: "long",
        timeStyle: "short",
      }).format(date);
    } catch (e) {
      return "unknown";
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <BlurredCard className="p-8 animate-pulse">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
            <div className="flex-grow space-y-3">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mt-2"></div>
            </div>
          </div>
        </BlurredCard>
      );
    }

    if (error) {
      return (
        <BlurredCard className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                <AppIcon name="error" className="w-12 h-12" />
              </div>
            </div>
            <div className="flex-grow text-center md:text-left">
              <h2 className="text-2xl font-bold text-red-500">
                {t("update_failed_header")}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 my-2">{error}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  checkUpdates().finally(() => setLoading(false));
                }}
                className="mt-2 px-6 py-2 bg-red-500/20 text-red-500 font-semibold rounded-lg hover:bg-red-500/30 transition-all"
              >
                {t("retry")}
              </button>
            </div>
          </div>
        </BlurredCard>
      );
    }

    if (isUpdating) {
      const radius = 60;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (updateProgress / 100) * circumference;

      return (
        <BlurredCard className="p-8 flex flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-bold">
            {t("installing")} {t("updates")}
          </h2>
          <div className="relative w-40 h-40 my-4">
            <svg className="w-full h-full" viewBox="0 0 140 140">
              <circle
                className="text-gray-200 dark:text-gray-700"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="70"
                cy="70"
              />
              <motion.circle
                className="text-[var(--primary-color)]"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="70"
                cy="70"
                transform="rotate(-90 70 70)"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-gray-800 dark:text-gray-100">
              {Math.round(updateProgress)}%
            </div>
          </div>
          <p
            className="text-sm text-gray-500 dark:text-gray-400 mt-2 truncate max-w-full px-4"
            title={updateDetail}
          >
            {updateDetail || "..."}
          </p>
        </BlurredCard>
      );
    }

    if (updateInfo) {
      return (
        <BlurredCard className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {updateInfo.updates_available ? (
              <>
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-[var(--primary-color)]/20 flex items-center justify-center text-[var(--primary-color)] relative">
                    <AppIcon name="updates" className="w-12 h-12" />
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[var(--primary-color)] text-white flex items-center justify-center font-bold text-sm border-2 border-white/50 dark:border-gray-800/50">
                      {updateInfo.pending_updates_count}
                    </div>
                  </div>
                </div>
                <div className="flex-grow text-center md:text-left">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {t("updates_available_header", {
                      count: updateInfo.pending_updates_count,
                    })}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                    {t("last_check")}:{" "}
                    {formatLastCheck(updateInfo.last_update_date)}
                  </p>
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="px-6 py-2 bg-[var(--primary-color)] text-white font-semibold rounded-lg shadow-md hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("install_now")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                    <Check size={48} />
                  </div>
                </div>
                <div className="flex-grow text-center md:text-left">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {t("system_up_to_date")}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                    {t("last_check")}:{" "}
                    {formatLastCheck(updateInfo.last_update_date)}
                  </p>
                  <button
                    onClick={() => {
                      setLoading(true);
                      checkUpdates().finally(() => setLoading(false));
                    }}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t("check_for_updates")}
                  </button>
                </div>
              </>
            )}
          </div>
        </BlurredCard>
      );
    }

    return null;
  };

  return <Panel title={t("updates")}>{renderContent()}</Panel>;
};

export default UpdatesPanel;
