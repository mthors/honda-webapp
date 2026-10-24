import React from 'react';
import { Badge } from './Badge';

export interface SectionHeadingProps {
  badge?: string;
  badgeVariant?: 'primary' | 'neutral' | 'success' | 'warning';
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  badge,
  badgeVariant = 'primary',
  title,
  description,
  align = 'left',
  className = '',
}) => {
  const alignmentStyles = align === 'center' ? 'text-center items-center' : 'text-left items-start';

  return (
    <div className={`flex flex-col ${alignmentStyles} mb-8 ${className}`}>
      {badge && (
        <Badge variant={badgeVariant} size="sm" className="mb-3">
          {badge}
        </Badge>
      )}
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-manrope">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm sm:text-base text-body max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
