import React, { useCallback } from 'react';
import BlurredCard from '../../components/BlurredCard';
import Panel from '../../components/configuration/Panel';
import { useAppSelector } from '../../store/hooks';
import { translations } from '../../data/translations';

const UpdatesPanel: React.FC = () => {
    const language = useAppSelector(state => state.app.language);
    const t = useCallback((key: string): string => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    }, [language]);
    return (
    <Panel title={t('updates')}>
         <BlurredCard className="p-6 flex flex-col items-start gap-4">
            <p className="text-gray-600 dark:text-gray-300">Your system is currently up to date. Last checked: 1 day ago.</p>
            <button className="px-6 py-2 bg-[var(--primary-color)] text-white font-semibold rounded-lg shadow-md hover:brightness-90 transition-all">
                {t('check_for_updates')}
            </button>
        </BlurredCard>
    </Panel>
    );
};

export default UpdatesPanel;