'use client';

import { useEffect, useState } from 'react';

interface LoadingOptimizerProps {
  children: React.ReactNode;
}

export default function LoadingOptimizer({ children }: LoadingOptimizerProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple loading optimization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Reduced from complex loading to simple 500ms

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            AquaFarm Pro
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            جاري التحميل...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
