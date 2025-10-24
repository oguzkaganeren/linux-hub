import React from 'react';
import { motion } from 'framer-motion';
import { useAppSelector } from '../../store/hooks';
import { translations } from '../../data/translations';
import { SystemLocale } from '../../types';

interface LocaleContextMenuProps {
    x: number;
    y: number;
    locale: SystemLocale;
    onSetDisplay: (localeId: string) => void;
    onSetFormat: (localeId: string) => void;
    onClose: () => void;
}

const LocaleContextMenu: React.FC<LocaleContextMenuProps> = ({ x, y, locale, onSetDisplay, onSetFormat, onClose }) => {
    const language = useAppSelector(state => state.app.language);
    const t = (key: string) => translations[language]?.[key] || key;

    const handleAction = (action: 'display' | 'format' | 'both') => {
        if (action === 'display' || action === 'both') {
            onSetDisplay(locale.id);
        }
        if (action === 'format' || action === 'both') {
            onSetFormat(locale.id);
        }
        onClose();
    };

    const menuItems = [
        { label: t('set_as_default_display_and_format'), action: () => handleAction('both') },
        { label: t('set_as_default_display'), action: () => handleAction('display') },
        { label: t('set_as_default_format'), action: () => handleAction('format') },
    ];
    
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-2"
            style={{ top: y + 8, left: x }}
        >
            <ul className="flex flex-col">
                {menuItems.map(item => (
                    <li key={item.label}>
                        <button
                            onClick={item.action}
                            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        >
                            {item.label}
                        </button>
                    </li>
                ))}
            </ul>
        </motion.div>
    );
};

export default LocaleContextMenu;