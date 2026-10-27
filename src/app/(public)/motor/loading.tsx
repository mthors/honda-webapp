import React from 'react';
import { Container } from '@/components/ui/Container';

export default function MotorCatalogLoading() {
  return (
    <div className="py-10 sm:py-16">
      <Container>
        {/* Header Skeleton */}
        <div className="max-w-xl mb-8 sm:mb-10 animate-pulse">
          <div className="h-5 w-32 bg-neutral-2 mb-3" />
          <div className="h-9 w-3/4 bg-neutral-2 mb-3" />
          <div className="h-4 w-full bg-neutral-2" />
        </div>

        {/* Filter Skeleton */}
        <div className="mb-10 pb-6 border-b border-hairline animate-pulse">
          <div className="h-10 w-full max-w-md bg-neutral-2 mb-4" />
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-neutral-2" />
            <div className="h-8 w-20 bg-neutral-2" />
            <div className="h-8 w-20 bg-neutral-2" />
            <div className="h-8 w-20 bg-neutral-2" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="border border-hairline bg-canvas flex flex-col h-96 animate-pulse"
            >
              <div className="w-full aspect-[16/10] bg-neutral-2" />
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="h-5 w-2/3 bg-neutral-2 mb-2" />
                  <div className="h-3 w-1/3 bg-neutral-2 mb-4" />
                  <div className="h-3 w-full bg-neutral-2 mb-1" />
                  <div className="h-3 w-4/5 bg-neutral-2" />
                </div>
                <div className="pt-4 border-t border-hairline">
                  <div className="h-5 w-1/2 bg-neutral-2 mb-3" />
                  <div className="h-9 w-full bg-neutral-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
