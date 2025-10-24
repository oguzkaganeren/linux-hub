import React from 'react';
import AppIcon from '../icons';

const HeaderCard: React.FC<{icon: string; title: string; subtitle: string;}> = ({icon, title, subtitle}) => (
    <div className="flex items-center gap-4 flex-1">
        <AppIcon name={icon} className="w-6 h-6 text-[var(--primary-color)]" />
        <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">{title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
    </div>
);

export default HeaderCard;