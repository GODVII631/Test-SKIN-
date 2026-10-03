import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BotLog, SkinSubmission } from '../types';
import { subscribeToBotLogs } from '../lib/db';
import { buildMinecraftSkinDiscordEmbed, dispatchDiscordNotification } from '../lib/discord';
import {
  Bot,
  X,
  Send,
  Radio,
  CheckCircle2,
  Copy,
  Code,
  MessageSquare,
  Package,
} from 'lucide-react';

interface DiscordBotConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSub?: SkinSubmission | null;
}

export const DiscordBotConsole: React.FC<DiscordBotConsoleProps> = ({
  isOpen,
  onClose,
  selectedSub,
}) => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'logs' | 'payload'>('preview');
  const [sendingTest, setSendingTest] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToBotLogs((botLogs) => {
      setLogs(botLogs);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  const displaySub: SkinSubmission = selectedSub || {
    id: 'sample_sub_1',
    discordUserId: currentUser.id,
    discordUsername: currentUser.username,
    discordAvatar: currentUser.avatar,
    discordId: currentUser.discordId,
    icName: currentUser.icName || 'Kuro_Kaiser',
    skinTitle: 'ชุดเกราะอัศวินทองคำรอยัลการ์ด',
    description: 'แอดออนสกินสำหรับเล่นบทบาททหารกองกำลังหลวงในเซิร์ฟเวอร์',
    addonFileName: 'Royal_Knight_Armor_v1.mcaddon',
    fileSize: 284500,
    status: 'approved',
    adminNote: 'อนุมัติเรียบร้อย โมเดล 64x64 ถูกต้องตามระเบียบเซิร์ฟเวอร์',
    reviewedBy: 'Admin',
    createdAt: new Date().toISOString(),
  };

  const payload = buildMinecraftSkinDiscordEmbed(displaySub, currentUser, 'new_submission');
  const embed = payload.embeds?.[0];

  const handleSendTestWebhook = async () => {
    setSendingTest(true);
    await dispatchDiscordNotification({
      webhookUrl: currentUser.notificationSettings?.webhookUrl,
      sub: displaySub,
      user: currentUser,
      eventType: 'test',
      forceBypassFilter: true,
    });
    setSendingTest(false);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEmbedBorderColor = (colorNum?: number) => {
    if (!colorNum) return '#2ecc71';
    return `#${colorNum.toString(16).padStart(6, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-zinc-700 shadow-2xl p-6 sm:p-7 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#5865F2] text-white flex items-center justify-center shadow-lg shadow-[#5865F2]/25">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Discord Bot Simulator & Webhook Feed
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                จำลองข้อความที่ส่งเข้าห้องแชท Discord ทันทีที่มีการส่งสกินหรืออนุมัติสกิน
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#1e1f22]">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer min-h-[40px] ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-[#2b2d31] text-[#5865F2] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">ตัวอย่าง Discord Chat (UI)</span>
            <span className="sm:hidden">แชทบอท</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer min-h-[40px] ${
              activeTab === 'logs'
                ? 'bg-white dark:bg-[#2b2d31] text-[#5865F2] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">ประวัติการส่งบอท ({logs.length})</span>
            <span className="sm:hidden">ประวัติ ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payload')}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer min-h-[40px] ${
              activeTab === 'payload'
                ? 'bg-white dark:bg-[#2b2d31] text-[#5865F2] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">JSON Webhook Schema</span>
            <span className="sm:hidden">JSON</span>
          </button>
        </div>

        {/* TAB 1: Discord Client Preview */}
        {activeTab === 'preview' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#313338] text-white p-4 sm:p-5 shadow-inner border border-zinc-800 font-sans">
              {/* Channel Header */}
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-zinc-700/60 text-xs text-zinc-400">
                <span className="text-zinc-500 text-base font-bold">#</span>
                <span className="font-bold text-zinc-200">minecraft-skin-submissions</span>
                <span className="text-[10px] bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300">
                  ห้องแจ้งเตือนสกิน .mcaddon
                </span>
              </div>

              {/* Bot Message Row */}
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow">
                    <Package className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white hover:underline cursor-pointer">
                      Minecraft Addon Notifier
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#5865F2] text-white uppercase">
                      BOT
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      วันนี้ เวลา {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Embed Box */}
                  {embed && (
                    <div
                      style={{ borderLeftColor: getEmbedBorderColor(embed.color) }}
                      className="rounded-lg bg-[#2b2d31] p-4 border-l-4 shadow-sm space-y-3 max-w-xl"
                    >
                      {/* Author */}
                      {embed.author && (
                        <div className="flex items-center gap-2">
                          <img
                            src={embed.author.icon_url}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="text-xs font-bold text-zinc-200">
                            {embed.author.name}
                          </span>
                        </div>
                      )}

                      <div className="text-base font-bold text-white hover:underline cursor-pointer">
                        {embed.title}
                      </div>

                      {embed.description && (
                        <div className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                          {embed.description}
                        </div>
                      )}

                      {/* Fields */}
                      {embed.fields && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {embed.fields.map((f, idx) => (
                            <div key={idx} className="space-y-0.5">
                              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                                {f.name}
                              </div>
                              <div className="text-xs text-white font-medium break-words">
                                {f.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      {embed.footer && (
                        <div className="pt-2 border-t border-zinc-700/60 flex items-center justify-between text-[10px] text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>{embed.footer.text}</span>
                          </div>
                          <span>{new Date().toLocaleTimeString('th-TH')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Test Trigger */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-zinc-800">
              <div className="text-xs text-slate-600 dark:text-zinc-300">
                <span className="font-bold">Webhook ปัจจุบัน: </span>
                <span className="font-mono text-[11px] text-[#5865F2]">
                  {currentUser.notificationSettings?.webhookUrl
                    ? `${currentUser.notificationSettings.webhookUrl.slice(0, 45)}...`
                    : '(ยังไม่ได้ระบุ Webhook จริง - ส่งจำลองลงคอนโซล)'}
                </span>
              </div>

              <button
                onClick={handleSendTestWebhook}
                disabled={sendingTest}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-[#5865F2] text-white text-xs font-bold shadow-md hover:opacity-95 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingTest ? 'กำลังส่ง...' : 'ทดสอบส่งข้อความแจ้งเตือนนี้'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Bot Dispatch Logs */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                ยังไม่มีบันทึกการส่งการแจ้งเตือนบอท
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-zinc-800 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {log.event}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          log.status === 'sent'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : log.status === 'simulated'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {log.status === 'sent' ? '204 SUCCESS' : log.status}
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-zinc-400 text-[11px]">
                      ผู้ส่ง: @{log.username} • {log.channel || 'Discord Webhook'}
                    </div>
                    {log.errorMessage && (
                      <div className="text-rose-500 text-[11px]">{log.errorMessage}</div>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: Developer JSON Webhook Payload */}
        {activeTab === 'payload' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                โครงสร้าง JSON ที่ส่งไปยัง Discord Webhook API
              </span>
              <button
                onClick={handleCopyPayload}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอก JSON'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-[#1e1f22] text-emerald-400 font-mono text-xs overflow-x-auto max-h-72 border border-zinc-800">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
