import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/admin';
import { getAdminLeads } from '@/lib/admin/queries';
import { generateInquiryExcelWorkbook } from '@/lib/inquiries/export';

export async function GET(request: NextRequest) {
  try {
    // 1. Authorization Guard
    const adminSession = await getAuthenticatedAdmin();
    if (!adminSession) {
      return NextResponse.json(
        { error: 'Akses tidak diizinkan. Hanya administrator yang dapat mengunduh data inquiry.' },
        { status: 401 }
      );
    }

    // 2. Parse search & filter query params
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const city = searchParams.get('city') || undefined;

    // 3. Fetch matched inquiry records
    const leads = await getAdminLeads({
      search,
      status,
      city,
    });

    // 4. Generate genuine Excel (.xlsx) file
    const buffer = await generateInquiryExcelWorkbook(leads);

    const nowIsoDate = new Date().toISOString().split('T')[0];
    const filename = `inquiry-honda-satrya-${nowIsoDate}.xlsx`;

    // 5. Return binary spreadsheet response
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('Failed to export inquiries to Excel:', err);
    return NextResponse.json({ error: 'Gagal membuat file export Excel.' }, { status: 500 });
  }
}
