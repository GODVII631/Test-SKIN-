import { getAddonDownloadUrl } from '../lib/db';
import React, { useState } from 'react';
import { SkinSubmission, DiscordUser } from '../types';
import {
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Bot,
  FileCode,
  User,
  Edit3,
  Plus,
} from 'lucide-react';

interface SubmissionsListProps {
  submissions: SkinSubmission[];
  currentUser: DiscordUser;
  onUpdateStatus: (sub: SkinSubmission, newStatus: 'approved' | 'rejected', note: string) => void;
  onSelectSubForEmbed: (sub: SkinSubmission) => void;
  onEditSub: (sub: SkinSubmission) => void;
  onOpenNewSubmission?: () => void;
}

export const SubmissionsList: React.FC<SubmissionsListProps> = ({
  submissions,
  currentUser,
  onUpdateStatus,
  onSelectSubForEmbed,
  onEditSub,
  onOpenNewSubmission,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [reviewModalSub, setReviewModalSub] = useState<SkinSubmission | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [adminNote, setAdminNote] = useState('');

  const isAdmin = currentUser.role === 'admin';

  // Strict isolation: non-admin can only ever see their own submissions
  const userSubmissions = isAdmin
    ? submissions
    : submissions.filter(
        (s) => s.discordUserId === currentUser.id || s.discordId === currentUser.discordId
      );

  const filtered = userSubmissions.filter((s) => {
    const matchesSearch =
      s.icName.toLowerCase().includes(search.toLowerCase()) ||
      s.discordUsername.toLowerCase().includes(search.toLowerCase()) ||
      s.addonFileName.toLowerCase().includes(search.toLowerCase()) ||
      s.skinTitle.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownload = async (sub: SkinSubmission) => {
    if (!sub.filePath) {
      alert('ไม่พบไฟล์ข้อมูลสำหรับการดาวน์โหลด');
      return;
    }
    try {
      const url = await getAddonDownloadUrl(sub.filePath); // short-lived signed URL
      const a = document.createElement('a');
      a.href = url;
      a.download = sub.addonFileName || 'skin_pack.mcaddon';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e: any) {
      alert(e?.message || 'ดาวน์โหลดไม่สำเร็จ');
    }
  };

  const handleConfirmReview = () => {
    if (!reviewModalSub) return;
    onUpdateStatus(reviewModalSub, reviewStatus, adminNote);
    setReviewModalSub(null);
    setAdminNote('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>อนุมัติแล้ว</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            <span>ไม่อนุมัติ</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            <span>รอดำเนินการ</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#2b2d31] p-4 sm:p-6 border border-slate-200 dark:border-zinc-700/80 shadow-sm space-y-4">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {isAdmin
                ? 'ระบบหลังบ้าน: รายการไฟล์ Addon สกิน Minecraft ทั้งหมด'
                : 'ประวัติการส่งไฟล์ Addon สกินของฉัน (My Submissions)'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {filtered.length} รายการ
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {isAdmin
              ? 'ข้อมูลไฟล์สกิน .mcaddon พร้อมชื่อ IC และบัญชี Discord ที่ส่งเข้ามาทั้งหมดในระบบ'
              : 'ประวัติและสถานะไฟล์สกิน .mcaddon ที่คุณส่งเข้ามา สามารถกดแก้ไขข้อมูลหรือเปลี่ยนไฟล์ได้'}
          </p>
        </div>

        {/* Quick action for member */}
        {!isAdmin && onOpenNewSubmission && (
          <button
            onClick={onOpenNewSubmission}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>ส่งสกิน .mcaddon ใหม่</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={
              isAdmin
                ? 'ค้นหาชื่อ IC, บัญชี Discord หรือชื่อไฟล์ .mcaddon...'
                : 'ค้นหาชื่อ IC หรือชื่อไฟล์ .mcaddon ของคุณ...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200 dark:border-zinc-700 text-sm sm:text-xs text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-200 cursor-pointer"
        >
          <option value="all">ทุกสถานะ (All)</option>
          <option value="pending">⏳ รอดำเนินการ (Pending)</option>
          <option value="approved">✅ อนุมัติแล้ว (Approved)</option>
          <option value="rejected">❌ ไม่อนุมัติ (Rejected)</option>
        </select>
      </div>

      {/* Submissions Table (Desktop & Tablet) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100 dark:border-zinc-800">
        <table className="w-full text-left text-xs text-slate-600 dark:text-zinc-300">
          <thead className="bg-slate-50 dark:bg-[#1e1f22] text-slate-700 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-zinc-800">
            <tr>
              <th className="py-3 px-4">ชื่อ IC / Minecraft IGN</th>
              {isAdmin && <th className="py-3 px-4">บัญชี Discord ผู้ส่ง</th>}
              <th className="py-3 px-4">ไฟล์สกิน (.mcaddon)</th>
              <th className="py-3 px-4">สถานะการตรวจสอบ</th>
              <th className="py-3 px-4">วันที่ส่ง / แก้ไข</th>
              <th className="py-3 px-4 text-right">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileCode className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
                    <span>
                      {isAdmin
                        ? 'ไม่พบรายการสกินที่ตรงกับเงื่อนไข'
                        : 'คุณยังไม่มีประวัติการส่งสกิน Minecraft ในระบบ'}
                    </span>
                    {!isAdmin && onOpenNewSubmission && (
                      <button
                        onClick={onOpenNewSubmission}
                        className="mt-2 text-xs font-bold text-[#5865F2] hover:underline"
                      >
                        กดที่นี่เพื่อส่งไฟล์สกินแรกของคุณ
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((sub) => {
                const isOwner = sub.discordUserId === currentUser.id || sub.discordId === currentUser.discordId;

                return (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#1e1f22]/50 transition duration-150"
                  >
                    {/* IC Name & Skin Title */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#5865F2]" />
                          <span>{sub.icName}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                          {sub.skinTitle}
                        </div>
                        {sub.adminNote && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 italic mt-0.5">
                            หมายเหตุจาก Admin: {sub.adminNote}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Discord User (Admin view only) */}
                    {isAdmin && (
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={sub.discordAvatar}
                            alt={sub.discordUsername}
                            className="w-7 h-7 rounded-full object-cover border border-[#5865F2]/30"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              @{sub.discordUsername}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {sub.discordId || sub.discordUserId}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Addon File */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <FileCode className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-xs text-slate-800 dark:text-zinc-200 truncate max-w-[180px]">
                            {sub.addonFileName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {(sub.fileSize / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(sub.status)}</td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-zinc-400">
                      <div>
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('th-TH') : '-'}
                      </div>
                      {sub.updatedAt && (
                        <div className="text-[10px] text-slate-400">
                          แก้ไข: {new Date(sub.updatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Download .mcaddon button */}
                        <button
                          onClick={() => handleDownload(sub)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition cursor-pointer"
                          title="ดาวน์โหลดไฟล์ .mcaddon"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>โหลดไฟล์</span>
                        </button>

                        {/* Owner can Edit their submission / replace file */}
                        {(isOwner || isAdmin) && (
                          <button
                            onClick={() => onEditSub(sub)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] font-bold text-xs transition cursor-pointer"
                            title="แก้ไขข้อมูลหรือเปลี่ยนไฟล์ .mcaddon"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>แก้ไข</span>
                          </button>
                        )}

                        {/* Admin-only Discord Embed preview */}
                        {isAdmin && (
                          <button
                            onClick={() => onSelectSubForEmbed(sub)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-[#5865F2] cursor-pointer"
                            title="ดู Discord Embed ที่ส่งแจ้งเตือน"
                          >
                            <Bot className="w-4 h-4" />
                          </button>
                        )}

                        {/* Admin review button */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setReviewModalSub(sub);
                              setReviewStatus(sub.status === 'approved' ? 'rejected' : 'approved');
                              setAdminNote(sub.adminNote || '');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs transition cursor-pointer"
                          >
                            ตรวจสอบ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Submissions Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs space-y-2">
            <p>
              {isAdmin
                ? 'ไม่พบรายการสกิน'
                : 'คุณยังไม่มีประวัติการส่งสกิน Minecraft ในระบบ'}
            </p>
            {!isAdmin && onOpenNewSubmission && (
              <button
                onClick={onOpenNewSubmission}
                className="text-xs font-bold text-[#5865F2] hover:underline"
              >
                กดที่นี่เพื่อส่งไฟล์สกินแรกของคุณ
              </button>
            )}
          </div>
        ) : (
          filtered.map((sub) => {
            const isOwner = sub.discordUserId === currentUser.id || sub.discordId === currentUser.discordId;

            return (
              <div
                key={sub.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-zinc-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isAdmin && (
                      <img
                        src={sub.discordAvatar}
                        alt={sub.discordUsername}
                        className="w-9 h-9 rounded-full object-cover border border-[#5865F2]/40 flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                        <span>IC: {sub.icName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                        {isAdmin ? `@${sub.discordUsername} • ` : ''}{sub.skinTitle}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">{getStatusBadge(sub.status)}</div>
                </div>

                {/* File Info */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <FileCode className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="font-mono font-bold truncate">{sub.addonFileName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                    {(sub.fileSize / 1024).toFixed(1)} KB
                  </span>
                </div>

                {sub.adminNote && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-xl">
                    หมายเหตุจาก Admin: {sub.adminNote}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-zinc-800/80 text-xs">
                  {/* Edit button */}
                  {(isOwner || isAdmin) ? (
                    <button
                      onClick={() => onEditSub(sub)}
                      className="min-h-[40px] flex items-center gap-1.5 text-[#5865F2] font-bold px-3 py-1.5 rounded-xl bg-[#5865F2]/10 active:scale-95 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไขสกิน</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(sub)}
                      className="min-h-[40px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs active:scale-95 transition cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>โหลดไฟล์</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setReviewModalSub(sub);
                          setReviewStatus(sub.status === 'approved' ? 'rejected' : 'approved');
                          setAdminNote(sub.adminNote || '');
                        }}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#5865F2] text-white font-bold text-xs active:scale-95 transition cursor-pointer shadow-sm"
                      >
                        ตรวจ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admin Review Action Modal */}
      {isAdmin && reviewModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-zinc-700 shadow-2xl p-5 sm:p-6 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              ตรวจสอบสกินของ IC: {reviewModalSub.icName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
              ไฟล์: <span className="font-mono text-[#5865F2]">{reviewModalSub.addonFileName}</span> โดย @{reviewModalSub.discordUsername}
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                สถานะผลการตรวจสอบ
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewStatus('approved')}
                  className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition ${
                    reviewStatus === 'approved'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                      : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>อนุมัติ (Approved)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatus('rejected')}
                  className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition ${
                    reviewStatus === 'rejected'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                      : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>ไม่อนุมัติ (Rejected)</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                หมายเหตุจาก Admin (จะถูกส่งเข้าห้อง Discord ด้วย)
              </label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="เช่น อนุมัติเรียบร้อย เพิ่มเข้าเซิร์ฟเวอร์แล้ว หรือ สกินไม่ถูกต้องตามระเบียบ..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200 dark:border-zinc-700 text-sm sm:text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewModalSub(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                className="min-h-[40px] px-5 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold shadow-md cursor-pointer active:scale-95 transition"
              >
                บันทึกและแจ้งเตือน Discord
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
