'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Inbox, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionText?: string;
  actionIcon?: ReactNode;
  actionHref?: string;
  onAction?: () => void;
  secondaryText?: string;
  secondaryHref?: string;
  compact?: boolean;
}

export default function EmptyState({
  title,
  description,
  icon,
  actionText,
  actionIcon,
  actionHref,
  onAction,
  secondaryText,
  secondaryHref,
  compact = false,
}: EmptyStateProps) {
  const actionContent = (
    <>
      {actionIcon ?? <Plus size={16} aria-hidden="true" />}
      {actionText}
    </>
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`vendor-empty-state ${compact ? 'is-compact' : ''}`}
      aria-label={title}
    >
      <div className="vendor-empty-state-icon" aria-hidden="true">
        {icon ?? <Inbox size={28} />}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>

      {(actionText || (secondaryText && secondaryHref)) && (
        <div className="vendor-empty-state-actions">
          {actionText && actionHref ? (
            <Link href={actionHref} className="vendor-empty-primary">{actionContent}</Link>
          ) : actionText ? (
            <button type="button" onClick={onAction} className="vendor-empty-primary">{actionContent}</button>
          ) : null}
          {secondaryText && secondaryHref ? (
            <Link href={secondaryHref} className="vendor-empty-secondary">{secondaryText}</Link>
          ) : null}
        </div>
      )}
    </motion.section>
  );
}
