import React from 'react';
import type { Json } from '@/types/database';

interface ProductSpecsProps {
  engineCc: number | null;
  transmission: string | null;
  keySpecs: Record<string, Json>;
}

export function ProductSpecs({ engineCc, transmission, keySpecs }: ProductSpecsProps) {
  // Build core specs
  const coreSpecs: Array<{ label: string; value: string }> = [];
  if (engineCc) {
    coreSpecs.push({ label: 'Tipe & Kapasitas Mesin', value: `${engineCc} cc` });
  }
  if (transmission) {
    coreSpecs.push({ label: 'Tipe Transmisi', value: transmission });
  }

  // Parse keySpecs JSONB categories
  // Examples: { "Mesin": { "Tipe Mesin": "4-Langkah, SOHC", "Daya Maksimum": "11.8 kW / 8,500 rpm" } }
  // or flat key-value: { "Daya Maksimum": "11.8 kW" }
  const sections: Array<{ category: string; items: Array<{ label: string; value: string }> }> = [];

  if (coreSpecs.length > 0) {
    sections.push({ category: 'Spesifikasi Utama', items: coreSpecs });
  }

  if (keySpecs && typeof keySpecs === 'object') {
    Object.entries(keySpecs).forEach(([key, val]) => {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        // Grouped subsection
        const items: Array<{ label: string; value: string }> = [];
        Object.entries(val).forEach(([subKey, subVal]) => {
          if (subVal !== null && subVal !== undefined) {
            items.push({ label: subKey, value: String(subVal) });
          }
        });
        if (items.length > 0) {
          sections.push({ category: key, items });
        }
      } else if (val !== null && val !== undefined && !Array.isArray(val)) {
        // Flat item
        const existingDefault = sections.find((s) => s.category === 'Fitur & Dimensi');
        if (existingDefault) {
          existingDefault.items.push({ label: key, value: String(val) });
        } else {
          sections.push({
            category: 'Fitur & Dimensi',
            items: [{ label: key, value: String(val) }],
          });
        }
      }
    });
  }

  if (sections.length === 0) {
    return (
      <div className="p-6 bg-neutral-2/30 border border-hairline text-center text-xs text-muted">
        Spesifikasi teknis rinci untuk model ini sedang diperbarui oleh tim dealer.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((sec) => (
        <div key={sec.category} className="border border-hairline bg-canvas">
          <div className="px-4 py-3 bg-neutral-2/60 border-b border-hairline">
            <h4 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider font-manrope">
              {sec.category}
            </h4>
          </div>
          <dl className="divide-y divide-hairline">
            {sec.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-3 px-4 py-3 text-xs sm:text-sm hover:bg-neutral-2/20 transition-colors"
              >
                <dt className="font-semibold text-body sm:col-span-1">{item.label}</dt>
                <dd className="text-ink font-medium mt-1 sm:mt-0 sm:col-span-2">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
