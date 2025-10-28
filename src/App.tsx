// FIX: Introduce a simulated failure chance (10%) into the package
// installation process to test and demonstrate the new error handling UI.
import React, { useEffect, useCallback, useLayoutEffect } from "react";
import Landing from "./views/Landing";
import Home from "./views/Home";
import Packages from "./views/Packages";
import Configuration from "./views/Configuration";
import About from "./views/About";
import TitleBar from "./components/TitleBar";
import StatusBar from "./components/StatusBar";
import SettingsModal from "./components/SettingsModal";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { Page, PackageStatus, Kernel, PackageState } from "./types";
import { useAppSelector, useAppDispatch } from "./store/hooks";
import { navigateTo, setOnlineStatus, setLiveMode } from "./store/appSlice";
import { setProgress, finishInstall, failInstall } from "./store/packagesSlice";
import { translations } from "./data/translations";
import { packageData } from "./data/packages";
import toast from "react-hot-toast";

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const page = useAppSelector((state) => state.app.page);
  const isSettingsModalOpen = useAppSelector(
    (state) => state.app.isSettingsModalOpen
  );
  const theme = useAppSelector((state) => state.theme);
  const language = useAppSelector((state) => state.app.language);
  const packagesState = useAppSelector((state) => state.packages.packagesState);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  // Effect for theme mode changes
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme.mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme.mode]);

  // Effect for theme primary color changes
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--primary-color",
      theme.primaryColor
    );
  }, [theme.primaryColor]);

  // Effect for online status
  useEffect(() => {
    const handleOnline = () => {
      dispatch(setOnlineStatus(true));
      toast.success(t("toast_online"));
    };
    const handleOffline = () => {
      dispatch(setOnlineStatus(false));
      toast.error(t("toast_offline"));
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [dispatch, t]);

  // Effect for Live Mode detection simulation
  useEffect(() => {
    const checkLiveMode = async () => {
      // This is a mock of how you might detect a live environment.
      // In a real scenario, you might check for a specific file,
      // environment variable, or use a Tauri command.
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate async check

      // For demonstration, we'll assume it's a live environment.
      dispatch(setLiveMode(true));
    };
    checkLiveMode();
  }, [dispatch]);

  // Effect for installation simulation
  useEffect(() => {
    const kernels: Omit<Kernel, "running">[] = [
      { version: "6.5.3-1", releaseType: "stable", pkg: "linux65" },
      { version: "6.4.16-2", releaseType: "recommended", pkg: "linux64" },
      { version: "6.1.55-1", releaseType: "lts", pkg: "linux61" },
      { version: "5.15.131-1", releaseType: "lts", pkg: "linux515" },
    ];

    const allApps = packageData.flatMap((cat) => cat.apps);
    const allInstallables = [
      ...allApps.map((a) => ({ pkg: a.pkg, name: a.name, type: "app" })),
      ...kernels.map((k) => ({
        pkg: k.pkg,
        name: `Linux ${k.version}`,
        type: "kernel",
      })),
    ];

    const simulationInterval = setInterval(() => {
      const packagesToUpdate = Object.entries(packagesState)
        // FIX: Add explicit type annotation to fix 'state' being inferred as 'unknown'.
        .filter(
          ([_, state]: [string, PackageState]) =>
            state.status === PackageStatus.Installing &&
            (state.progress ?? 0) < 100
        );

      if (packagesToUpdate.length === 0) return;

      // FIX: Add explicit type annotation to fix 'state' being inferred as 'unknown'.
      packagesToUpdate.forEach(([pkg, state]: [string, PackageState]) => {
        const item = allInstallables.find((i) => i.pkg === pkg);
        // Simulate a 10% chance of failure
        if (Math.random() < 0.1) {
          dispatch(
            failInstall({ pkg, error: t("toast_install_failed_generic") })
          );
          if (item) {
            toast.error(`${item.name} ${t("toast_install_failed")}`);
          }
          return;
        }

        const progressIncrement = 5 + Math.random() * 10;
        // FIX: 'state' is now correctly typed as PackageState, so 'progress' property is accessible.
        const newProgress = Math.min(
          100,
          (state.progress ?? 0) + progressIncrement
        );

        if (newProgress >= 100) {
          dispatch(finishInstall(pkg));
          if (item) {
            toast.success(`${item.name} ${t("toast_install_success")}`);
          }
        } else {
          dispatch(setProgress({ pkg, progress: newProgress }));
        }
      });
    }, 400);

    return () => clearInterval(simulationInterval);
  }, [packagesState, dispatch, t]);

  const handleNavigate = (p: Page) => dispatch(navigateTo(p));

  const renderPage = () => {
    switch (page) {
      case "landing":
        return <Landing onStart={() => handleNavigate("home")} />;
      case "home":
        return <Home navigate={(p) => handleNavigate(p)} />;
      case "packages":
        return <Packages />;
      case "configuration":
        return <Configuration />;
      case "about":
        return <About />;
      default:
        return <Landing onStart={() => handleNavigate("home")} />;
    }
  };

  const pageKey = page; // Use a stable key for AnimatePresence

  return (
    <div className="h-screen w-screen bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-gray-100 flex flex-col font-sans overflow-hidden">
      <Toaster
        position="top-right"
        containerStyle={{
          top: 56, // Titlebar height (48px) + 8px margin
        }}
        toastOptions={{
          style: {
            background: theme.mode === "dark" ? "#1f2937" : "#fff", // gray-800
            color: theme.mode === "dark" ? "#f9fafb" : "#111827", // gray-50, gray-900
          },
        }}
      />
      <TitleBar
        showBackButton={page !== "landing" && page !== "home"}
        onBack={() => handleNavigate("home")}
      />
      <main className="flex-grow relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={pageKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <StatusBar />
      <AnimatePresence>
        {isSettingsModalOpen && <SettingsModal />}
      </AnimatePresence>
    </div>
  );
};

export default App;
