'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CatalogCategory, CatalogModelSummary } from '@/types/catalog';

interface FloatingHeroFilterProps {
  categories: CatalogCategory[];
  models?: CatalogModelSummary[];
}

export function FloatingHeroFilter({ categories, models = [] }: FloatingHeroFilterProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedEngine, setSelectedEngine] = useState<string>('all');

  const filteredModelOptions =
    selectedCategory === 'all'
      ? models
      : models.filter((m) => m.category.slug === selectedCategory);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (selectedCategory && selectedCategory !== 'all') {
      params.set('kategori', selectedCategory);
    }
    if (selectedModel && selectedModel.trim()) {
      params.set('q', selectedModel.trim());
    }

    const queryStr = params.toString();
    router.push(`/motor${queryStr ? `?${queryStr}` : ''}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 relative z-30">
      <div className="bg-white rounded-xl shadow-[0_15px_45px_rgba(0,0,0,0.12)] border border-neutral-100 p-4 sm:p-5 md:p-6 transition-all duration-300">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
          {/* 1. Category Selector */}
          <div className="lg:col-span-3">
            <label
              htmlFor="hero-filter-category"
              className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 font-manrope"
            >
              Kategori Motor
            </label>
            <select
              id="hero-filter-category"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedModel('');
              }}
              className="w-full h-11 px-3 bg-neutral-50 hover:bg-neutral-100 border border-hairline rounded-md text-xs sm:text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Model Selector */}
          <div className="lg:col-span-4">
            <label
              htmlFor="hero-filter-model"
              className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 font-manrope"
            >
              Pilih Model
            </label>
            <select
              id="hero-filter-model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full h-11 px-3 bg-neutral-50 hover:bg-neutral-100 border border-hairline rounded-md text-xs sm:text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
            >
              <option value="">Semua Model Honda</option>
              {filteredModelOptions.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} ({m.category.name})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Engine Capacity Selector */}
          <div className="lg:col-span-3">
            <label
              htmlFor="hero-filter-engine"
              className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 font-manrope"
            >
              Kapasitas Mesin
            </label>
            <select
              id="hero-filter-engine"
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              className="w-full h-11 px-3 bg-neutral-50 hover:bg-neutral-100 border border-hairline rounded-md text-xs sm:text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
            >
              <option value="all">Semua Kapasitas</option>
              <option value="110">110 cc (Irit Harian)</option>
              <option value="125">125 cc (Lincah & Bertenaga)</option>
              <option value="150">150 cc (Sport & Touring)</option>
              <option value="160">160 cc (Premium eSP+)</option>
            </select>
          </div>

          {/* 4. Submit Search Button (Honda Red) */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary-hover active:translate-y-0.5 text-white font-semibold text-xs sm:text-sm rounded-md flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              aria-label="Cari Motor Honda"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>Cari Motor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
