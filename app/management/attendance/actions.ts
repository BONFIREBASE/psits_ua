'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';

export async function createMeetingAction(data: {
  title: string;
  type: 'regular' | 'emergency';
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  createdBy: string;
}) {
  try {
    const { data: meeting, error } = await supabaseAdmin
      .from('attendance_meetings')
      .insert({
        title: data.title,
        type: data.type,
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        location: data.location,
        description: data.description,
        status: 'scheduled',
        created_by: data.createdBy,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/management/attendance');
    revalidatePath('/management/dashboard');
    return { success: true, data: meeting };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create meeting' };
  }
}

export async function recordAttendanceScanAction(data: {
  meetingId: string;
  officerName: string;
  position: string;
  qrToken: string;
  status?: 'present' | 'late' | 'absent';
  method?: 'qr' | 'manual';
}) {
  try {
    // Check for duplicate scan
    const { data: existing } = await supabaseAdmin
      .from('attendance_records')
      .select('id')
      .eq('meeting_id', data.meetingId)
      .eq('officer_name', data.officerName)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'Officer is already scanned for this meeting.' };
    }

    const { data: record, error } = await supabaseAdmin
      .from('attendance_records')
      .insert({
        meeting_id: data.meetingId,
        officer_name: data.officerName,
        position: data.position,
        qr_token: data.qrToken,
        status: data.status || 'present',
        method: data.method || 'qr',
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath('/management/attendance');
    return { success: true, data: record };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to record attendance' };
  }
}

export async function updateMeetingStatusAction(meetingId: string, status: string) {
  try {
    const { error } = await supabaseAdmin
      .from('attendance_meetings')
      .update({ status })
      .eq('id', meetingId);

    if (error) return { success: false, error: error.message };
    revalidatePath('/management/attendance');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update meeting status' };
  }
}

export async function deleteMeetingAction(meetingId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('attendance_meetings')
      .delete()
      .eq('id', meetingId);

    if (error) return { success: false, error: error.message };
    revalidatePath('/management/attendance');
    revalidatePath('/management/dashboard');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete meeting' };
  }
}
