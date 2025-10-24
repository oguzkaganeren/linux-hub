import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import BlurredCard from '../../components/BlurredCard';
import Panel from '../../components/configuration/Panel';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { install, remove } from '../../store/packagesSlice';
import { translations } from '../../data/translations';
import { Kernel, PackageStatus } from '../../types';
import { kernels } from '../../data/config';
import KernelChangelogModal from '../../components/configuration/KernelChangelogModal';


const KernelPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const packagesState = useAppSelector(state => state.packages.packagesState);
    const language = useAppSelector(state => state.app.language);
    const [changelogKernel, setChangelogKernel] = useState<Kernel | null>(null);

    const t = useCallback((key: string): string => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    }, [language]);
    
    const handleRemove = (kernel: Kernel) => {
        const confirmationText = t('remove_kernel_confirm_text').replace('{kernelVersion}', `Linux ${kernel.version}`);
        if (window.confirm(confirmationText)) {
            dispatch(remove(kernel.pkg));
            toast.success(t('toast_kernel_remove_success'));
        }
    };

    const renderButton = (kernel: Kernel) => {
        const state = packagesState[kernel.pkg];
        if (!state) return null;

        switch (state.status) {
            case PackageStatus.NotInstalled:
                return (
                    <button onClick={() => dispatch(install(kernel.pkg))} className="px-4 py-1.5 text-sm bg-[var(--primary-color)] text-white font-semibold rounded-md hover:brightness-90 transition-all w-28 text-center">
                        {t('install')}
                    </button>
                );
            case PackageStatus.Installing:
                return (
                     <div className="w-28 text-center">
                        <div className="w-full bg-gray-300/50 dark:bg-gray-700/50 rounded-full h-2">
                            <motion.div
                                className="bg-[var(--primary-color)] h-2 rounded-full"
                                animate={{ width: `${state.progress || 0}%` }}
                                transition={{ duration: 0.3, ease: 'linear' }}
                            />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {Math.round(state.progress || 0)}%
                        </p>
                    </div>
                );
            case PackageStatus.Installed:
                if (kernel.running) {
                    return (
                        <button disabled className="px-4 py-1.5 text-sm bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-semibold rounded-md cursor-not-allowed w-28 text-center">
                            {t('installed')}
                        </button>
                    );
                }
                return (
                    <button onClick={() => handleRemove(kernel)} className="px-4 py-1.5 text-sm bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors w-28 text-center">
                        {t('remove')}
                    </button>
                );
            case PackageStatus.Error:
                 return (
                    <button onClick={() => dispatch(install(kernel.pkg))} title={state.error} className="px-4 py-1.5 text-sm bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors w-28 text-center">
                        {t('retry')}
                    </button>
                );
            default: return null;
        }
    }

    return (
        <>
            <Panel title={t('kernel_manager')}>
                <p className="text-gray-600 dark:text-gray-400 -mt-4 mb-6">{t('kernel_manager_desc')}</p>
                <BlurredCard className="p-4">
                    <div className="space-y-2">
                        {kernels.map(k => (
                            <div key={k.pkg} className={`flex justify-between items-center p-3 rounded-lg transition-colors ${k.running ? 'bg-[var(--primary-color)]/10' : ''} ${packagesState[k.pkg]?.status === PackageStatus.Error ? 'bg-red-500/10' : 'hover:bg-gray-100/80 dark:hover:bg-gray-700/50'}`}>
                                <div>
                                    <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">Linux {k.version}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {k.running && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300">{t('running')}</span>}
                                        {k.releaseType === 'lts' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">{t('lts')}</span>}
                                        {k.releaseType === 'recommended' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300">{t('recommended')}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setChangelogKernel(k)}
                                        className="px-4 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        {t('changelog')}
                                    </button>
                                    {renderButton(k)}
                                </div>
                            </div>
                        ))}
                    </div>
                </BlurredCard>
            </Panel>
            <AnimatePresence>
                {changelogKernel && (
                    <KernelChangelogModal kernel={changelogKernel} onClose={() => setChangelogKernel(null)} />
                )}
            </AnimatePresence>
        </>
    )
}

export default KernelPanel;