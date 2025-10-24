import React, { useCallback } from 'react';
import BlurredCard from '../../components/BlurredCard';
import Panel from '../../components/configuration/Panel';
import { useAppSelector } from '../../store/hooks';
import { translations } from '../../data/translations';
import { devices } from '../../data/config';

const StoragePanel: React.FC = () => {
    const language = useAppSelector(state => state.app.language);
    const t = useCallback((key: string): string => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    }, [language]);
    return (
    <Panel title={t('storage_devices')}>
        <BlurredCard className="p-6">
            <div className="space-y-6">
                {devices.map(d => (
                    <div key={d.name}>
                        <div className="flex justify-between font-semibold text-sm mb-1">
                            <span>{d.name} ({d.type})</span>
                            <span>{d.used} / {d.size}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div className="bg-[var(--primary-color)] h-2.5 rounded-full" style={{width: `${d.usage}%`}}></div>
                        </div>
                    </div>
                ))}
            </div>
        </BlurredCard>
    </Panel>
    );
};

export default StoragePanel;