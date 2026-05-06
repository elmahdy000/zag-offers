import React from 'react';

const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div className={`animate-pulse bg-white/[0.03] border border-white/[0.03] rounded-2xl ${className}`}></div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="p-8 space-y-10 animate-in max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-12 w-40" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-36 w-full rounded-[2.5rem]" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="lg:col-span-2 h-[500px] w-full rounded-[2.5rem]" />
        <div className="space-y-8">
          <Skeleton className="h-[300px] w-full rounded-[2.5rem]" />
          <Skeleton className="h-[150px] w-full rounded-[2.5rem]" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
