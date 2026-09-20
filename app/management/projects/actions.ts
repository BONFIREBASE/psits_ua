'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { uploadToR2, deleteFromR2 } from '@/lib/r2';
import { projectsData } from '@/data/projects';
import { verifyTurnstileToken } from '@/lib/turnstile';

/**
 * 1. Admin/Officer Direct Project Creation
 */
export async function createProjectAction(formData: FormData) {
  try {
    const title = (formData.get('title') as string)?.trim();
    const category = (formData.get('category') as string)?.trim() || 'Web App';
    const description = (formData.get('description') as string)?.trim() || '';
    const demoUrl = (formData.get('demoUrl') as string)?.trim() || null;
    const githubUrl = (formData.get('githubUrl') as string)?.trim() || null;
    const status = (formData.get('status') as string)?.trim() || 'Completed';
    const tagsRaw = (formData.get('tags') as string)?.trim() || '';
    const team = (formData.get('team') as string)?.trim() || 'PSITS-UA Student Developers';
    const thumbnail = formData.get('thumbnail') as File | null;

    if (!title) {
      return { success: false, error: 'Project title is required.' };
    }

    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    if (team && !tags.some((t) => t.toLowerCase().startsWith('by:'))) {
      tags.push(`By: ${team}`);
    }

    let imageUrl: string | null = null;
    if (thumbnail && thumbnail.size > 0) {
      const sanitized = thumbnail.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const r2Key = `projects/${Date.now()}-${sanitized}`;
      const arrayBuffer = await thumbnail.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const r2Upload = await uploadToR2({
        key: r2Key,
        body: buffer,
        contentType: thumbnail.type || 'application/octet-stream',
      });
      imageUrl = r2Upload.url;
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        title,
        category,
        description,
        tags,
        image_url: imageUrl,
        demo_url: demoUrl,
        github_url: githubUrl,
        status,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/management/projects');
    revalidatePath('/projects');
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save project' };
  }
}

/**
 * 2. Public Project Submission (Requires Management Approval)
 */
export async function submitPublicProjectAction(formData: FormData) {
  try {
    const title = (formData.get('title') as string)?.trim();
    const team = (formData.get('team') as string)?.trim() || 'Student Developer(s)';
    const category = (formData.get('category') as string)?.trim() || 'Capstone';
    const description = (formData.get('description') as string)?.trim() || '';
    const demoUrl = (formData.get('demoUrl') as string)?.trim() || null;
    const githubUrl = (formData.get('githubUrl') as string)?.trim() || null;
    const tagsRaw = (formData.get('tags') as string)?.trim() || '';
    const turnstileToken = formData.get('turnstileToken') as string | null;
    const thumbnail = formData.get('thumbnail') as File | null;

    if (!title) {
      return { success: false, error: 'Project title is required.' };
    }
    if (!description) {
      return { success: false, error: 'Project description is required.' };
    }

    // Bot protection challenge check
    if (turnstileToken) {
      const verifyResult = await verifyTurnstileToken(turnstileToken, {
        expectedAction: 'project-submit',
      });
      if (!verifyResult.success) {
        return { success: false, error: 'Bot challenge verification failed. Please try again.' };
      }
    }

    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    if (team) {
      tags.push(`By: ${team}`);
    }

    let imageUrl: string | null = null;
    if (thumbnail && thumbnail.size > 0) {
      // Validate file size (max 5MB)
      if (thumbnail.size > 5 * 1024 * 1024) {
        return { success: false, error: 'Project banner must be under 5MB.' };
      }

      const sanitized = thumbnail.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const r2Key = `projects/submissions/${Date.now()}-${sanitized}`;
      const arrayBuffer = await thumbnail.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const r2Upload = await uploadToR2({
        key: r2Key,
        body: buffer,
        contentType: thumbnail.type || 'application/octet-stream',
      });
      imageUrl = r2Upload.url;
    }

    // Insert with status = 'Pending'
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        title,
        category,
        description,
        tags,
        image_url: imageUrl,
        demo_url: demoUrl,
        github_url: githubUrl,
        status: 'Pending',
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/management/projects');
    return {
      success: true,
      message: 'Project submitted successfully! It is currently in review by the PSITS-UA management team and will appear on the public showcase once approved.',
      data,
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to submit project' };
  }
}

/**
 * 3. Management: Approve & Publish Project
 */
export async function approveProjectAction(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('projects')
      .update({ status: 'Active' })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/management/projects');
    revalidatePath('/projects');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to approve project' };
  }
}

/**
 * Management: Update Existing Project
 */
export async function updateProjectAction(id: string, formData: FormData) {
  try {
    const title = (formData.get('title') as string)?.trim();
    const category = (formData.get('category') as string)?.trim() || 'Capstone';
    const description = (formData.get('description') as string)?.trim() || '';
    const demoUrl = (formData.get('demoUrl') as string)?.trim() || (formData.get('demo_url') as string)?.trim() || null;
    const githubUrl = (formData.get('githubUrl') as string)?.trim() || (formData.get('github_url') as string)?.trim() || null;
    const status = (formData.get('status') as string)?.trim() || 'Active';
    const tagsRaw = (formData.get('tags') as string)?.trim() || '';
    const team = (formData.get('team') as string)?.trim() || 'PSITS-UA Student Developers';
    const existingImageUrl = (formData.get('existingImageUrl') as string)?.trim() || (formData.get('existing_image_url') as string)?.trim() || null;
    const thumbnail = formData.get('thumbnail') as File | null;

    if (!id || !title) {
      return { success: false, error: 'Project ID and title are required.' };
    }

    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    if (team && !tags.some((t) => t.toLowerCase().startsWith('by:'))) {
      tags.push(`By: ${team}`);
    }

    let imageUrl = existingImageUrl;
    if (thumbnail && thumbnail.size > 0) {
      const sanitized = thumbnail.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const r2Key = `projects/${Date.now()}-${sanitized}`;
      const arrayBuffer = await thumbnail.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const r2Upload = await uploadToR2({
        key: r2Key,
        body: buffer,
        contentType: thumbnail.type || 'application/octet-stream',
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
      .from('projects')
      .update({
        title,
        category,
        description,
        tags,
        image_url: imageUrl,
        demo_url: demoUrl,
        github_url: githubUrl,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/management/projects');
    revalidatePath('/projects');
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update project' };
  }
}

/**
 * 4. Management: Delete / Reject Project
 */
export async function deleteProjectAction(id: string, imageUrl?: string | null) {
  try {
    if (imageUrl && imageUrl.includes('.r2.dev')) {
      const parsed = new URL(imageUrl);
      const r2Key = parsed.pathname.replace(/^\//, '');
      if (r2Key) {
        try {
          await deleteFromR2(r2Key);
        } catch {}
      }
    }

    const { error } = await supabaseAdmin.from('projects').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    revalidatePath('/management/projects');
    revalidatePath('/projects');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete project' };
  }
}

/**
 * 5. Management: Seed Initial Mock Projects
 */
export async function seedProjectsAction() {
  try {
    const { count } = await supabaseAdmin.from('projects').select('*', { count: 'exact', head: true });
    if (count && count > 0) return { success: true, count };

    const rows = projectsData.map((p) => ({
      title: p.title,
      category: p.category,
      description: p.description,
      tags: [...p.tags, `By: ${p.team}`],
      image_url: p.imageUrl || null,
      demo_url: p.liveUrl || null,
      github_url: p.githubUrl || null,
      status: p.status,
    }));

    const { error } = await supabaseAdmin.from('projects').insert(rows);
    if (error) return { success: false, error: error.message };

    revalidatePath('/management/projects');
    revalidatePath('/projects');
    return { success: true, count: rows.length };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to seed projects' };
  }
}
