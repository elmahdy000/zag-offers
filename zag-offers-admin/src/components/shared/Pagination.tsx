'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, lastPage, onPageChange }: PaginationProps) {
  if (lastPage <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (lastPage <= maxVisible) {
      return Array.from({ length: lastPage }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(lastPage - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < lastPage - 2) {
      pages.push('...');
    }

    pages.push(lastPage);

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
      >
        <ChevronRight size={18} />
      </button>

      {getPageNumbers().map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="h-10 w-10 flex items-center justify-center text-slate-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`h-10 w-10 rounded-xl text-sm font-bold transition-all ${
              currentPage === page
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
        className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
      >
        <ChevronLeft size={18} />
      </button>

      <span className="text-xs font-medium text-slate-400 mr-4">
        صفحة {currentPage} من {lastPage}
      </span>
    </div>
  );
}
