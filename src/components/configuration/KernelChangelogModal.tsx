import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Kernel } from '../../types';
import { useAppSelector } from '../../store/hooks';
import { translations } from '../../data/translations';
import { kernelChangelogs } from '../../data/changelogs';

interface KernelChangelogModalProps {
    kernel: Kernel;
    onClose: () => void;
}

const KernelChangelogModal: React.FC<KernelChangelogModalProps> = ({ kernel, onClose }) => {
    const language = useAppSelector(state => state.app.language);
    const t = useCallback((key: string): string => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    }, [language]);

    const parseMarkdown = useCallback((markdown: string): string => {
        const lines = markdown.trim().split('\n');
        let html = '<ul class="space-y-2 text-gray-600 dark:text-gray-300">';
        lines.forEach(line => {
            if (line.startsWith('- ')) {
                let listItem = line.substring(2);
                listItem = listItem.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-700 dark:text-gray-100">$1</strong>');
                html += `<li class="ml-5 list-disc">${listItem}</li>`;
            }
        });
        html += '</ul>';
        return html;
    }, []);
    
    const changelogContent = kernelChangelogs[kernel.pkg] || '<p>No changelog available for this version.</p>';
    const changelogHtml = parseMarkdown(changelogContent);

    return (
        <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl md:text-2xl font-bold">{`Linux ${kernel.version} - ${t('changelog')}`}</h2>
                        <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors z-10">
                            <X size={24} />
                        </button>
                    </div>

                    <div dangerouslySetInnerHTML={{ __html: changelogHtml }} />

                </div>
            </motion.div>
        </motion.div>
    );
};

export default KernelChangelogModal;