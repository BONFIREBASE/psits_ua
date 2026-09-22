'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { uploadToR2, deleteFromR2 } from '@/lib/r2';
import { validateSessionAction } from '@/lib/session';
import { officers as initialOfficers, pubmatTeam as initialPubmat } from '@/data/officers';

const SUPER_ADMIN_EMAIL = 'psits-ua@antiquespride.edu.ph';

async function resolveRequester(formData: FormData): Promise<{ isAdmin: boolean; requesterEmail: string | null }> {
  const sessionToken = (formData.get('sessionToken') as string)?.trim();
  let role = (formData.get('requesterRole') as string)?.trim();
  let email = (formData.get('requesterEmail') as string)?.trim().toLowerCase() || null;

  if (sessionToken) {
    try {
      const sessionResult = await validateSessionAction(sessionToken);
      if (sessionResult.valid && sessionResult.user) {
        role = sessionResult.user.role;
        email = sessionResult.user.email.toLowerCase();
      }
    } catch {}
  }

  const isAdmin = role === 'admin' || email === SUPER_ADMIN_EMAIL;
  return { isAdmin, requesterEmail: email };
}

export async function createOfficerAction(formData: FormData) {
  try {
    const { isAdmin } = await resolveRequester(formData);
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized: Only Super Admin can add members.' };
    }

    const name = (formData.get('name') as string)?.trim();
    const position = (formData.get('position') as string)?.trim();
    const roleGroup = (formData.get('roleGroup') as string)?.trim() || 'Executive';
    const yearSection = (formData.get('yearSection') as string)?.trim() || 'BSIT';
    const quote = (formData.get('quote') as string)?.trim() || null;
    const email = (formData.get('email') as string)?.trim().toLowerCase() || null;
    const isPubmat = formData.get('isPubmat') === 'true';
    const pubmatRole = (formData.get('pubmatRole') as string)?.trim() || null;
    const photo = formData.get('photo') as File | null;

    if (!name || !position) {
      return { success: false, error: 'Name and position are required.' };
    }

    if (email && !email.endsWith('@antiquespride.edu.ph')) {
      return { success: false, error: 'Officer email must end with @antiquespride.edu.ph' };
    }

    let imageUrl: string | null = null;
    if (photo && photo.size > 0) {
      const sanitized = photo.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const r2Key = `officers/${Date.now()}-${sanitized}`;
      const arrayBuffer = await photo.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const r2Upload = await uploadToR2({
        key: r2Key,
        body: buffer,
        contentType: photo.type || 'application/octet-stream',
      });
      imageUrl = r2Upload.url;
    }

    const { data, error } = await supabaseAdmin
      .from('officers')
      .insert({
        name,
        position,
        role_group: roleGroup,
        year_section: yearSection,
        quote,
        email,
        image_url: imageUrl,
        is_pubmat: isPubmat,
        pubmat_role: pubmatRole,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/management/officers');
    revalidatePath('/officers');
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save officer' };
  }
}

export async function updateOfficerAction(id: string, formData: FormData) {
  try {
    const { isAdmin, requesterEmail } = await resolveRequester(formData);

    if (!id) {
      return { success: false, error: 'Officer ID is required.' };
    }

    // Retrieve existing record to verify ownership and lock sensitive fields
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('officers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return { success: false, error: 'Officer record not found.' };
    }

    if (!isAdmin) {
      // Non-admin officers can only edit their own profile
      const officerEmail = existing.email?.trim().toLowerCase();
      if (!requesterEmail || !officerEmail || requesterEmail !== officerEmail) {
        return {
          success: false,
          error: 'Unauthorized: You can only edit your own profile. Only Super Admin can edit other officers.',
        };
      }
    }

    const name = (formData.get('name') as string)?.trim();
    if (!name) {
      return { success: false, error: 'Name is required.' };
    }

    // Admins can change position, role group, email, and pubmat flag; officers have them locked to existing
    const position = isAdmin ? ((formData.get('position') as string)?.trim() || existing.position) : existing.position;
    const roleGroup = isAdmin ? ((formData.get('roleGroup') as string)?.trim() || existing.role_group) : existing.role_group;
    const isPubmat = isAdmin ? (formData.get('isPubmat') === 'true') : existing.is_pubmat;
    const pubmatRole = isAdmin ? ((formData.get('pubmatRole') as string)?.trim() || null) : existing.pubmat_role;
    const email = isAdmin ? ((formData.get('email') as string)?.trim().toLowerCase() || null) : existing.email;

    const yearSection = (formData.get('yearSection') as string)?.trim() || existing.year_section || 'BSIT';
    const quote = (formData.get('quote') as string)?.trim() || null;
    const photo = formData.get('photo') as File | null;
    const existingImageUrl = (formData.get('existingImageUrl') as string)?.trim() || (formData.get('existing_image_url') as string)?.trim() || null;

    if (email && !email.endsWith('@antiquespride.edu.ph')) {
      return { success: false, error: 'Officer email must end with @antiquespride.edu.ph' };
    }

    let imageUrl = existingImageUrl;
    if (photo && photo.size > 0) {
      const sanitized = photo.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const r2Key = `officers/${Date.now()}-${sanitized}`;
      const arrayBuffer = await photo.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const r2Upload = await uploadToR2({
        key: r2Key,
        body: buffer,
        contentType: photo.type || 'application/octet-stream',
      });
      imageUrl = r2Upload.url;

      if (existingImageUrl && existingImageUrl.includes('.r2.dev')) {
        try {
          const parsed = new URL(existingImageUrl);
          const oldKey = parsed.pathname.replace(/^\//, '');
          if (oldKey) await deleteFromR2(oldKey);
        } catch {}
      }
    }

    const { data, error } = await supabaseAdmin
      .from('officers')
      .update({
        name,
        position,
        role_group: roleGroup,
        year_section: yearSection,
        quote,
        email,
        image_url: imageUrl,
        is_pubmat: isPubmat,
        pubmat_role: pubmatRole,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/management/officers');
    revalidatePath('/officers');
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update officer' };
  }
}

export async function updateOfficerEmailAction(
  id: string,
  email: string,
  requesterRole?: string,
  sessionToken?: string,
  requesterEmail?: string
) {
  try {
    let effectiveRole = requesterRole?.trim();
    let effectiveEmail = requesterEmail?.trim().toLowerCase();

    if (sessionToken) {
      try {
        const sessionResult = await validateSessionAction(sessionToken);
        if (sessionResult.valid && sessionResult.user) {
          effectiveRole = sessionResult.user.role;
          effectiveEmail = sessionResult.user.email.toLowerCase();
        }
      } catch {}
    }

    const isAdmin = effectiveRole === 'admin' || effectiveEmail === SUPER_ADMIN_EMAIL;
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized: Only Super Admin can assign institutional SSO emails.' };
    }
    const trimmed = email.trim().toLowerCase();
    if (trimmed && !trimmed.endsWith('@antiquespride.edu.ph')) {
      return { success: false, error: 'Email must end with @antiquespride.edu.ph' };
    }

    const { error } = await supabaseAdmin
      .from('officers')
      .update({ email: trimmed || null })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/management/officers');
    revalidatePath('/officers');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update email' };
  }
}

export async function deleteOfficerAction(
  id: string,
  imageUrl?: string | null,
  requesterRole?: string,
  sessionToken?: string,
  requesterEmail?: string
) {
  try {
    let effectiveRole = requesterRole?.trim();
    let effectiveEmail = requesterEmail?.trim().toLowerCase();

    if (sessionToken) {
      try {
        const sessionResult = await validateSessionAction(sessionToken);
        if (sessionResult.valid && sessionResult.user) {
          effectiveRole = sessionResult.user.role;
          effectiveEmail = sessionResult.user.email.toLowerCase();
        }
      } catch {}
    }

    const isAdmin = effectiveRole === 'admin' || effectiveEmail === SUPER_ADMIN_EMAIL;
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized: Only Super Admin can delete officer records.' };
    }

    if (imageUrl && imageUrl.includes('.r2.dev')) {
      const parsed = new URL(imageUrl);
      const r2Key = parsed.pathname.replace(/^\//, '');
      if (r2Key) {
        try {
          await deleteFromR2(r2Key);
        } catch {}
      }
    }

    const { error } = await supabaseAdmin.from('officers').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    revalidatePath('/management/officers');
    revalidatePath('/officers');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete officer' };
  }
}

export async function seedOfficersAction() {
  try {
    const { data: existing } = await supabaseAdmin.from('officers').select('name, is_pubmat');
    const existingNames = new Set((existing || []).map((o) => o.name.toLowerCase()));

    const officerRows = initialOfficers
      .filter((o) => !existingNames.has(o.name.toLowerCase()))
      .map((o) => ({
        name: o.name,
        position: o.position,
        role_group: o.roleGroup,
        year_section: o.department,
        quote: null,
        image_url: o.image || null,
        is_pubmat: false,
        pubmat_role: null,
      }));

    const pubmatRows = initialPubmat
      .filter((p) => !existingNames.has(p.name.toLowerCase()))
      .map((p) => ({
        name: p.name,
        position: p.role,
        role_group: 'Operations & PR',
        year_section: 'Pubmat Creative Team',
        quote: null,
        image_url: p.image || null,
        is_pubmat: true,
        pubmat_role: p.role,
      }));

    const allRows = [...officerRows, ...pubmatRows];
    if (allRows.length === 0) return { success: true, count: 0 };

    const { error } = await supabaseAdmin.from('officers').insert(allRows);
    if (error) return { success: false, error: error.message };

    revalidatePath('/management/officers');
    revalidatePath('/officers');
    return { success: true, count: allRows.length };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to seed officers' };
  }
}
