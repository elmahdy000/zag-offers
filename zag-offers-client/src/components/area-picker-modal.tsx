"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiMapPin2Fill, RiCloseLine, RiCheckLine, RiSearch2Line,
  RiStarSmileFill, RiRestaurant2Fill, RiCupFill, RiGobletFill,
  RiStore2Fill, RiWaterFlashFill, RiHeart2Fill, RiBuilding2Fill,
  RiCompass3Fill, RiPriceTag3Fill
} from 'react-icons/ri';
import { ZAGAZIG_NEIGHBORHOODS } from '@/lib/constants';

interface AreaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedArea: string;
  onSelectArea: (area: string) => void;
}

function getNeighborhoodIcon(iconName: string) {
  switch (iconName) {
    case 'stars':
      return <RiStarSmileFill size={20} className="text-[#FF6500]" />;
    case 'restaurant':
      return <RiRestaurant2Fill size={20} className="text-emerald-400" />;
    case 'coffee':
      return <RiCupFill size={20} className="text-amber-400" />;
    case 'fastfood':
      return <RiGobletFill size={20} className="text-orange-400" />;
    case 'water':
      return <RiWaterFlashFill size={20} className="text-cyan-400" />;
    case 'store':
      return <RiStore2Fill size={20} className="text-blue-400" />;
    case 'park':
      return <RiCompass3Fill size={20} className="text-lime-400" />;
    case 'flower':
      return <RiHeart2Fill size={20} className="text-rose-400" />;
    case 'tag':
      return <RiPriceTag3Fill size={20} className="text-amber-500" />;
    case 'school':
    case 'home':
    case 'medical':
    default:
      return <RiBuilding2Fill size={20} className="text-slate-400" />;
  }
}

export function AreaPickerModal({
  isOpen,
  onClose,
  selectedArea,
  onSelectArea
}: AreaPickerModalProps) {
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setSearch('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const filteredNeighborhoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ZAGAZIG_NEIGHBORHOODS;
    return ZAGAZIG_NEIGHBORHOODS.filter(n => 
      n.name.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal Card / Bottom Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="area-picker-title"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative w-full max-w-xl max-h-[85vh] sm:max-h-[82vh] overflow-hidden rounded-t-[32px] sm:rounded-[28px] border border-white/10 bg-[#0A1324] shadow-2xl flex flex-col z-10"
          >
            {/* Sheet Handle for Mobile */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <span className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 bg-[#0C172A]/70">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FF6500]/15 border border-[#FF6500]/30 flex items-center justify-center text-[#FF6500] shadow-[0_2px_12px_rgba(255,101,0,0.2)]">
                  <RiMapPin2Fill size={22} />
                </div>
                <div>
                  <h3 id="area-picker-title" className="text-base sm:text-lg font-black text-white">
                    اختر منطقتك في الزقازيق 📍
                  </h3>
                  <p className="text-xs text-[#8FA0B8] mt-0.5 font-medium">
                    هنظهرلك العروض والمطاعم الأقرب ليك
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="إغلاق نافذة المناطق"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6500]"
              >
                <RiCloseLine size={22} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 sm:px-6 sm:py-3.5 border-b border-white/5 bg-[#07101E]/60">
              <div className="relative">
                <RiSearch2Line className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="ابحث باسم الحي أو المنطقة..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-11 pr-10 pl-4 rounded-xl bg-[#101A2B] border border-white/10 text-sm font-medium text-white placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF6500]/50 focus:border-[#FF6500] transition-all"
                />
              </div>
            </div>

            {/* Neighborhoods List */}
            <div className="overflow-y-auto flex-1 p-3 sm:p-5 space-y-2 overscroll-contain">
              {filteredNeighborhoods.map((n) => {
                const isSelected = (!selectedArea && n.name === 'الكل') || selectedArea === n.name;
                return (
                  <button
                    key={n.name}
                    type="button"
                    onClick={() => {
                      onSelectArea(n.name === 'الكل' ? '' : n.name);
                      handleClose();
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-right min-h-[58px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6500] ${
                      isSelected
                        ? 'bg-[#FF6500]/15 border-[#FF6500]/50 shadow-[0_4px_16px_rgba(255,101,0,0.18)]'
                        : 'bg-[#101A2B]/60 hover:bg-[#15233A] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-[#FF6500] text-white shadow-md shadow-[#FF6500]/30' : 'bg-white/5'
                      }`}>
                        {isSelected ? <RiCheckLine size={20} className="text-white" /> : getNeighborhoodIcon(n.icon)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold truncate ${isSelected ? 'text-[#FF8A32]' : 'text-white'}`}>
                            {n.name}
                          </span>
                          {n.name === 'الكل' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-bold">
                              الافتراضي
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8FA0B8] truncate mt-0.5">
                          {n.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 mr-2">
                      <span className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-[#FF6500] bg-[#FF6500] text-white'
                          : 'border-white/20 bg-transparent'
                      }`}>
                        {isSelected && <RiCheckLine size={14} />}
                      </span>
                    </div>
                  </button>
                );
              })}

              {filteredNeighborhoods.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  <RiMapPin2Fill size={36} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-bold">لم نجد منطقة مطابقة لبحثك</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-[#0C172A]/70 flex items-center justify-between">
              <span className="text-xs text-[#8FA0B8]">
                {selectedArea ? `المنطقة المختارة: ${selectedArea}` : 'كل مناطق الزقازيق'}
              </span>
              {selectedArea && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectArea('');
                    handleClose();
                  }}
                  className="text-xs text-[#FF8A32] font-bold hover:underline py-1 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6500] rounded-lg"
                >
                  إعادة تعيين للكل
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
