import type { ReactNode } from 'react';

type SkeletonProps = {
  className?: string;
};

type CardSkeletonProps = {
  className?: string;
  media?: boolean;
};

export function Skeleton({ className = '' }: SkeletonProps) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />;
}

export function ScreenReaderLoading({ children = 'Loading...' }: { children?: ReactNode }) {
  return (
    <span className="sr-only" role="status">
      {children}
    </span>
  );
}

export function CardSkeleton({ className = '', media = true }: CardSkeletonProps) {
  return (
    <div className={`skeleton-card ${className}`} aria-hidden="true">
      {media ? <Skeleton className="skeleton-card__media" /> : null}
      <span className="skeleton-card__body">
        <Skeleton className="skeleton-card__title" />
      </span>
    </div>
  );
}
