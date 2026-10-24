/**
 * Centralized Indonesian Copy Dictionary
 *
 * Rules:
 * - All customer-facing text and UI labels MUST be in natural Bahasa Indonesia.
 * - Code identifiers, TypeScript types, and exported object keys MUST be in English.
 */

export const dealershipCopy = {
  dealer: {
    name: 'Honda Mega Persada Mandiri',
    tagline: 'Dealer Resmi Sepeda Motor Honda',
    officialBadge: 'Dealer Resmi Honda',
    addressPlaceholder: 'Jl. Raya Sidoarjo No. 123, Sidoarjo, Jawa Timur',
    operatingHours: 'Senin - Sabtu: 08:00 - 17:00 WIB | Minggu: 09:00 - 15:00 WIB',
    phone: '(031) 894-1234',
    email: 'info@megapersada.co.id',
  },
  nav: {
    home: 'Beranda',
    motorcycles: 'Sepeda Motor',
    priceList: 'Daftar Harga',
    promotions: 'Promo',
    aboutContact: 'Tentang & Kontak',
    adminLogin: 'Portal Staf',
  },
  hero: {
    headline: 'Digital Showroom Honda Mega Persada Mandiri',
    subheadline:
      'Temukan sepeda motor Honda impian Anda dengan harga OTR lokal terverifikasi, promo resmi dealer, dan layanan konsultasi pembelian terpercaya.',
    primaryCta: 'Lihat Daftar Motor',
    secondaryCta: 'Hubungi Sales',
  },
  catalog: {
    title: 'Katalog Sepeda Motor Honda',
    subtitle: 'Pilih lini motor Honda terbaik sesuai kebutuhan mobilitas Anda.',
    categories: {
      all: 'Semua Kategori',
      matic: 'Matic',
      cub: 'Cub / Bebek',
      sport: 'Sport',
      ev: 'Kendaraan Listrik (EV)',
    },
    filterPlaceholder: 'Cari tipe atau nama motor...',
    startingFrom: 'Mulai dari',
    viewDetails: 'Lihat Detail',
    specifications: 'Spesifikasi Utama',
    availableColors: 'Pilihan Warna',
    noPriceAvailable: 'Hubungi dealer untuk konfirmasi harga terbaru.',
  },
  pricing: {
    title: 'Daftar Harga OTR',
    disclaimer:
      'Harga OTR (On The Road) yang tercantum merupakan estimasi wilayah dealer dan dapat berubah sewaktu-waktu. Silakan konfirmasi ketersediaan unit dan rincian harga dengan tim sales kami.',
  },
  inquiry: {
    title: 'Konsultasi Pembelian',
    subtitle: 'Kirimkan pertanyaan atau jadwalkan janji temu dengan tim konsultan kami.',
    fullNameLabel: 'Nama Lengkap',
    fullNamePlaceholder: 'Masukkan nama lengkap sesuai KTP',
    whatsappLabel: 'Nomor WhatsApp',
    whatsappPlaceholder: 'Contoh: 081234567890',
    emailLabel: 'Email (Opsional)',
    emailPlaceholder: 'nama@domain.com',
    cityLabel: 'Kota / Kabupaten Domisili',
    cityPlaceholder: 'Contoh: Sidoarjo',
    modelLabel: 'Model Motor Pilihan',
    variantLabel: 'Varian / Tipe',
    colorLabel: 'Warna Pilihan',
    messageLabel: 'Pesan Tambahan (Opsional)',
    messagePlaceholder: 'Tuliskan pertanyaan spesifik Anda di sini...',
    privacyConsent:
      'Saya menyetujui bahwa data kontak yang saya berikan akan digunakan oleh tim Honda Mega Persada Mandiri untuk menghubungi saya terkait informasi pembelian motor.',
    submitButton: 'Kirim Pertanyaan',
    submittingButton: 'Mengirim...',
    successTitle: 'Pertanyaan Anda Berhasil Terkirim',
    successMessage:
      'Terima kasih telah menghubungi kami. Tim sales kami akan segera merespons melalui WhatsApp.',
    referencePrefix: 'No. Referensi',
    whatsappHandoffCta: 'Lanjutkan Obrolan via WhatsApp',
  },
  status: {
    active: 'Aktif',
    draft: 'Draf',
    archived: 'Diarsipkan',
    featured: 'Unggulan',
    newModel: 'Model Baru',
  },
  common: {
    currencySymbol: 'Rp',
    contactSales: 'Hubungi Sales',
    back: 'Kembali',
    close: 'Tutup',
    save: 'Simpan',
    cancel: 'Batal',
    loading: 'Memuat data...',
    notFound: 'Halaman tidak ditemukan',
    serverError: 'Terjadi kendala pada sistem. Silakan coba kembali beberapa saat lagi.',
  },
} as const;

export type DealershipCopy = typeof dealershipCopy;
