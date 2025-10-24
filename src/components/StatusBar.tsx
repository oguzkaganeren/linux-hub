import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import InstallQueue from './InstallQueue';
import { useAppSelector } from '../store/hooks';
import { selectInstallQueue, selectIsInstalling, selectInstallingPackages } from '../store/packagesSlice';
import { translations } from '../data/translations';
import { motion, AnimatePresence } from 'framer-motion';


const StatusBar: React.FC = () => {
    const online = useAppSelector((state) => state.app.online);
    const language = useAppSelector((state) => state.app.language);
    const installQueue = useAppSelector(selectInstallQueue);
    const isInstalling = useAppSelector(selectIsInstalling);
    const installingPackages = useAppSelector(selectInstallingPackages);
    
    const [taskMessage, setTaskMessage] = useState<string | null>(null);
    const messageTimerRef = useRef<number | null>(null);
    const prevInstallCountRef = useRef(0);

    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        let translation = translations[language]?.[key] || translations['en']?.[key] || key;
        if (params) {
            Object.entries(params).forEach(([paramKey, value]) => {
                translation = translation.replace(`{${paramKey}}`, String(value));
            });
        }
        return translation;
    }, [language]);
    
    useEffect(() => {
        if (messageTimerRef.current) {
            clearTimeout(messageTimerRef.current);
        }

        const currentInstallCount = installingPackages.length;

        if (currentInstallCount > 0) {
            // Only show a new message if a new task has been added
            if (currentInstallCount > prevInstallCountRef.current) {
                let text = '';
                if (currentInstallCount === 1) {
                    text = `${t('installing')} ${installingPackages[0].name}...`;
                } else {
                    text = t('installing_package_count', { count: currentInstallCount });
                }
                setTaskMessage(text);
                
                messageTimerRef.current = window.setTimeout(() => {
                    setTaskMessage(null);
                }, 4000); // Display for 4 seconds
            }
        } else {
            // All tasks finished, clear any lingering message
            setTaskMessage(null);
        }
        
        prevInstallCountRef.current = currentInstallCount;

        return () => {
            if (messageTimerRef.current) {
                clearTimeout(messageTimerRef.current);
            }
        };
    }, [installingPackages, t]);

    const [showInstallQueue, setShowInstallQueue] = useState(false);

    return (
        <>
            <div className="flex items-center justify-between h-12 px-4 md:px-6 bg-white dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 text-sm ${online ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {online ? <Wifi size={16} /> : <WifiOff size={16} />}
                        <span>{online ? t('internet_connected') : t('internet_disconnected')}</span>
                    </div>
                    
                    <AnimatePresence>
                        {taskMessage && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="text-sm overflow-hidden whitespace-nowrap text-gray-600 dark:text-gray-400"
                            >
                                <span className="px-1">{taskMessage}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isInstalling && (
                        <motion.div
                            title={t('background_tasks_running')}
                            className="w-2.5 h-2.5 rounded-full bg-[var(--primary-color)]"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.7, 1, 0.7],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    )}
                </div>
                <div className="flex items-center gap-6">
                    {installQueue.length > 0 &&
                        <button onClick={() => setShowInstallQueue(s => !s)} className="text-sm font-medium relative">
                           {t('install_queue')}
                           <span className="absolute -top-1 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary-color)] text-xs text-white">
                                {installQueue.length}
                           </span>
                        </button>
                    }
                </div>
            </div>
            {showInstallQueue && <InstallQueue onClose={() => setShowInstallQueue(false)} />}
        </>
    );
};

export default StatusBar;