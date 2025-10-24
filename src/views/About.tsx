import React, { useState, useEffect, useCallback } from 'react';
import BlurredCard from '../components/BlurredCard';
import AppIcon from '../components/icons';
import { motion } from 'framer-motion';
import { useAppSelector } from '../store/hooks';
import { translations } from '../data/translations';

const About: React.FC = () => {
  const language = useAppSelector(state => state.app.language);
  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  }, [language]);
  
  const version = '1.1.0'; 
  const [changelogHtml, setChangelogHtml] = useState<string>('');
  const [loadingChangelog, setLoadingChangelog] = useState<boolean>(true);

  const parseMarkdown = useCallback((markdown: string): string => {
    const lines = markdown.split('\n');
    let html = '';
    let inList = false;

    lines.forEach(line => {
      if (line.startsWith('## ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<h3 class="text-lg md:text-xl font-semibold mt-6 mb-2 text-gray-800 dark:text-gray-200">${line.substring(3)}</h3>`;
      } else if (line.startsWith('# ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<h2 class="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">${line.substring(2)}</h2>`;
      } else if (line.startsWith('- ')) {
        if (!inList) {
          html += '<ul class="space-y-2 text-gray-600 dark:text-gray-300">';
          inList = true;
        }
        let listItem = line.substring(2);
        listItem = listItem.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-700 dark:text-gray-100">$1</strong>');
        html += `<li class="ml-5 list-disc">${listItem}</li>`;
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        if (line.trim() !== '') {
          html += `<p class="text-gray-600 dark:text-gray-300">${line}</p>`;
        }
      }
    });

    if (inList) {
      html += '</ul>';
    }

    return html;
  }, []);

  useEffect(() => {
    fetch('/changelog.md')
      .then(response => {
        if (!response.ok) {
          throw new Error('Changelog file not found');
        }
        return response.text();
      })
      .then(text => {
        setChangelogHtml(parseMarkdown(text));
      })
      .catch(error => {
        console.error('Error fetching changelog:', error);
        setChangelogHtml('<p>Could not load changelog.</p>');
      })
      .finally(() => {
        setLoadingChangelog(false);
      });
  }, [parseMarkdown]);

  return (
    <div className="h-full flex flex-col items-center p-8 overflow-y-auto">
      <motion.div
        className="w-full max-w-2xl mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <BlurredCard className="p-8 w-full">
          <div className="text-center mb-6">
            <AppIcon
              name="system"
              className="w-20 h-20 mx-auto text-[var(--primary-color)] mb-4"
            />
            <h1 className="text-3xl md:text-4xl font-bold">{t('app_name')}</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">
              {t('version')} {version}
            </p>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            {t('app_subtitle')}
          </p>

          <hr className="border-gray-200 dark:border-gray-700 my-6" />

          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-center">
            {t('credits')}
          </h2>
          <div className="text-center space-y-2 text-gray-700 dark:text-gray-200">
            <p>
              <span className="font-semibold">Lead Developer:</span> AI Engineer
            </p>
            <p>
              <span className="font-semibold">UI/UX Design:</span> AI Engineer
            </p>
            <p className="pt-4 text-sm text-gray-500 dark:text-gray-400">
              {t('about_powered_by')}
            </p>
          </div>
          
          <hr className="border-gray-200 dark:border-gray-700 my-8" />

          <div className="text-left">
            {loadingChangelog ? (
              <p className="text-center text-gray-500 dark:text-gray-400">Loading changelog...</p>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: changelogHtml }} />
            )}
          </div>
        </BlurredCard>
      </motion.div>
    </div>
  );
};

export default About;