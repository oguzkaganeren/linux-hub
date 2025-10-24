import React, { useCallback } from 'react';
import BlurredCard from '../../components/BlurredCard';
import Panel from '../../components/configuration/Panel';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setPrimaryColor } from '../../store/themeSlice';
import { translations } from '../../data/translations';
import { colors } from '../../data/config';


const PersonalizationPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const theme = useAppSelector(state => state.theme);
    const language = useAppSelector(state => state.app.language);
    const t = useCallback((key: string): string => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    }, [language]);
    return (
        <Panel title={t('personalization')}>
            <BlurredCard className="p-6">
                <h2 className="text-xl font-semibold mb-4">{t('accent_color')}</h2>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    {colors.map(color => (
                        <button key={color} onClick={() => dispatch(setPrimaryColor(color))} style={{backgroundColor: color}} className={`w-full h-20 rounded-lg transition-transform transform hover:scale-105 ${theme.primaryColor === color ? 'ring-4 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-800 ring-white' : ''}`} />
                    ))}
                        <div className="w-full h-20 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-medium text-sm">{t('more')}</div>
                </div>
            </ BlurredCard>
        </Panel>
    )
}

export default PersonalizationPanel;