export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'member';
export type BotEventType = 'new_submission' | 'status_change' | 'updated_submission' | 'test';

export interface DiscordNotificationSettings {
  enabled: boolean;
  webhookUrl: string;
  notifyOnSubmission: boolean;
  notifyOnStatusChange: boolean;
  soundEnabled: boolean;
}

export interface DiscordUser {
  id: string;              // discord user id or uid
  discordId: string;
  username: string;
  globalName?: string;
  discriminator?: string;
  avatar: string;
  email?: string;
  role: UserRole;
  icName?: string;         // In-Character (Minecraft) Name
  skinQuota: number;       // Max skins allowed to submit (Admin-controlled)
  submittedSkinsCount: number; // Current submitted skins count
  isBlocked?: boolean;     // Admin can suspend submission rights
  createdAt: string;
  updatedAt?: string;
  notificationSettings: DiscordNotificationSettings;
}

export interface SkinSubmission {
  id: string;
  discordUserId: string;
  discordUsername: string;
  discordAvatar: string;
  discordId: string;
  icName: string;           // In-Character Minecraft Name (ชื่อ IC)
  skinTitle: string;        // ชื่อสกิน / รายละเอียด
  description?: string;
  addonFileName: string;    // ชื่อไฟล์ .mcaddon
  fileSize: number;         // bytes
  fileData?: string;        // data URL, only used client-side right before upload
  filePath?: string;        // Supabase Storage path (bucket: addons)
  status: SubmissionStatus; // pending / approved / rejected
  adminNote?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  author?: {
    name: string;
    icon_url?: string;
    url?: string;
  };
  footer?: {
    text: string;
    icon_url?: string;
  };
  thumbnail?: {
    url: string;
  };
  timestamp?: string;
}

export interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: DiscordEmbed[];
}

export interface BotLog {
  id: string;
  submissionId?: string;
  userId: string;
  username: string;
  event: string;
  status: 'sent' | 'simulated' | 'failed' | 'skipped';
  channel?: string;
  payload?: DiscordWebhookPayload;
  errorMessage?: string;
  timestamp: string;
}
