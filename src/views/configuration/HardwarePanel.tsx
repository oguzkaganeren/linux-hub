import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import Panel from '../../components/configuration/Panel';
import AppIcon from '../../components/icons';
import { useAppSelector } from '../../store/hooks';
import { translations } from '../../data/translations';
import { hardwareData, HardwareCategory, Device, Driver } from '../../data/hardware';

const HardwarePanel: React.FC = () => {
    const [showAll, setShowAll] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
        'display_controller': true,
        'GM107M [GeForce GTX 960M] (Nvidia Corporation)': true,
        'HD Graphics 530 (Intel Corporation)': true,
    });
    const language = useAppSelector(state => state.app.language);

    const t = useCallback((key: string): string => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    }, [language]);

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const CheckboxIcon: React.FC<{ checked: boolean }> = ({ checked }) => {
        if (checked) {
            return <Check size={16} className="text-green-500" />;
        }
        return <div className="w-4 h-4 border-2 border-gray-400 dark:border-gray-500 rounded-sm" />;
    };
    
    const DriverRow: React.FC<{ driver: Driver, level: number }> = ({ driver, level }) => (
        <div className="grid grid-cols-[1fr_minmax(0,_100px)_minmax(0,_80px)] items-center text-sm py-2 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 rounded" style={{ paddingLeft: `${level * 24}px` }}>
            <div className="flex items-center gap-3 font-medium">
                <AppIcon name={driver.icon} className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{driver.name}</span>
            </div>
            <div className="flex justify-center"><CheckboxIcon checked={driver.openSource} /></div>
            <div className="flex justify-center"><CheckboxIcon checked={driver.installed} /></div>
        </div>
    );

    const DeviceRow: React.FC<{ device: Device, level: number }> = ({ device, level }) => {
        const isExpanded = !!expandedItems[device.name];
        return (
            <div>
                <button onClick={() => toggleExpand(device.name)} className="w-full grid grid-cols-[1fr_minmax(0,_100px)_minmax(0,_80px)] items-center text-sm py-2 font-semibold hover:bg-gray-100/80 dark:hover:bg-gray-700/50 rounded" style={{ paddingLeft: `${level * 24}px` }}>
                    <div className="flex items-center gap-2 text-left">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <span className="truncate">{device.name}</span>
                    </div>
                </button>
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            {device.drivers.map(driver => <DriverRow key={driver.name} driver={driver} level={level + 1} />)}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    const CategoryRow: React.FC<{ category: HardwareCategory, level: number }> = ({ category, level }) => {
        const isExpanded = !!expandedItems[category.name];
        return (
            <div className="border-b border-gray-200 dark:border-gray-700">
                <button onClick={() => toggleExpand(category.name)} className="w-full grid grid-cols-[1fr_minmax(0,_100px)_minmax(0,_80px)] items-center text-sm py-3 font-bold text-gray-800 dark:text-gray-200 bg-gray-100/50 dark:bg-gray-800/20" style={{ paddingLeft: `${level * 24}px` }}>
                     <div className="flex items-center gap-2 text-left">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <span className="capitalize">{t(category.name)}</span>
                    </div>
                </button>
                 <AnimatePresence>
                    {isExpanded && (
                         <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            {category.devices.map(device => <DeviceRow key={device.name} device={device} level={level + 1} />)}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <Panel title={t('hardware_configuration')}>
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                <button className="px-4 py-2 w-full sm:w-auto sm:flex-1 rounded-md font-semibold text-gray-700 dark:text-gray-200 bg-gray-200/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-500 hover:bg-gray-300/50 dark:hover:bg-gray-600/50 transition-colors">
                    {t('auto_install_proprietary')}
                </button>
                <button className="px-4 py-2 w-full sm:w-auto sm:flex-1 rounded-md font-semibold text-gray-700 dark:text-gray-200 bg-gray-200/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-500 hover:bg-gray-300/50 dark:hover:bg-gray-600/50 transition-colors">
                    {t('auto_install_opensource')}
                </button>
            </div>
            
            <div className="bg-white/30 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[1fr_minmax(0,_100px)_minmax(0,_80px)] items-center text-sm font-bold p-3 bg-gray-200/50 dark:bg-gray-900/30 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    <span>{t('driver')}</span>
                    <span className="text-center">{t('open_source')}</span>
                    <span className="text-center">{t('installed')}</span>
                </div>
                {/* Body */}
                <div className="py-2">
                    {hardwareData.map(category => <CategoryRow key={category.name} category={category} level={0} />)}
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
                <input
                    id="show-all"
                    type="checkbox"
                    checked={showAll}
                    onChange={() => setShowAll(s => !s)}
                    className="w-4 h-4 rounded text-[var(--primary-color)] bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-[var(--primary-color)]"
                />
                <label htmlFor="show-all" className="font-medium text-sm">
                    {t('show_all_devices')}
                </label>
            </div>
        </Panel>
    );
};

export default HardwarePanel;