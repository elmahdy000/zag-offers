import React from 'react';
import { Tag, Plus, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({ title, description, actionText, onAction }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 text-center glass rounded-[2.5rem] border-dashed border-2 border-white/5 bg-white/[0.01]"
    >
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
        <Tag className="text-primary" size={32} />
      </div>
      <h3 className="text-lg font-black text-text mb-2">{title}</h3>
      <p className="text-[13px] text-text-dim max-w-xs mb-8 leading-relaxed">{description}</p>
      
      {actionText && (
        <button 
          onClick={onAction}
          className="bg-primary text-white px-6 py-3 rounded-xl font-black text-[13px] shadow-lg shadow-primary/20 hover:bg-primary-lt transition-all flex items-center gap-2 group"
        >
          {actionText}
          <Plus size={16} className="group-hover:rotate-90 transition-transform" />
        </button>
      )}
    </motion.div>
  );
}
