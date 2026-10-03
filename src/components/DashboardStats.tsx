import React from 'react';
import { SkinSubmission, DiscordUser } from '../types';
import {
  Package,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  User,
  Layers,
} from 'lucide-react';

interface DashboardStatsProps {
  submissions: SkinSubmission[];
  currentUser: DiscordUser;
  onOpenNewSubmission: () => void;
  onOpenBotConsole: () => void;
  onToggleAdminView: () => void;
  isAdminView: boolean;
  botAlertCount: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  submissions,
  currentUser,
  onOpenNewSubmission,
  onOpenBotConsole,
  onToggleAdminView,
  isAdminView,
  botAlertCount,
}) => {
  const isAdmin = currentUser.role === 'admin';

  // Submissions filtered for current user context
  const relevantSubmissions = isAdmin
    ? submissions
    : submissions.filter(
        (s) => s.discordUserId === currentUser.id || s.discordId === currentUser.discordId
      );

  const totalSubmissions = relevantSubmissions.length;
  const pendingCount = relevantSubmissions.filter((s) => s.status === 'pending').length;
  const approvedCount = relevantSubmissions.filter((s) => s.status === 'approved').length;
  const rejectedCount = relevantSubmissions.filter((s) => s.status === 'rejected').length;

  const quotaRemaining = Math.max(0, currentUser.skinQuota - currentUser.submittedSkinsCount);
  const isQuotaFull = currentUser.submittedSkinsCount >= currentUser.skinQuota;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Hero Banner with Quota Info & Call to Action */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#202225] via-[#2f3136] to-[#1e1f22] p-4 sm:p-7 lg:p-8 text-white shadow-xl border border-zinc-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Minecraft Addon (.mcaddon) Skin Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              สวัสดี, {currentUser.globalName || currentUser.username}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300">
              {isAdmin
                ? 'ระบบจัดการไฟล์แอดออนสกิน Minecraft (.mcaddon) พร้อมเชื่อมต่อห้อง Discord และตรวจเช็กสถานะการส่ง'
                : 'ส่งไฟล์แอดออนสกิน Minecraft (.mcaddon) สำหรับใช้งานในเซิร์ฟเวอร์ พร้อมระบบแจ้งเตือนผ่านบอท Discord'}
            </p>

            {/* In-Character details if set */}
            <div className="pt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <User className="w-3.5 h-3.5 text-[#5865F2] flex-shrink-0" />
                <span>ชื่อ IC ปัจจุบัน: </span>
                <strong className="text-white">
                  {currentUser.icName || '(ยังไม่ได้ส่งสกิน)'}
                </strong>
              </span>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Bot className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>แจ้งเตือน Discord Bot: </span>
                <strong className="text-emerald-400">เปิดใช้งาน</strong>
              </span>
            </div>
          </div>

          {/* Quota Card Widget */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-zinc-700/80 backdrop-blur-md w-full lg:w-80 space-y-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">โควตาสกินของคุณ:</span>
              <span
                className={`text-sm font-black ${
                  isQuotaFull ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {currentUser.submittedSkinsCount} / {currentUser.skinQuota} สกิน
              </span>
            </div>

            {/* Progress */}
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isQuotaFull ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (currentUser.submittedSkinsCount / Math.max(1, currentUser.skinQuota)) * 100
                  )}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>{isQuotaFull ? '❌ ครบโควตาสูงสุดแล้ว' : `เหลือโควตาอีก ${quotaRemaining} สกิน`}</span>
              {isAdmin && (
                <span className="text-amber-400 font-bold">Admin สิทธิ์พิเศษ</span>
              )}
            </div>

            <button
              onClick={onOpenNewSubmission}
              disabled={isQuotaFull}
              className={`w-full min-h-[44px] py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 ${
                isQuotaFull
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-[#5865F2] hover:opacity-95 text-white shadow-md shadow-emerald-500/20'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{isQuotaFull ? 'โควตาสกินเต็มแล้ว' : 'ส่งไฟล์สกิน .mcaddon'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Submissions */}
        <div className="rounded-2xl bg-white dark:bg-[#2b2d31] p-3.5 sm:p-5 border border-slate-200 dark:border-zinc-700/80 shadow-sm flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#5865F2]/10 text-[#5865F2] flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400 truncate">
              {isAdmin ? 'สกินในระบบทั้งหมด' : 'สกินของฉันทั้งหมด'}
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white truncate">
              {totalSubmissions} <span className="text-xs font-normal text-slate-400">รายการ</span>
            </div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="rounded-2xl bg-white dark:bg-[#2b2d31] p-3.5 sm:p-5 border border-slate-200 dark:border-zinc-700/80 shadow-sm flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400 truncate">
              รอดำเนินการตรวจสอบ
            </div>
            <div className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 truncate">
              {pendingCount} <span className="text-xs font-normal text-slate-400">สกิน</span>
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="rounded-2xl bg-white dark:bg-[#2b2d31] p-3.5 sm:p-5 border border-slate-200 dark:border-zinc-700/80 shadow-sm flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400 truncate">
              อนุมัติเรียบร้อยแล้ว
            </div>
            <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
              {approvedCount} <span className="text-xs font-normal text-slate-400">สกิน</span>
            </div>
          </div>
        </div>

        {/* 4th Card: Admin gets Bot Log count, Member gets Quota Remaining */}
        {isAdmin ? (
          <div
            onClick={onOpenBotConsole}
            className="rounded-2xl bg-white dark:bg-[#2b2d31] p-3.5 sm:p-5 border border-slate-200 dark:border-zinc-700/80 shadow-sm flex items-center gap-2.5 sm:gap-3.5 cursor-pointer hover:border-[#5865F2] transition min-w-0 active:scale-95"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#5865F2]/10 text-[#5865F2] flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400 truncate">
                ประวัติแจ้งเตือนบอท
              </div>
              <div className="text-lg sm:text-2xl font-black text-[#5865F2] truncate">
                {botAlertCount} <span className="text-xs font-normal text-slate-400">ครั้ง</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-[#2b2d31] p-3.5 sm:p-5 border border-slate-200 dark:border-zinc-700/80 shadow-sm flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400 truncate">
                โควตาคงเหลือที่ส่งได้
              </div>
              <div className="text-lg sm:text-2xl font-black text-purple-600 dark:text-purple-400 truncate">
                {quotaRemaining} <span className="text-xs font-normal text-slate-400">สกิน</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
