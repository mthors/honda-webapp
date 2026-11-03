import React from 'react';
import { requireAdmin } from '@/lib/auth/admin';
import { getAdminLeads } from '@/lib/admin/queries';
import { AdminInquiryManagementView } from '@/components/admin/inquiries/AdminInquiryManagementView';

export const metadata = {
  title: 'Kelola Inquiry Prospek — Admin Honda Satrya Dealer Group',
  description: 'Pengelolaan daftar pesan dan konsultasi prospek sepeda motor Honda.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLeadsPage() {
  await requireAdmin();

  const leads = await getAdminLeads();

  return <AdminInquiryManagementView initialLeads={leads} />;
}
