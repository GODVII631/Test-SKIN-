import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DiscordNotificationSettings, SkinSubmission } from '../types';
import { dispatchDiscordNotification } from '../lib/discord';
import {
  Bell,
  X,
  Volume2,
  VolumeX,
  Send,
  Check,
  AlertCircle,
  Link,
  HelpCircle,
  Package,
} from 'lucide-react';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, updateSettings } = useAuth();
  const [settings, setSettings] = useState<DiscordNotificationSettings>(() => ({
    ...(currentUser?.notificationSettings || {
      enabled: true,
      webhookUrl: '',
      notifyOnSubmission: true,
      notifyOnStatusChange: true,
      soundEnabled: true,
    }),
  }));

  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  if (!isOpen || !currentUser) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      setSaving(false);
      onClose();
    } catch (err) {
      setSaving(false);
      alert('บันทึกการตั้งค่าไม่สำเร็จ');
    }
  };

  const handleTestNotification = async () => {
    setTestStatus({ loading: true });
    try {
      await updateSettings(settings); // webhook is read server-side, so save it first
    } catch (err: any) {
      setTestStatus({ loading: false, success: false, message: err?.message || 'บันทึกการตั้งค่าไม่สำเร็จ' });
      return;
    }

    // Mock skin submission for test notification
    const testSub: SkinSubmission = {
      id: `test_${Date.now()}`,
      discordUserId: currentUser.id,
      discordUsername: currentUser.username,
      discordAvatar: currentUser.avatar,
      discordId: currentUser.discordId,
      icName: currentUser.icName || 'Test_Player',
      skinTitle: 'ชุดทดสอบระบบการแจ้งเตือน Minecraft Addon',
      description: `ทดสอบส่งจากบัญชี ${currentUser.globalName || currentUser.username} ไปยัง Webhook ของคุณ`,
      addonFileName: 'Test_Skin_Pack.mcaddon',
      fileSize: 125000,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const res = await dispatchDiscordNotification({
      webhookUrl: settings.webhookUrl,
      sub: testSub,
      user: {
        ...currentUser,
        notificationSettings: settings,
      },
      eventType: 'test',
      forceBypassFilter: true,
    });

    setTestStatus({
      loading: false,
      success: res.success,
      message: res.message,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-zinc-700 shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#5865F2]/10 dark:bg-[#5865F2]/20 text-[#5865F2] dark:text-[#7983f5] flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                ตั้งค่าการแจ้งเตือนบอท Discord รายบุคคล
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                กำหนดการแจ้งเตือนผ่าน Discord Webhook สำหรับบัญชี @{currentUser.username}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-zinc-800">
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              เปิดใช้งานการแจ้งเตือน
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400">
              รับข้อความผ่าน Discord Webhook ทันทีที่มีการส่งสกินหรือสถานะเปลี่ยน
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5865F2]"></div>
          </label>
        </div>

        {/* Webhook URL Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Link className="w-4 h-4 text-[#5865F2]" />
              <span>Discord Webhook URL ส่วนบุคคล</span>
            </label>
          </div>
          <input
            type="url"
            value={settings.webhookUrl}
            onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#5865F2]/50"
          />
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
            วิธีรับ URL: ใน Discord ไปที่ Server Settings ➜ Integrations ➜ Webhooks ➜ New Webhook ➜ Copy Webhook URL
          </p>
        </div>

        {/* Event Checkboxes */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
            เลือกเหตุการณ์ที่ต้องการรับการแจ้งเตือน
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* On New Submission */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifyOnSubmission}
                onChange={(e) => setSettings({ ...settings, notifyOnSubmission: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-[#5865F2] focus:ring-[#5865F2]"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-white">
                  เมื่อมีการส่งไฟล์สกินใหม่ (.mcaddon)
                </div>
                <div className="text-slate-500 dark:text-zinc-400 text-[11px]">
                  แจ้งข้อมูลชื่อ IC, บัญชี Discord, และไฟล์ที่ส่ง
                </div>
              </div>
            </label>

            {/* On Status Change */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifyOnStatusChange}
                onChange={(e) => setSettings({ ...settings, notifyOnStatusChange: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-[#5865F2] focus:ring-[#5865F2]"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-white">
                  เมื่อ Admin ตรวจสอบสกิน (อนุมัติ / ปฏิเสธ)
                </div>
                <div className="text-slate-500 dark:text-zinc-400 text-[11px]">
                  แจ้งผลการอนุมัติและหมายเหตุจากทีมงาน
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Sound toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            {settings.soundEnabled ? (
              <Volume2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                เสียงแจ้งเตือนบนหน้าเว็บ (Sound Effect)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                เล่นเสียง Discord Tone สั้นๆ เมื่อมีรายการใหม่
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
            className="w-4 h-4 rounded text-[#5865F2]"
          />
        </div>

        {/* Test Ping Button & Result */}
        <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestNotification}
              disabled={testStatus.loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-200 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-[#5865F2]" />
              <span>{testStatus.loading ? 'กำลังทดสอบ...' : 'ทดสอบส่งข้อความ (Test Ping)'}</span>
            </button>

            {testStatus.message && (
              <span
                className={`text-xs font-medium ${
                  testStatus.success ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                {testStatus.message}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#5865F2] hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
