import {
  SkinSubmission,
  DiscordUser,
  DiscordWebhookPayload,
  DiscordEmbed,
} from '../types';
import { logBotEvent } from './db';
import { supabase } from './supabase';

export const DISCORD_COLORS = {
  BLURPLE: 0x5865f2,
  GREEN: 0x57f287,
  YELLOW: 0xfee75c,
  FUCHSIA: 0xeb459e,
  RED: 0xed4245,
  MINECRAFT_EMERALD: 0x2ecc71,
  MINECRAFT_GOLD: 0xf1c40f,
  DARK: 0x2b2d31,
};

// Play nice audio notification
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Ignore audio errors
  }
}

// Build Discord Embed for Minecraft .mcaddon skin submission
export function buildMinecraftSkinDiscordEmbed(
  sub: SkinSubmission,
  user: DiscordUser,
  eventType: 'new_submission' | 'status_change' | 'updated_submission' | 'test'
): DiscordWebhookPayload {
  let color = DISCORD_COLORS.MINECRAFT_EMERALD;
  let title = '📦 มีการส่งไฟล์ Addon สกิน Minecraft ใหม่ (.mcaddon)';

  if (eventType === 'updated_submission') {
    color = DISCORD_COLORS.BLURPLE;
    title = '🔄 มีการแก้ไขข้อมูล / อัปเดตไฟล์ Addon สกิน Minecraft (.mcaddon)';
  } else if (eventType === 'status_change') {
    if (sub.status === 'approved') {
      color = DISCORD_COLORS.GREEN;
      title = '✅ สกิน Minecraft Addon ได้รับการอนุมัติแล้ว!';
    } else if (sub.status === 'rejected') {
      color = DISCORD_COLORS.RED;
      title = '❌ สกิน Minecraft Addon ไม่ผ่านการอนุมัติ';
    } else {
      color = DISCORD_COLORS.YELLOW;
      title = '⏳ สกิน Minecraft Addon ถูกเปลี่ยนเป็นรอดำเนินการ';
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const kb = (bytes / 1024).toFixed(1);
    return `${kb} KB`;
  };

  const statusLabels: Record<string, string> = {
    pending: '⏳ รอดำเนินการตรวจสอบ (Pending Review)',
    approved: '✅ อนุมัติแล้ว (Approved)',
    rejected: '❌ ไม่อนุมัติ / ปฏิเสธ (Rejected)',
  };

  const embed: DiscordEmbed = {
    title,
    description: `**หัวข้อสกิน:** ${sub.skinTitle}\n${sub.description || 'ไม่มีคำอธิบายเพิ่มเติม'}`,
    color: color,
    fields: [
      {
        name: '👤 บัญชี Discord ผู้ส่ง',
        value: `<@${user.discordId || user.id}> (\`@${user.username}\`)`,
        inline: true,
      },
      {
        name: '🏷️ ชื่อ IC (Minecraft IGN)',
        value: `**${sub.icName}**`,
        inline: true,
      },
      {
        name: '📁 ชื่อไฟล์แอดออน (.mcaddon)',
        value: `\`${sub.addonFileName}\` (${formatFileSize(sub.fileSize)})`,
        inline: true,
      },
      {
        name: '📊 สถานะการตรวจสอบ',
        value: `${statusLabels[sub.status] || sub.status}`,
        inline: true,
      },
      {
        name: '🎯 โควตาสกินของบัญชีนี้',
        value: `**${user.submittedSkinsCount || 1} / ${user.skinQuota} สกิน**`,
        inline: true,
      },
      {
        name: '⚙️ ระบบหลังบ้าน',
        value: 'บันทึกลง Firebase Firestore เรียบร้อย',
        inline: true,
      },
    ],
    author: {
      name: `${user.globalName || user.username} (@${user.username})`,
      icon_url: user.avatar || 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
    },
    footer: {
      text: 'Minecraft Addon Skin System • Realtime Discord Bot Alert',
      icon_url: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
    },
    timestamp: new Date().toISOString(),
  };

  if (sub.adminNote) {
    embed.fields?.push({
      name: '📝 หมายเหตุจาก Admin',
      value: `*${sub.adminNote}* (โดย ${sub.reviewedBy || 'Admin'})`,
      inline: false,
    });
  }

  return {
    username: 'Minecraft Addon Notifier',
    avatar_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=100&auto=format&fit=crop&q=80',
    embeds: [embed],
  };
}

// Dispatches the notification to Discord Webhook
export async function dispatchDiscordNotification({
  webhookUrl,
  sub,
  user,
  eventType = 'new_submission',
  forceBypassFilter = false,
}: {
  webhookUrl?: string;
  sub: SkinSubmission;
  user: DiscordUser;
  eventType?: 'new_submission' | 'status_change' | 'updated_submission' | 'test';
  forceBypassFilter?: boolean;
}): Promise<{ success: boolean; status: 'sent' | 'skipped' | 'simulated' | 'failed'; message: string }> {
  const settings = user.notificationSettings;

  if (settings?.soundEnabled) {
    playNotificationSound();
  }

  const payload = buildMinecraftSkinDiscordEmbed(sub, user, eventType);
  const targetWebhook = (webhookUrl && webhookUrl.trim()) || (settings?.webhookUrl && settings.webhookUrl.trim());

  if (!targetWebhook) {
    await logBotEvent({
      submissionId: sub.id,
      userId: user.id,
      username: user.username,
      event: `${eventType}: สกิน ${sub.addonFileName} ของ IC [${sub.icName}]`,
      status: 'simulated',
      timestamp: new Date().toISOString(),
      channel: '#minecraft-skins-log (จำลองบนระบบ)',
    });
    return {
      success: true,
      status: 'simulated',
      message: 'บันทึกลงคอนโซลบอทเรียบร้อย (ยังไม่ได้ระบุ Discord Webhook URL ภายนอก)',
    };
  }

  try {
    // Webhook URL is read server-side from the caller's own row; it is never sent from the browser.
    const { data, error } = await supabase.functions.invoke('send-discord-webhook', { body: { payload } });
    if (!error && data?.success) {
      await logBotEvent({
        submissionId: sub.id,
        userId: user.id,
        username: user.username,
        event: `${eventType}: สกิน ${sub.addonFileName} ของ IC [${sub.icName}]`,
        status: 'sent',
        timestamp: new Date().toISOString(),
        channel: 'Discord Webhook Channel',
      });
      return { success: true, status: 'sent', message: 'ส่งการแจ้งเตือนสกินไปยัง Discord เรียบร้อยแล้ว!' };
    }
    const errMsg = data?.error || error?.message || 'Discord Webhook ส่งไม่สำเร็จ';
    await logBotEvent({
      submissionId: sub.id,
      userId: user.id,
      username: user.username,
      event: `${eventType}: สกิน ${sub.addonFileName}`,
      status: 'failed',
      errorMessage: errMsg,
      timestamp: new Date().toISOString(),
    });
    return { success: false, status: 'failed', message: `ส่งแจ้งเตือนไม่สำเร็จ: ${errMsg}` };
  } catch (err: any) {
    console.error('Failed to dispatch webhook:', err);
    await logBotEvent({
      submissionId: sub.id,
      userId: user.id,
      username: user.username,
      event: `${eventType}: สกิน ${sub.addonFileName}`,
      status: 'failed',
      errorMessage: err?.message || 'Network error',
      timestamp: new Date().toISOString(),
    });
    return { success: false, status: 'failed', message: `เกิดข้อผิดพลาด: ${err?.message || 'การเชื่อมต่อขัดข้อง'}` };
  }
}
