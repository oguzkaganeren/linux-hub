// FIX: Update the Kernel management panel to handle installation errors. When a
// kernel installation fails, the UI now shows a "Retry" button.
import React, { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import AppIcon from "../components/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { translations } from "../data/translations";
import { updateUserProfile } from "../store/appSlice";
import { ConfigPanel } from "../types";
import NavItem from "../components/configuration/NavItem";
import HomePanel from "./configuration/HomePanel";
import SystemInfoPanel from "./configuration/SystemInfoPanel";
import KernelPanel from "./configuration/KernelPanel";
import DevicesPanel from "./configuration/DevicesPanel";
import MirrorsPanel from "./configuration/MirrorsPanel";
import UpdatesPanel from "./configuration/UpdatesPanel";
import StoragePanel from "./configuration/StoragePanel";
import PersonalizationPanel from "./configuration/PersonalizationPanel";
import SystemMonitorPanel from "./configuration/SystemMonitorPanel";
import LocalePanel from "./configuration/LocalePanel";
import HardwarePanel from "./configuration/HardwarePanel";

const Configuration: React.FC = () => {
  const [activePanel, setActivePanel] = useState<ConfigPanel>("home");
  const language = useAppSelector((state) => state.app.language);
  const user = useAppSelector((state) => state.app.user);
  const dispatch = useAppDispatch();

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfoJson: string = await invoke("get_system_user_info");
        const userInfo = JSON.parse(userInfoJson);

        const newEmail = `${userInfo.username}@linux.com`;
        let newAvatarUrl = user.avatarUrl || "";

        try {
          const dataUrl: string = await invoke("get_user_profile_photo_base64");
          if (dataUrl) {
            newAvatarUrl = dataUrl;
          }
        } catch (photoError) {
          console.error("Error loading profile photo:", photoError);
          // Fallback to default is implicitly handled by component if avatarUrl is empty
        }

        if (
          userInfo.username &&
          (userInfo.realname !== user.name ||
            newEmail !== user.email ||
            newAvatarUrl !== user.avatarUrl)
        ) {
          dispatch(
            updateUserProfile({
              name: userInfo.realname,
              email: newEmail,
              avatarUrl: newAvatarUrl,
            })
          );
        }
      } catch (error) {
        console.error("Failed to get user info:", error);
      }
    };

    fetchUserInfo();
  }, [dispatch, user]);

  const menuItems: { id: ConfigPanel; name: string; icon: string }[] = [
    { id: "home", name: t("home"), icon: "home" },
    { id: "system", name: t("system_info"), icon: "system" },
    { id: "kernel", name: t("kernel"), icon: "kernel" },
    { id: "hardware", name: t("hardware_configuration"), icon: "hardware" },
    { id: "monitor", name: t("system_monitor"), icon: "monitor" },
    { id: "devices", name: t("devices"), icon: "devices" },
    { id: "network", name: t("mirrors"), icon: "network" },
    { id: "updates", name: t("updates"), icon: "updates" },
    { id: "storage", name: t("storage"), icon: "storage" },
    {
      id: "personalization",
      name: t("personalization"),
      icon: "personalization",
    },
    { id: "locale", name: t("locale_settings"), icon: "locale" },
  ];

  const renderPanel = () => {
    switch (activePanel) {
      case "home":
        return <HomePanel setActivePanel={setActivePanel} />;
      case "system":
        return <SystemInfoPanel />;
      case "kernel":
        return <KernelPanel />;
      case "hardware":
        return <HardwarePanel />;
      case "monitor":
        return <SystemMonitorPanel />;
      case "devices":
        return <DevicesPanel />;
      case "network":
        return <MirrorsPanel />;
      case "updates":
        return <UpdatesPanel />;
      case "storage":
        return <StoragePanel />;
      case "personalization":
        return <PersonalizationPanel />;
      case "locale":
        return <LocalePanel />;
      default:
        return <HomePanel setActivePanel={setActivePanel} />;
    }
  };

  return (
    <div className="h-full flex">
      {/* Left Navigation Rail */}
      <aside className="w-64 lg:w-80 flex-shrink-0 p-4 pr-0">
        <div className="h-full bg-gray-100/80 dark:bg-gray-800/50 rounded-xl p-4 flex flex-col">
          <div className="flex items-center gap-3 p-2 mb-4 rounded-lg text-left">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <AppIcon
                  name="user"
                  className="w-6 h-6 md:w-8 md:h-8 text-gray-600 dark:text-gray-300"
                />
              )}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-base md:text-lg text-gray-800 dark:text-gray-100 truncate">
                {user.name}
              </p>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <div className="relative mb-4">
            <AppIcon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
            />
            <input
              type="text"
              placeholder={t("find_a_setting")}
              className="w-full pl-10 pr-4 py-2 rounded-md bg-white dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
            />
          </div>

          <nav className="flex flex-col gap-1 flex-grow overflow-y-auto">
            {menuItems.map((item) => (
              <NavItem
                key={item.id}
                id={item.id}
                name={item.name}
                icon={item.icon}
                active={activePanel === item.id}
                onClick={setActivePanel}
              />
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderPanel()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Configuration;
