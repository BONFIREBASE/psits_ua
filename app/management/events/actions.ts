'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { calendarActivities } from '@/data/events';

export async function createEventAction(formData: FormData) {
  try {
    const title = (formData.get('title') as string)?.trim();
    const date = (formData.get('date') as string)?.trim();
    const time = (formData.get('time') as string)?.trim() || 'TBA';
    const location = (formData.get('location') as string)?.trim() || 'CCIS Building';
    const category = (formData.get('category') as string)?.trim() || 'Department';
    const description = (formData.get('description') as string)?.trim() || '';
    const status = (formData.get('status') as string)?.trim() || 'Upcoming';

    if (!title || !date) {
      return { success: false, error: 'Title and date are required.' };
    }

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert({
        title,
        date,
        time,
        location,
        category,
        description,
        status,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/management/events');
    revalidatePath('/events');
    revalidatePath('/management/dashboard');
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create event' };
  }
}

export async function updateEventAction(id: string, formData: FormData) {
  try {
    const title = (formData.get('title') as string)?.trim();
    const date = (formData.get('date') as string)?.trim();
    const time = (formData.get('time') as string)?.trim() || 'TBA';
    const location = (formData.get('location') as string)?.trim() || 'CCIS Building';
    const category = (formData.get('category') as string)?.trim() || 'Department';
    const description = (formData.get('description') as string)?.trim() || '';
    const status = (formData.get('status') as string)?.trim() || 'Upcoming';

    if (!id || !title || !date) {
      return { success: false, error: 'Event ID, title, and date are required.' };
    }

    const { data, error } = await supabaseAdmin
      .from('events')
      .update({
        title,
        date,
        time,
        location,
        category,
        description,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/management/events');
    revalidatePath('/events');
    revalidatePath('/management/dashboard');
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update event' };
  }
}

export async function deleteEventAction(id: string) {
  try {
    const { error } = await supabaseAdmin.from('events').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    revalidatePath('/management/events');
    revalidatePath('/events');
    revalidatePath('/management/dashboard');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete event' };
  }
}

export async function seedEventsAction() {
  try {
    const { count } = await supabaseAdmin.from('events').select('*', { count: 'exact', head: true });
    if (count && count > 0) return { success: true, count };

    const rows = calendarActivities.map((act) => ({
      title: act.activity,
      date: act.month,
      time: 'TBA',
      location: act.venue || 'CCIS Campus',
      category: act.category,
      description: act.involved,
      status: 'Upcoming',
    }));

    const { error } = await supabaseAdmin.from('events').insert(rows);
    if (error) return { success: false, error: error.message };

    revalidatePath('/management/events');
    return { success: true, count: rows.length };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to seed events' };
  }
}
