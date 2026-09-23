'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { uploadToR2, deleteFromR2 } from '@/lib/r2';

export async function createDocument(formData: FormData) {
  try {
    const category = formData.get('category') as string;
    const referenceNo = (formData.get('referenceNo') as string)?.trim();
    const title = (formData.get('title') as string)?.trim();
    const date = (formData.get('date') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();
    const status = (formData.get('status') as string)?.trim() || 'Draft';
    const file = formData.get('file') as File | null;

    if (!referenceNo || !title || !date) {
      return { success: false, error: 'Reference No, title, and date are required.' };
    }

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (file && file.size > 0) {
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
      const hasAllowedExt = allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
      if (!hasAllowedExt) {
        return { success: false, error: 'Only PDF, DOCX, DOC, PNG, and JPG files are supported.' };
      }

      fileName = file.name;
      const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const r2Key = `documents/${Date.now()}-${sanitized}`;
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
      .from('documents')
      .insert({
        category,
        reference_no: referenceNo,
        title,
        date,
        description,
        status,
        file_url: fileUrl,
        file_name: fileName,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/management/documents');
    revalidatePath('/management/dashboard');
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save document' };
  }
}

export async function updateDocument(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const category = formData.get('category') as string;
    const referenceNo = (formData.get('referenceNo') as string)?.trim();
    const title = (formData.get('title') as string)?.trim();
    const date = (formData.get('date') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();
    const status = (formData.get('status') as string)?.trim() || 'Draft';
    const file = formData.get('file') as File | null;

    if (!id || !referenceNo || !title || !date) {
      return { success: false, error: 'Document ID, Reference No, title, and date are required.' };
    }

    const updatePayload: Record<string, string | null> = {
      category,
      reference_no: referenceNo,
      title,
      date,
      description,
      status,
    };

    if (file && file.size > 0) {
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
      const hasAllowedExt = allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
      if (!hasAllowedExt) {
        return { success: false, error: 'Only PDF, DOCX, DOC, PNG, and JPG files are supported.' };
      }

      const fileName = file.name;
      const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const r2Key = `documents/${Date.now()}-${sanitized}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const r2Upload = await uploadToR2({
        key: r2Key,
        body: buffer,
        contentType: file.type || 'application/octet-stream',
      });
      updatePayload.file_url = r2Upload.url;
      updatePayload.file_name = fileName;
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/management/documents');
    revalidatePath('/management/dashboard');
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update document' };
  }
}

export async function deleteDocument(id: string, fileUrl?: string | null) {
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

    const { error } = await supabaseAdmin.from('documents').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    revalidatePath('/management/documents');
    revalidatePath('/management/dashboard');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete' };
  }
}
