'use client';

import React, { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { CatalogCategory } from '@/types/catalog';
import { dealershipCopy } from '@/content/copy/id';

interface CategoryFilterProps {
  categories: CatalogCategory[];
  currentCategory?: string;
  currentSearch?: string;
}

export function CategoryFilter({
  categories,
  currentCategory = 'all',
  currentSearch = '',
}: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = React.useState(currentSearch);
  const [prevSearch, setPrevSearch] = React.useState(currentSearch);

  // Sync state if currentSearch prop changes from URL/parent
  if (currentSearch !== prevSearch) {
    setPrevSearch(currentSearch);
    setSearchValue(currentSearch);
  }

  const updateFilters = (newCategory?: string, newSearch?: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');

    const cat = newCategory !== undefined ? newCategory : currentCategory;
    const q = newSearch !== undefined ? newSearch : searchValue;

    if (cat && cat !== 'all') {
      params.set('kategori', cat);
    } else {
      params.delete('kategori');
    }

    if (q && q.trim().length > 0) {
      params.set('q', q.trim());
    } else {
      params.delete('q');
    }

    startTransition(() => {
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  };

  const handleCategoryClick = (categorySlug: string) => {
    updateFilters(categorySlug, undefined);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(undefined, searchValue);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    updateFilters(undefined, '');
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-md">
        <label htmlFor="catalog-search" className="sr-only">
          {dealershipCopy.catalog.searchAriaLabel}
        </label>
        <div className="relative flex items-center">
          <input
            id="catalog-search"
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={dealershipCopy.catalog.filterPlaceholder}
            className="w-full h-11 pl-4 pr-24 rounded-none bg-canvas text-ink text-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-muted transition-colors"
          />
          <div className="absolute right-1 flex items-center gap-1">
            {searchValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-2 py-1 text-xs text-muted hover:text-ink transition-colors"
                aria-label="Hapus pencarian"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="px-3 py-1.5 bg-neutral-2 text-ink text-xs font-semibold hover:bg-hairline transition-colors"
            >
              Cari
            </button>
          </div>
        </div>
      </form>

      {/* Category Pills/Tabs */}
      <div
        role="tablist"
        aria-label="Filter kategori motor"
        className="flex flex-wrap items-center gap-2 pt-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={currentCategory === 'all'}
          onClick={() => handleCategoryClick('all')}
          disabled={isPending}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
            currentCategory === 'all'
              ? 'bg-ink text-canvas shadow-xs'
              : 'bg-canvas text-body border border-hairline hover:border-ink hover:text-ink'
          }`}
        >
          {dealershipCopy.catalog.allCategories}
        </button>

        {categories.map((cat) => {
          const isSelected = currentCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => handleCategoryClick(cat.slug)}
              disabled={isPending}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                isSelected
                  ? 'bg-ink text-canvas shadow-xs'
                  : 'bg-canvas text-body border border-hairline hover:border-ink hover:text-ink'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
