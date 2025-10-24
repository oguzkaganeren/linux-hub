import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import BlurredCard from '../../components/BlurredCard';
import Panel from '../../components/configuration/Panel';
import AddLocaleModal from '../../components/configuration/AddLocaleModal';
import LocaleContextMenu from '../../components/configuration/LocaleContextMenu';
import { useAppSelector } from '../../store/hooks';
import { translations } from '../../data/translations';
import { SystemLocale } from '../../types';

type ActiveTab = 'system' | 'detailed';

const initialSystemLocales: SystemLocale[] = [
    { name: 'English (United States)', id: 'en_US.UTF-8' },
    { name: 'Türkçe (Türkiye)', id: 'tr_TR.UTF-8' },
];

const detailedLocales = [
    { value: 'en_US.UTF-8', label: 'English - United States (en_US.UTF-8)' },
    { value: 'tr_TR.UTF-8', label: 'Türkçe - Türkiye (tr_TR.UTF-8)' },
    { value: 'de_DE.UTF-8', label: 'Deutsch - Deutschland (de_DE.UTF-8)' },
    { value: 'es_ES.UTF-8', label: 'Español - España (es_ES.UTF-8)' },
];

const LocaleSettingRow: React.FC<{ label: string, options: typeof detailedLocales, value: string, onChange: (value: string) => void }> = ({ label, options, value, onChange }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-1 md:gap-0">
        <label className="text-left md:text-right pr-4 text-gray-700 dark:text-gray-300">{label}:</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="md:col-span-2 bg-gray-100 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none appearance-none"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
            }}
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const LocalePanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('system');
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; locale: SystemLocale } | null>(null);
    const [systemLocales, setSystemLocales] = useState<SystemLocale[]>(initialSystemLocales);
    
    // State for assignments
    const [displayLocaleId, setDisplayLocaleId] = useState('en_US.UTF-8');
    const [formatLocaleId, setFormatLocaleId] = useState('tr_TR.UTF-8');

    const language = useAppSelector(state => state.app.language);
    const t = useCallback((key: string): string => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    }, [language]);
    
    const handleLocaleClick = (e: React.MouseEvent, locale: SystemLocale) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenu({
            x: rect.left,
            y: rect.bottom,
            locale,
        });
    };

    const handleAddLocale = (locale: SystemLocale) => {
        if (!systemLocales.some(l => l.id === locale.id)) {
            setSystemLocales(prev => [...prev, locale]);
        }
        setAddModalOpen(false);
    };

    const handleSetDisplay = (localeId: string) => setDisplayLocaleId(localeId);
    const handleSetFormat = (localeId: string) => setFormatLocaleId(localeId);
    
    useEffect(() => {
        if (contextMenu) {
            const handleClickOutside = () => setContextMenu(null);
            window.addEventListener('click', handleClickOutside);
            return () => window.removeEventListener('click', handleClickOutside);
        }
    }, [contextMenu]);

    const displayLanguageSettings = [
        { key: 'language', label: t('language') },
        { key: 'collation_and_sorting', label: t('collation_and_sorting') },
        { key: 'messages', label: t('messages') },
        { key: 'ctype', label: t('ctype') },
    ];

    const formatSettings = [
        { key: 'numbers', label: t('numbers') },
        { key: 'time', label: t('time') },
        { key: 'currency', label: t('currency') },
        { key: 'measurement_units', label: t('measurement_units') },
        { key: 'address', label: t('address') },
        { key: 'names', label: t('names') },
        { key: 'telephone', label: t('telephone') },
        { key: 'identification', label: t('identification') },
        { key: 'paper', label: t('paper') },
    ];
    
    return (
        <Panel title={t('locale_settings')}>
            <div className="flex justify-end items-center gap-2 mb-4 -mt-4">
                 <button onClick={() => setAddModalOpen(true)} className="px-6 py-2 rounded-md font-semibold text-gray-700 dark:text-gray-200 bg-gray-200/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-500 hover:bg-gray-300/50 dark:hover:bg-gray-600/50 transition-colors">
                    {t('add')}
                </button>
                 <button disabled className="px-6 py-2 rounded-md font-semibold text-gray-500 dark:text-gray-400 bg-gray-500/10 dark:bg-gray-900/20 border border-gray-500/20 dark:border-gray-100/10 disabled:opacity-70 disabled:cursor-not-allowed">
                    {t('remove')}
                </button>
                 <button disabled className="px-6 py-2 rounded-md font-semibold text-gray-500 dark:text-gray-400 bg-gray-500/10 dark:bg-gray-900/20 border border-gray-500/20 dark:border-gray-100/10 disabled:opacity-70 disabled:cursor-not-allowed">
                    {t('restore')}
                </button>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={() => setActiveTab('system')}
                    className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                        activeTab === 'system'
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100'
                        : 'bg-transparent text-gray-600 dark:text-gray-400'
                    }`}
                >
                    {t('system_locales')}
                </button>
                <button
                    onClick={() => setActiveTab('detailed')}
                    className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                        activeTab === 'detailed'
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100'
                        : 'bg-transparent text-gray-600 dark:text-gray-400'
                    }`}
                >
                    {t('detailed_settings')}
                </button>
            </div>

            <BlurredCard className="p-4 md:p-8 min-h-[300px]">
                {activeTab === 'detailed' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">{t('display_language')}</h2>
                            <div className="space-y-4">
                                {displayLanguageSettings.map(setting => (
                                    <LocaleSettingRow key={setting.key} label={setting.label} options={detailedLocales} value={displayLocaleId} onChange={setDisplayLocaleId} />
                                ))}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">{t('formats')}</h2>
                             <div className="space-y-4">
                                {formatSettings.map(setting => (
                                    <LocaleSettingRow key={setting.key} label={setting.label} options={detailedLocales} value={formatLocaleId} onChange={setFormatLocaleId} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                 {activeTab === 'system' && (
                    <div className="space-y-2">
                       {systemLocales.map(locale => {
                           const roles = [];
                           if (locale.id === displayLocaleId) roles.push(t('display_language'));
                           if (locale.id === formatLocaleId) roles.push(t('formats'));
                           
                           return (
                               <button 
                                   key={locale.id} 
                                   onClick={(e) => handleLocaleClick(e, locale)} 
                                   className="flex justify-between items-center p-4 rounded-lg w-full text-left hover:bg-gray-100/80 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                                >
                                    <div>
                                        <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{locale.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{locale.id}</p>
                                    </div>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{roles.join(', ')}</span>
                                </button>
                           );
                       })}
                    </div>
                )}
            </BlurredCard>

            <AnimatePresence>
                {isAddModalOpen && <AddLocaleModal onAdd={handleAddLocale} onClose={() => setAddModalOpen(false)} />}
            </AnimatePresence>

            <AnimatePresence>
                {contextMenu && (
                    <LocaleContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        locale={contextMenu.locale}
                        onSetDisplay={handleSetDisplay}
                        onSetFormat={handleSetFormat}
                        onClose={() => setContextMenu(null)}
                    />
                )}
            </AnimatePresence>
        </Panel>
    );
};

export default LocalePanel;