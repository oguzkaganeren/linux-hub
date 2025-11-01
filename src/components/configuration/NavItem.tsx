import React from "react";
import { motion } from "framer-motion";
import AppIcon from "../icons";
import { ConfigPanel } from "../../types";

const NavItem: React.FC<{
  id: ConfigPanel;
  name: string;
  icon: string;
  active: boolean;
  isCollapsed: boolean;
  onClick: (id: ConfigPanel) => void;
}> = ({ id, name, icon, active, isCollapsed, onClick }) => (
  <button
    title={name}
    onClick={() => onClick(id)}
    className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-md font-medium transition-colors relative overflow-hidden min-h-[44px] ${
      isCollapsed ? "justify-center" : ""
    } ${
      active
        ? "bg-[var(--primary-color)]/20 text-[var(--primary-color)]"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
    }`}
  >
    {active && (
      <motion.div
        layoutId="active-config-indicator"
        className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--primary-color)] rounded-r-full"
      ></motion.div>
    )}
    <AppIcon
      name={icon}
      className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? "" : "ml-2"}`}
    />
    {!isCollapsed && <span className="truncate">{name}</span>}
  </button>
);

export default NavItem;
