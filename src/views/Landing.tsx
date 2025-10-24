import React, { useCallback } from "react";
import BlurredCard from "../components/BlurredCard";
import AppIcon from "../components/icons";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAppSelector } from "../store/hooks";
import { translations } from "../data/translations";

interface LandingProps {
  onStart: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  const language = useAppSelector((state) => state.app.language);
  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations["en"]?.[key] || key;
    },
    [language]
  );

  const container = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <motion.div
        className="w-full max-w-7xl mx-auto grid grid-cols-2 gap-4 md:gap-8 items-center"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* Left Content Section */}
        <div className="text-left">
          <motion.h1
            variants={item}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 md:mb-6"
          >
            {t("welcome_to")}
            <br />
            <span className="bg-gradient-to-r from-[var(--primary-color)] to-purple-500 bg-clip-text text-transparent">
              {t("app_name")}
            </span>
          </motion.h1>
          <motion.p
            variants={item}
            className="text-sm md:text-base text-gray-700 dark:text-gray-300 max-w-lg mb-6 md:mb-10"
          >
            {t("app_subtitle")}
          </motion.p>
          <motion.button
            onClick={onStart}
            variants={item}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 md:px-6 md:py-3 bg-[var(--primary-color)] text-white font-semibold rounded-xl shadow-lg hover:brightness-90 transition-all duration-300 transform flex items-center gap-2 group"
          >
            <span className="text-sm md:text-base">{t("start")}</span>
            <ArrowRight
              size={20}
              className="transition-transform group-hover:translate-x-1"
            />
          </motion.button>
        </div>

        {/* Right Visual Section */}
        <motion.div
          className="relative h-64 sm:h-72 md:h-80 lg:h-96 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: 0.5, delay: 0.4 },
          }}
        >
          <BlurredCard className="w-full h-full relative overflow-hidden">
            {/* Floating Icons */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2">
              <AppIcon
                name="browser"
                className="w-12 h-12 md:w-20 md:h-20 text-[var(--primary-color)] opacity-90"
              />
            </div>
            <div className="absolute top-8 right-10 md:top-12 md:right-20">
              <AppIcon
                name="visual-studio-code"
                className="w-10 h-10 md:w-16 md:h-16 text-sky-400 opacity-80"
              />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <AppIcon
                name="system"
                className="w-16 h-16 md:w-28 md:h-28 text-purple-500 opacity-95"
              />
            </div>
            <div className="hidden sm:block absolute bottom-12 left-1/3">
              <AppIcon
                name="gimp"
                className="w-12 h-12 text-gray-500 opacity-70"
              />
            </div>
            <div className="absolute bottom-1/4 right-1/4">
              <AppIcon
                name="spotify"
                className="w-12 h-12 md:w-20 md:h-20 text-green-500 opacity-90"
              />
            </div>
            <div className="hidden md:block absolute top-2/3 left-12">
              <AppIcon
                name="kernel"
                className="w-10 h-10 text-gray-400 opacity-60"
              />
            </div>
            <div className="absolute top-12 left-6 md:top-16 md:left-8">
              <AppIcon
                name="mail-client"
                className="w-8 h-8 md:w-12 md:h-12 text-orange-400 opacity-75"
              />
            </div>
            <div className="hidden sm:block absolute bottom-8 right-10">
              <AppIcon
                name="personalization"
                className="w-12 h-12 text-pink-500 opacity-85"
              />
            </div>
          </BlurredCard>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Landing;
