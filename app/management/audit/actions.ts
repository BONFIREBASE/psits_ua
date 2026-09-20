'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { uploadToR2, deleteFromR2 } from '@/lib/r2';

export async function createAuditReportAction(formData: FormData) {
  try {
    const title = (formData.get('title') as string)?.trim();
    const academicYear = (formData.get('academicYear') as string)?.trim() || '2026–2027';
    const semester = (formData.get('semester') as string)?.trim() || '1st Semester';
    const summary = (formData.get('summary') as string)?.trim() || '';
    const status = (formData.get('status') as string)?.trim() || 'Draft';
    const file = formData.get('file') as File | null;

    if (!title) {
      return { success: false, error: 'Audit title is required.' };
    }

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (file && file.size > 0) {
      fileName = file.name;
      const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const r2Key = `audit/${Date.now()}-${sanitized}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const r2Upload = await uploadToR2({
        key: r2Key,
        body: buffer,
        contentType: file.type || 'application/octet-stream',
      });
      fileUrl = r2Upload.url;
    }

    const { data, error } = await supabaseAdmin
      .from('audit_reports')
      .insert({
        title,
        academic_year: academicYear,
        semester,
        summary,
        status,
        file_url: fileUrl,
        file_name: fileName,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/management/audit');
    revalidatePath('/management/dashboard');
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save audit report' };
  }
}

export async function deleteAuditReportAction(id: string, fileUrl?: string | null) {
  try {
    if (fileUrl && fileUrl.includes('.r2.dev')) {
      const parsed = new URL(fileUrl);
      const r2Key = parsed.pathname.replace(/^\//, '');
      if (r2Key) {
        try {
          await deleteFromR2(r2Key);
        } catch {}
      }
    }

    const { error } = await supabaseAdmin.from('audit_reports').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    revalidatePath('/management/audit');
    revalidatePath('/management/dashboard');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete audit report' };
  }
}
