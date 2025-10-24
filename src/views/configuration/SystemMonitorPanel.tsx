import React, { useState, useEffect, useCallback } from 'react';
import BlurredCard from '../../components/BlurredCard';
import Panel from '../../components/configuration/Panel';
import Gauge from '../../components/configuration/Gauge';
import { useAppSelector } from '../../store/hooks';
import { translations } from '../../data/translations';


const SystemMonitorPanel: React.FC = () => {
    const language = useAppSelector(state => state.app.language);
    const t = useCallback((key: string): string => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    }, [language]);
    const [usage, setUsage] = useState({
        cpu: Math.random() * 80 + 10,
        ram: Math.random() * 70 + 20,
        disk: 72, // static for now
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setUsage(prev => ({
                ...prev,
                cpu: Math.random() * 80 + 10,
                ram: Math.random() * 70 + 20,
            }));
        }, 2000); // Update every 2 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <Panel title={t('system_monitor')}>
            <BlurredCard className="p-6">
                <h2 className="text-xl font-semibold mb-6">{t('live_stats')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
                    <Gauge percentage={usage.cpu} label={t('cpu_usage')} color="text-[var(--primary-color)]" />
                    <Gauge percentage={usage.ram} label={t('ram_usage')} color="text-purple-500" />
                    <Gauge percentage={usage.disk} label={t('disk_usage')} color="text-green-500" />
                </div>
            </BlurredCard>
        </Panel>
    );
};

export default SystemMonitorPanel;