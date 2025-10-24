import React, { useCallback } from "react";
import { ChevronRight } from "lucide-react";
import BlurredCard from "../../components/BlurredCard";
import HeaderCard from "../../components/configuration/HeaderCard";
import AppIcon from "../../components/icons";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { setPrimaryColor } from "../../store/themeSlice";
import { install } from "../../store/packagesSlice";
import { translations } from "../../data/translations";
import { ConfigPanel, PackageStatus } from "../../types";
import { kernels, devices, colors } from "../../data/config";

const HomePanel: React.FC<{ setActivePanel: (panel: ConfigPanel) => void }> = ({
  setActivePanel,
}) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme);
  const packagesState = useAppSelector((state) => state.packages.packagesState);
  const language = useAppSelector((state) => state.app.language);
  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const recommendedSettings: {
    name: string;
    icon: string;
    panel: ConfigPanel;
  }[] = [
    { name: t("storage"), icon: "storage", panel: "storage" },
    { name: t("devices"), icon: "devices", panel: "devices" },
    {
      name: t("appearance"),
      icon: "personalization",
      panel: "personalization",
    },
  ];

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        {t("home")}
      </h1>

      <div className="bg-gray-100/80 dark:bg-gray-800/50 rounded-xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center md:justify-between gap-6 md:gap-4">
        <HeaderCard icon="host" title="LinuxHub" subtitle={t("hostname")} />
        <HeaderCard
          icon="network"
          title="Ethernet 10Gb"
          subtitle={t("connected")}
        />
        <HeaderCard
          icon="updates"
          title={t("system_up_to_date")}
          subtitle={t("last_check")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BlurredCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {t("recommended_settings")}
          </h2>
          <ul className="space-y-2">
            {recommendedSettings.map((item) => (
              <li
                key={item.name}
                onClick={() => setActivePanel(item.panel)}
                className="flex items-center justify-between p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <AppIcon
                    name={item.icon}
                    className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </li>
            ))}
          </ul>
        </BlurredCard>

        <BlurredCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {t("personalize_your_device")}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => dispatch(setPrimaryColor(color))}
                style={{ backgroundColor: color }}
                className={`w-full h-20 rounded-lg transition-transform transform hover:scale-105 ${
                  theme.primaryColor === color
                    ? "ring-4 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-800 ring-white"
                    : ""
                }`}
              />
            ))}
            <div className="w-full h-20 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-medium text-sm">
              {t("more_colors")}
            </div>
          </div>
        </BlurredCard>

        <BlurredCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">{t("storage")}</h2>
          <div className="space-y-4">
            {devices.slice(0, 2).map((d) => (
              <div key={d.name}>
                <div className="flex justify-between font-semibold text-sm mb-1">
                  <span>{d.name}</span>
                  <span>
                    {d.used} / {d.size}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-[var(--primary-color)] h-2.5 rounded-full"
                    style={{ width: `${d.usage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </BlurredCard>

        <BlurredCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">{t("kernel_manager")}</h2>
          <div className="space-y-3">
            {kernels.slice(0, 2).map((k) => {
              const state = packagesState[k.pkg];
              return (
                <div
                  key={k.version}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      Linux {k.version}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {k.running && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                          {t("running")}
                        </span>
                      )}
                      {k.releaseType === "lts" && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">
                          {t("lts")}
                        </span>
                      )}
                      {k.releaseType === "recommended" && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300">
                          {t("recommended")}
                        </span>
                      )}
                    </div>
                  </div>
                  {state?.status === PackageStatus.Installed ? (
                    <button
                      disabled
                      className="px-4 py-1.5 text-sm bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-semibold rounded-md cursor-not-allowed"
                    >
                      {t("installed")}
                    </button>
                  ) : (
                    <button
                      onClick={() => dispatch(install(k.pkg))}
                      className="px-4 py-1.5 text-sm bg-[var(--primary-color)] text-white font-semibold rounded-md hover:brightness-90 transition-all"
                    >
                      {t("install")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </BlurredCard>
      </div>
    </>
  );
};

export default HomePanel;
