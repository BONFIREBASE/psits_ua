'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { uploadToR2, deleteFromR2 } from '@/lib/r2';

export async function createTreasuryRecord(formData: FormData) {
  try {
    const title = (formData.get('title') as string)?.trim();
    const period = (formData.get('period') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || '';
    const status = (formData.get('status') as string)?.trim() || 'Draft';
    const amount = parseFloat((formData.get('amount') as string) || '0');
    const file = formData.get('file') as File | null;

    if (!title || !period) {
      return { success: false, error: 'Title and reporting period are required.' };
    }

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (file && file.size > 0) {
      fileName = file.name;
      const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const r2Key = `treasury/${Date.now()}-${sanitized}`;
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
      .from('treasury_records')
      .insert({
        title,
        period,
        description,
        status,
        amount: isNaN(amount) ? 0 : amount,
        file_url: fileUrl,
        file_name: fileName,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/management/treasury');
    revalidatePath('/management/dashboard');
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save record' };
  }
}

export async function deleteTreasuryRecord(id: string, fileUrl?: string | null) {
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

    const { error } = await supabaseAdmin.from('treasury_records').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    revalidatePath('/management/treasury');
    revalidatePath('/management/dashboard');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete' };
  }
}
