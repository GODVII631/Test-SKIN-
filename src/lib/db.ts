import { supabase } from './supabase';
import { SkinSubmission, DiscordUser, DiscordNotificationSettings, BotLog } from '../types';

export const DEFAULT_NOTIFICATION_SETTINGS: DiscordNotificationSettings = {
  enabled: true,
  webhookUrl: '',
  notifyOnSubmission: true,
  notifyOnStatusChange: true,
  soundEnabled: true,
};

const WEBHOOK_RE = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FILE = 50 * 1024 * 1024;

/* ---------- mappers ---------- */
function mapProfile(r: any, webhookUrl = ''): DiscordUser {
  return {
    id: r.id,
    discordId: r.discord_id,
    username: r.username,
    globalName: r.global_name ?? r.username,
    avatar: r.avatar ?? '',
    role: r.role,
    icName: r.ic_name ?? '',
    skinQuota: r.skin_quota,
    submittedSkinsCount: r.submitted_count,
    isBlocked: r.is_blocked,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    notificationSettings: {
      enabled: r.notification_enabled,
      webhookUrl,
      notifyOnSubmission: r.notify_on_submission,
      notifyOnStatusChange: r.notify_on_status_change,
      soundEnabled: r.sound_enabled,
    },
  };
}

function mapSubmission(r: any): SkinSubmission {
  const p = r.profiles ?? {};
  return {
    id: r.id,
    discordUserId: r.user_id,
    discordUsername: p.username ?? '',
    discordAvatar: p.avatar ?? '',
    discordId: p.discord_id ?? '',
    icName: r.ic_name,
    skinTitle: r.skin_title,
    description: r.description ?? '',
    addonFileName: r.file_name,
    fileSize: Number(r.file_size),
    filePath: r.file_path,
    status: r.status,
    adminNote: r.admin_note ?? undefined,
    reviewedBy: r.reviewed_by ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapLog(r: any): BotLog {
  return {
    id: r.id,
    submissionId: r.submission_id ?? undefined,
    userId: r.user_id ?? '',
    username: r.username ?? '',
    event: r.event,
    status: r.status,
    channel: r.channel ?? undefined,
    errorMessage: r.error_message ?? undefined,
    timestamp: r.created_at,
  };
}

const SUB_SELECT = '*, profiles(username, avatar, discord_id)';

/* ---------- auth ---------- */
export async function signInWithDiscord() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo: window.location.origin, scopes: 'identify' },
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function fetchMyProfile(userId: string): Promise<DiscordUser | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: hook } = await supabase.from('user_webhooks').select('webhook_url').eq('user_id', userId).maybeSingle();
  return mapProfile(data, hook?.webhook_url ?? '');
}

/* ---------- realtime helper: refetch on any change ---------- */
function subscribeTable(table: string, refetch: () => Promise<void>) {
  refetch().catch((e) => console.warn(`${table} fetch error:`, e));
  const channel = supabase
    .channel(`rt:${table}:${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      refetch().catch((e) => console.warn(`${table} refetch error:`, e));
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToSubmissions(currentUser: DiscordUser, onUpdate: (s: SkinSubmission[]) => void) {
  // RLS already limits members to their own rows; the filter is just for clarity
  return subscribeTable('skin_submissions', async () => {
    let q = supabase.from('skin_submissions').select(SUB_SELECT).order('created_at', { ascending: false }).limit(150);
    if (currentUser.role !== 'admin') q = q.eq('user_id', currentUser.id);
    const { data, error } = await q;
    if (error) throw error;
    onUpdate((data ?? []).map(mapSubmission));
  });
}

export function subscribeToUser(userId: string, onUpdate: (u: DiscordUser | null) => void) {
  return subscribeTable('profiles', async () => onUpdate(await fetchMyProfile(userId)));
}

export function subscribeToAllUsers(onUpdate: (u: DiscordUser[]) => void) {
  return subscribeTable('profiles', async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    onUpdate((data ?? []).map((r) => mapProfile(r)));
  });
}

export function subscribeToBotLogs(onUpdate: (l: BotLog[]) => void) {
  return subscribeTable('bot_logs', async () => {
    const { data, error } = await supabase.from('bot_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) return onUpdate([]); // non-admins are denied by RLS
    onUpdate((data ?? []).map(mapLog));
  });
}

/* ---------- files ---------- */
async function uploadAddon(userId: string, fileName: string, dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob();
  if (blob.size > MAX_FILE) throw new Error('ไฟล์ใหญ่เกิน 50 MB');
  const safe = fileName.replace(/[^\w.\-]/g, '_');
  const path = `${userId}/${crypto.randomUUID()}_${safe}`;
  const { error } = await supabase.storage.from('addons').upload(path, blob, { upsert: false });
  if (error) throw error;
  return { path, size: blob.size };
}

export async function getAddonDownloadUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('addons').createSignedUrl(filePath, 60);
  if (error || !data) throw error ?? new Error('สร้างลิงก์ดาวน์โหลดไม่สำเร็จ');
  return data.signedUrl;
}

/* ---------- submissions ---------- */
export async function createSkinSubmissionInFirestore(
  submission: Omit<SkinSubmission, 'id' | 'createdAt' | 'status'>,
  currentUser: DiscordUser
): Promise<SkinSubmission> {
  if (!submission.fileData) throw new Error('ไม่พบไฟล์');
  const up = await uploadAddon(currentUser.id, submission.addonFileName, submission.fileData);
  const { data, error } = await supabase
    .from('skin_submissions')
    .insert({
      user_id: currentUser.id,
      ic_name: submission.icName,
      skin_title: submission.skinTitle,
      description: submission.description ?? '',
      file_name: submission.addonFileName,
      file_size: up.size,
      file_path: up.path,
    })
    .select(SUB_SELECT)
    .single();
  if (error) {
    await supabase.storage.from('addons').remove([up.path]); // roll back orphan upload
    throw new Error(error.message); // quota/blocked errors raised by DB trigger
  }
  await supabase.from('profiles').update({ ic_name: submission.icName }).eq('id', currentUser.id);
  return mapSubmission(data);
}

export async function updateSkinSubmissionStatus(
  submissionId: string,
  status: 'approved' | 'rejected' | 'pending',
  adminNote: string,
  adminUsername: string
): Promise<void> {
  const { error } = await supabase
    .from('skin_submissions')
    .update({ status, admin_note: adminNote.trim(), reviewed_by: adminUsername })
    .eq('id', submissionId);
  if (error) throw new Error(error.message);
}

export async function updateSkinSubmissionInFirestore(
  submissionId: string,
  f: { icName?: string; skinTitle?: string; description?: string; addonFileName?: string; fileSize?: number; fileData?: string },
  currentUser: DiscordUser
): Promise<SkinSubmission> {
  const patch: Record<string, any> = {};
  if (f.icName !== undefined) patch.ic_name = f.icName;
  if (f.skinTitle !== undefined) patch.skin_title = f.skinTitle;
  if (f.description !== undefined) patch.description = f.description;

  let oldPath: string | null = null;
  if (f.fileData && f.addonFileName) {
    const { data: cur } = await supabase.from('skin_submissions').select('file_path, user_id').eq('id', submissionId).single();
    oldPath = cur?.file_path ?? null;
    const up = await uploadAddon(cur?.user_id ?? currentUser.id, f.addonFileName, f.fileData);
    patch.file_name = f.addonFileName; patch.file_size = up.size; patch.file_path = up.path;
  }
  const { data, error } = await supabase.from('skin_submissions').update(patch).eq('id', submissionId).select(SUB_SELECT).single();
  if (error) throw new Error(error.message);
  if (oldPath) await supabase.storage.from('addons').remove([oldPath]);
  if (f.icName?.trim()) await supabase.from('profiles').update({ ic_name: f.icName.trim() }).eq('id', currentUser.id);
  return mapSubmission(data);
}

export async function deleteSkinSubmissionFromFirestore(submissionId: string, _u: DiscordUser): Promise<void> {
  const { data } = await supabase.from('skin_submissions').select('file_path').eq('id', submissionId).maybeSingle();
  const { error } = await supabase.from('skin_submissions').delete().eq('id', submissionId);
  if (error) throw new Error(error.message);
  if (data?.file_path) await supabase.storage.from('addons').remove([data.file_path]);
}

/* ---------- notification settings ---------- */
export async function saveNotificationSettings(userId: string, s: Partial<DiscordNotificationSettings>) {
  const patch: Record<string, any> = {};
  if (s.enabled !== undefined) patch.notification_enabled = s.enabled;
  if (s.notifyOnSubmission !== undefined) patch.notify_on_submission = s.notifyOnSubmission;
  if (s.notifyOnStatusChange !== undefined) patch.notify_on_status_change = s.notifyOnStatusChange;
  if (s.soundEnabled !== undefined) patch.sound_enabled = s.soundEnabled;
  if (Object.keys(patch).length) {
    const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
    if (error) throw new Error(error.message);
  }
  if (s.webhookUrl !== undefined) {
    const url = s.webhookUrl.trim();
    if (!url) {
      await supabase.from('user_webhooks').delete().eq('user_id', userId);
    } else {
      if (!WEBHOOK_RE.test(url)) throw new Error('รูปแบบ Discord Webhook URL ไม่ถูกต้อง');
      const { error } = await supabase.from('user_webhooks').upsert({ user_id: userId, webhook_url: url });
      if (error) throw new Error(error.message);
    }
  }
}

/* ---------- bot logs ---------- */
export async function logBotEvent(log: Omit<BotLog, 'id'>): Promise<void> {
  const { error } = await supabase.from('bot_logs').insert({
    submission_id: log.submissionId && UUID_RE.test(log.submissionId) ? log.submissionId : null,
    user_id: log.userId,
    username: log.username,
    event: log.event.slice(0, 300),
    status: log.status,
    channel: log.channel ?? null,
    error_message: log.errorMessage ?? null,
  });
  if (error) console.warn('logBotEvent:', error.message);
}

/* ---------- admin ---------- */
export async function updateUserSkinQuota(userId: string, newQuota: number, isBlocked = false): Promise<void> {
  const { error } = await supabase.from('profiles').update({ skin_quota: Math.max(0, newQuota), is_blocked: isBlocked }).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function resetUserSkinCount(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ submitted_count: 0 }).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'member'): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role: newRole, skin_quota: newRole === 'admin' ? 10 : 3 }).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function promoteUserToAdminByQuery(
  queryStr: string
): Promise<{ success: boolean; message: string; user?: DiscordUser }> {
  const q = queryStr.trim();
  if (!q) return { success: false, message: 'กรุณาระบุ Discord User ID' };
  // match by Discord ID only — usernames can change and be impersonated
  const { data } = await supabase.from('profiles').select('*').eq('discord_id', q).maybeSingle();
  if (!data) return { success: false, message: `ไม่พบ Discord ID "${q}" (ผู้ใช้ต้องล็อกอินอย่างน้อย 1 ครั้ง)` };
  try {
    await updateUserRole(data.id, 'admin');
    return { success: true, message: `แต่งตั้ง @${data.username} เป็น Admin แล้ว`, user: mapProfile({ ...data, role: 'admin' }) };
  } catch (e: any) {
    return { success: false, message: e?.message || 'แต่งตั้งไม่สำเร็จ' };
  }
}
