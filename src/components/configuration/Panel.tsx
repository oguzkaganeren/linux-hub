import React from 'react';

const Panel: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-6">{title}</h1>
        <div className="space-y-6">
            {children}
        </div>
    </>
);

export default Panel;