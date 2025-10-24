import React from 'react';
import BlurredCard from '../BlurredCard';

// --- App Card Skeleton Component ---
const AppCardSkeleton: React.FC = () => (
    <BlurredCard className="flex flex-col items-center text-center p-4 h-full animate-pulse">
        {/* Icon placeholder */}
        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600/50 rounded-md mb-2" />
        <div className="flex-grow w-full flex flex-col justify-center items-center py-2 space-y-2">
            {/* Title placeholder */}
            <div className="h-4 bg-gray-300 dark:bg-gray-600/50 rounded w-3/4" />
            {/* Description placeholder */}
            <div className="h-3 bg-gray-300 dark:bg-gray-600/50 rounded w-full" />
            <div className="h-3 bg-gray-300 dark:bg-gray-600/50 rounded w-5/6" />
        </div>
        {/* Button placeholder */}
        <div className="h-10 w-full flex items-center justify-center flex-shrink-0">
            <div className="h-7 w-20 bg-gray-300 dark:bg-gray-600/50 rounded-md" />
        </div>
    </BlurredCard>
);

export default AppCardSkeleton;
