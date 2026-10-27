-- ==============================================================================
-- Seed Data: supabase/seed.sql
-- Description: Realistic initial catalog seed data for local development & staging.
-- Includes: Categories, motorcycle models, variants, colors, variant_colors,
--           model_images, and illustrative local price fixtures (unverified).
-- ==============================================================================

-- 1. Product Categories
insert into public.categories (id, name, slug, description, sort_order, is_active)
values
  ('11111111-1111-4111-a111-111111111101', 'Matic', 'matic', 'Skutik harian lincah dan berteknologi eSP+ hemat bahan bakar.', 1, true),
  ('11111111-1111-4111-a111-111111111102', 'Cub / Bebek', 'cub', 'Motor bebek legendaris tangguh dan efisien untuk segala medan.', 2, true),
  ('11111111-1111-4111-a111-111111111103', 'Sport', 'sport', 'Performa tinggi dan handling agresif berkarakter balap Honda.', 3, true),
  ('11111111-1111-4111-a111-111111111104', 'Kendaraan Listrik (EV)', 'ev', 'Inovasi mobilitas ramah lingkungan tanpa emisi dengan Honda Mobile Power Pack e:.', 4, true)
on conflict (id) do nothing;

-- 2. Standard Honda Colors
insert into public.colors (id, name, slug, hex_code)
values
  ('22222222-2222-4222-b222-222222222201', 'Grande Matte Black', 'grande-matte-black', '#1A1A1A'),
  ('22222222-2222-4222-b222-222222222202', 'Active Matte Red', 'active-matte-red', '#C8102E'),
  ('22222222-2222-4222-b222-222222222203', 'Grande Matte White', 'grande-matte-white', '#F4F4F4'),
  ('22222222-2222-4222-b222-222222222204', 'Hard Rock Black', 'hard-rock-black', '#222222'),
  ('22222222-2222-4222-b222-222222222205', 'Funk Red Black', 'funk-red-black', '#B31B1B'),
  ('22222222-2222-4222-b222-222222222206', 'Armored Matte Grey', 'armored-matte-grey', '#5A5E65'),
  ('22222222-2222-4222-b222-222222222207', 'Inovative White', 'inovative-white', '#FAFAFA')
on conflict (id) do nothing;

-- 3. Motorcycle Models
-- Model 1: Vario 160 (Published, Featured)
insert into public.motorcycle_models (
  id, category_id, name, slug, short_description, description, engine_cc, transmission,
  key_specs, is_featured, is_new, status, seo_title, seo_description, published_at
) values (
  '33333333-3333-4333-c333-333333333301',
  '11111111-1111-4111-a111-111111111101',
  'All New Honda Vario 160',
  'vario-160',
  'Skutik premium bertenaga besar 160cc 4 katup eSP+ dengan rangka eSAF yang presisi dan lincah.',
  'All New Honda Vario 160 hadir dengan desain bodi sporty premium berkelas, kapasitas mesin 160cc 4 katup berpendingin cairan eSP+, dan fitur modern seperti Honda Smart Key System dan USB Charger di console box.',
  160,
  'Otomatis, V-Matic',
  '{
    "Mesin": {
      "Tipe Mesin": "4-Langkah, 4-Katup, eSP+",
      "Sistem Suplai Bahan Bakar": "PGM-FI (Programmed Fuel Injection)",
      "Diameter x Langkah": "60 x 55,5 mm",
      "Daya Maksimum": "11,3 kW (15,4 PS) / 8.500 rpm",
      "Torsi Maksimum": "13,8 Nm / 7.000 rpm"
    },
    "Rangka & Kaki-kaki": {
      "Tipe Rangka": "Underbone - eSAF",
      "Ukuran Ban Depan": "100/80 - 14M/C Tubeless",
      "Ukuran Ban Belakang": "120/70 - 14M/C Tubeless",
      "Rem Depan": "Cakram Hidrolik",
      "Rem Belakang": "Tromol (CBS) / Cakram (ABS)"
    },
    "Kapasitas & Dimensi": {
      "Kapasitas Tangki": "5,5 liter",
      "Kapasitas Bagasi": "18 liter",
      "Tinggi Tempat Duduk": "778 mm",
      "Berat Kosong": "115 kg (CBS) / 117 kg (ABS)"
    }
  }'::jsonb,
  true,
  false,
  'published',
  'All New Honda Vario 160 — Harga OTR & Spesifikasi Sidoarjo',
  'Informasi lengkap harga OTR, spesifikasi mesin 160cc eSP+, pilihan warna, dan varian tipe All New Honda Vario 160 di dealer Honda Satrya Dealer Group.',
  '2026-01-01T00:00:00Z'
) on conflict (id) do nothing;

-- Model 2: Honda BeAT (Published)
insert into public.motorcycle_models (
  id, category_id, name, slug, short_description, description, engine_cc, transmission,
  key_specs, is_featured, is_new, status, seo_title, seo_description, published_at
) values (
  '33333333-3333-4333-c333-333333333302',
  '11111111-1111-4111-a111-111111111101',
  'All New Honda BeAT',
  'beat',
  'Skutik favorit paling irit dan lincah untuk menemani aktivitas harian generasi muda.',
  'Honda BeAT hadir dengan desain compact yang sporty, konsumsi bahan bakar sangat irit hingga 60,6 km/liter, lampu depan LED modern, dan secure key shutter dengan seat opener.',
  110,
  'Otomatis, V-Matic',
  '{
    "Mesin": {
      "Tipe Mesin": "4-Langkah, SOHC, eSP",
      "Daya Maksimum": "6,6 kW (9,0 PS) / 7.500 rpm",
      "Torsi Maksimum": "9,2 Nm / 6.000 rpm"
    },
    "Kapasitas & Dimensi": {
      "Kapasitas Tangki": "4,2 liter",
      "Berat Kosong": "87 kg"
    }
  }'::jsonb,
  false,
  true,
  'published',
  'All New Honda BeAT — Harga OTR & Spesifikasi',
  'Spesifikasi dan harga OTR All New Honda BeAT di Honda Satrya Dealer Group.',
  '2026-01-01T00:00:00Z'
) on conflict (id) do nothing;

-- Model 3: Honda CB150R Streetfire (Sport, Published)
insert into public.motorcycle_models (
  id, category_id, name, slug, short_description, description, engine_cc, transmission,
  key_specs, is_featured, is_new, status, seo_title, seo_description, published_at
) values (
  '33333333-3333-4333-c333-333333333303',
  '11111111-1111-4111-a111-111111111103',
  'Honda CB150R Streetfire',
  'cb150r-streetfire',
  'Naked sport bertenaga 150cc DOHC 6 kecepatan dengan suspensi Inverted Front Fork gagah.',
  'Motor sport telanjang dengan sensasi berkendara agresif, suspensi upside down keemasan, full digital speedometer, dan ban tapak lebar untuk stabilitas bermanuver di jalan raya.',
  150,
  'Manual 6-Kecepatan',
  '{
    "Mesin": {
      "Tipe Mesin": "4-Langkah, DOHC, 4 Katup",
      "Daya Maksimum": "12,4 kW (16,9 PS) / 9.000 rpm",
      "Torsi Maksimum": "13,8 Nm / 7.000 rpm"
    },
    "Rangka & Kaki-kaki": {
      "Suspensi Depan": "Inverted Front Fork (USD)",
      "Rem Depan": "Wavy Disc Brake Hidrolik"
    }
  }'::jsonb,
  true,
  false,
  'published',
  'Honda CB150R Streetfire — Harga OTR & Spesifikasi',
  'Spesifikasi lengkap dan harga OTR Honda CB150R Streetfire di Honda Satrya Dealer Group.',
  '2026-01-01T00:00:00Z'
) on conflict (id) do nothing;

-- Model 4: Honda EM1 e: (EV, Published, New)
insert into public.motorcycle_models (
  id, category_id, name, slug, short_description, description, engine_cc, transmission,
  key_specs, is_featured, is_new, status, seo_title, seo_description, published_at
) values (
  '33333333-3333-4333-c333-333333333304',
  '11111111-1111-4111-a111-111111111104',
  'Honda EM1 e:',
  'em1-e',
  'Sepeda motor listrik pertama Honda di Indonesia dengan sistem baterai tukar Honda Mobile Power Pack e:.',
  'Honda EM1 e: menghadirkan sensasi berkendara ramah lingkungan berkelas dengan motor penggerak bertenaga halus, baterai swap berkualitas tinggi terstandarisasi, dan desain kompak futuristis.',
  null,
  'Otomatis / Direct Drive',
  '{
    "Motor Penggerak": {
      "Tipe Motor": "In-wheel Brushless Motor",
      "Daya Maksimum": "1,7 kW / 540 rpm",
      "Kecepatan Maksimum": "45 km/jam"
    },
    "Baterai": {
      "Tipe Baterai": "Lithium-ion (Honda Mobile Power Pack e:)",
      "Kapasitas Baterai": "50,26 V / 29,4 Ah (1.494 Wh)",
      "Jarak Tempuh": "41,1 km (WMTC Mode)"
    }
  }'::jsonb,
  true,
  true,
  'published',
  'Honda EM1 e: — Motor Listrik Resmi Honda',
  'Harga OTR dan spesifikasi lengkap motor listrik Honda EM1 e: di Honda Satrya Dealer Group.',
  '2026-01-01T00:00:00Z'
) on conflict (id) do nothing;

-- 4. Motorcycle Variants
-- Vario 160 Variants: CBS and ABS
insert into public.motorcycle_variants (id, model_id, name, code, description, sort_order, status)
values
  ('44444444-4444-4444-d444-444444444401', '33333333-3333-4333-c333-333333333301', 'CBS', 'VARIO-CBS', 'Tipe Combi Brake System dengan pengereman seimbang.', 1, 'active'),
  ('44444444-4444-4444-d444-444444444402', '33333333-3333-4333-c333-333333333301', 'ABS', 'VARIO-ABS', 'Tipe Anti-lock Braking System dengan rem cakram depan dan belakang.', 2, 'active'),

-- BeAT Variants: CBS and Deluxe
  ('44444444-4444-4444-d444-444444444403', '33333333-3333-4333-c333-333333333302', 'CBS', 'BEAT-CBS', 'Tipe standar Combi Brake System.', 1, 'active'),
  ('44444444-4444-4444-d444-444444444404', '33333333-3333-4333-c333-333333333302', 'Deluxe', 'BEAT-DLX', 'Tipe mewah dengan emblem 3D chrome dan ISS.', 2, 'active'),

-- CB150R Variant: Standard
  ('44444444-4444-4444-d444-444444444405', '33333333-3333-4333-c333-333333333303', 'Special Edition', 'CB150R-SE', 'Warna matte agresif dan velg burlywood.', 1, 'active'),

-- EM1 e: Variant: Standard
  ('44444444-4444-4444-d444-444444444406', '33333333-3333-4333-c333-333333333304', 'Standard', 'EM1-STD', 'Varian standar termasuk 1 unit baterai MPP e:.', 1, 'active')
on conflict (id) do nothing;

-- 5. Variant Colors
insert into public.variant_colors (id, variant_id, color_id, is_available, sort_order)
values
  ('55555555-5555-4555-e555-555555555501', '44444444-4444-4444-d444-444444444401', '22222222-2222-4222-b222-222222222201', true, 1),
  ('55555555-5555-4555-e555-555555555502', '44444444-4444-4444-d444-444444444401', '22222222-2222-4222-b222-222222222202', true, 2),
  ('55555555-5555-4555-e555-555555555503', '44444444-4444-4444-d444-444444444402', '22222222-2222-4222-b222-222222222201', true, 1),
  ('55555555-5555-4555-e555-555555555504', '44444444-4444-4444-d444-444444444402', '22222222-2222-4222-b222-222222222203', true, 2),
  ('55555555-5555-4555-e555-555555555505', '44444444-4444-4444-d444-444444444403', '22222222-2222-4222-b222-222222222204', true, 1),
  ('55555555-5555-4555-e555-555555555506', '44444444-4444-4444-d444-444444444404', '22222222-2222-4222-b222-222222222205', true, 1),
  ('55555555-5555-4555-e555-555555555507', '44444444-4444-4444-d444-444444444405', '22222222-2222-4222-b222-222222222206', true, 1),
  ('55555555-5555-4555-e555-555555555508', '44444444-4444-4444-d444-444444444406', '22222222-2222-4222-b222-222222222207', true, 1)
on conflict (id) do nothing;

-- 6. Model Images
insert into public.model_images (id, model_id, storage_path, alt_text, image_role, sort_order)
values
  ('66666666-6666-4666-f666-666666666601', '33333333-3333-4333-c333-333333333301', '/images/motorcycle-placeholder.svg', 'All New Honda Vario 160 Tampak Depan', 'card', 1),
  ('66666666-6666-4666-f666-666666666602', '33333333-3333-4333-c333-333333333301', '/images/motorcycle-placeholder.svg', 'All New Honda Vario 160 Tampak Samping', 'gallery', 2),
  ('66666666-6666-4666-f666-666666666603', '33333333-3333-4333-c333-333333333302', '/images/motorcycle-placeholder.svg', 'All New Honda BeAT Tampak Samping', 'card', 1),
  ('66666666-6666-4666-f666-666666666604', '33333333-3333-4333-c333-333333333303', '/images/motorcycle-placeholder.svg', 'Honda CB150R Streetfire Gagah', 'card', 1),
  ('66666666-6666-4666-f666-666666666605', '33333333-3333-4333-c333-333333333304', '/images/motorcycle-placeholder.svg', 'Honda EM1 e: Ramah Lingkungan', 'card', 1)
on conflict (id) do nothing;

-- 7. Illustrative Local Development Prices — Unverified (Sample data only; not verified against official dealer rate card)
insert into public.price_entries (
  id, variant_id, city, price_type, amount_idr, valid_from, valid_until, is_published, source_note
) values
  ('77777777-7777-4777-8777-777777777701', '44444444-4444-4444-d444-444444444401', 'Sidoarjo', 'otr', 27350000, '2026-01-01', null, false, 'Contoh data OTR pengembangan lokal (belum diverifikasi terhadap rate card resmi dealer)'),
  ('77777777-7777-4777-8777-777777777702', '44444444-4444-4444-d444-444444444402', 'Sidoarjo', 'otr', 30050000, '2026-01-01', null, false, 'Contoh data OTR pengembangan lokal (belum diverifikasi terhadap rate card resmi dealer)'),
  ('77777777-7777-4777-8777-777777777703', '44444444-4444-4444-d444-444444444403', 'Sidoarjo', 'otr', 18450000, '2026-01-01', null, false, 'Contoh data OTR pengembangan lokal (belum diverifikasi terhadap rate card resmi dealer)'),
  ('77777777-7777-4777-8777-777777777704', '44444444-4444-4444-d444-444444444404', 'Sidoarjo', 'otr', 19300000, '2026-01-01', null, false, 'Contoh data OTR pengembangan lokal (belum diverifikasi terhadap rate card resmi dealer)'),
  ('77777777-7777-4777-8777-777777777705', '44444444-4444-4444-d444-444444444405', 'Sidoarjo', 'otr', 31250000, '2026-01-01', null, false, 'Contoh data OTR pengembangan lokal (belum diverifikasi terhadap rate card resmi dealer)'),
  ('77777777-7777-4777-8777-777777777706', '44444444-4444-4444-d444-444444444406', 'Sidoarjo', 'otr', 40000000, '2026-01-01', null, false, 'Contoh data OTR pengembangan lokal (belum diverifikasi terhadap rate card resmi dealer)')
on conflict (id) do nothing;

