import React, { useState, useEffect } from 'react';
import { DiscordUser } from '../types';
import {
  subscribeToAllUsers,
  updateUserSkinQuota,
  resetUserSkinCount,
  updateUserRole,
  promoteUserToAdminByQuery,
} from '../lib/db';
import {
  ShieldCheck,
  Search,
  Sliders,
  RotateCcw,
  Ban,
  CheckCircle2,
  Users,
  Crown,
  UserPlus,
  AlertCircle,
  Check,
} from 'lucide-react';

export const AdminQuotaManagement: React.FC = () => {
  const [users, setUsers] = useState<DiscordUser[]>([]);
  const [search, setSearch] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [tempQuota, setTempQuota] = useState<number>(3);
  const [saving, setSaving] = useState(false);

  // Promote by query state
  const [promoteQuery, setPromoteQuery] = useState('');
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteFeedback, setPromoteFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Role filter tab
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>('all');

  useEffect(() => {
    const unsub = subscribeToAllUsers((userList) => {
      setUsers(userList);
    });
    return () => unsub();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.globalName && u.globalName.toLowerCase().includes(search.toLowerCase())) ||
      (u.icName && u.icName.toLowerCase().includes(search.toLowerCase())) ||
      u.discordId.includes(search);

    if (!matchesSearch) return false;
    if (roleFilter === 'admin') return u.role === 'admin';
    if (roleFilter === 'member') return u.role !== 'admin';
    return true;
  });

  const handleUpdateQuota = async (userId: string, quota: number) => {
    setSaving(true);
    try {
      await updateUserSkinQuota(userId, quota);
      setEditingUserId(null);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอัปเดตโควตา');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = async (user: DiscordUser) => {
    const nextBlocked = !user.isBlocked;
    if (
      confirm(
        `คุณต้องการ${nextBlocked ? 'ระงับสิทธิ์' : 'คืนสิทธิ์'}การส่งสกินของ @${user.username} หรือไม่?`
      )
    ) {
      await updateUserSkinQuota(user.id, user.skinQuota, nextBlocked);
    }
  };

  const handleResetCount = async (user: DiscordUser) => {
    if (confirm(`รีเซ็ตจำนวนสกินที่ส่งแล้วของ @${user.username} ให้เป็น 0 หรือไม่?`)) {
      await resetUserSkinCount(user.id);
    }
  };

  const handleToggleRole = async (user: DiscordUser) => {
    const newRole = user.role === 'admin' ? 'member' : 'admin';
    const confirmText =
      newRole === 'admin'
        ? `คุณต้องการกดยอมรับให้ @${user.username} เป็น "Admin ผู้ดูแลระบบ" หรือไม่?`
        : `คุณต้องการลดสิทธิ์ @${user.username} กลับเป็น "Member ทั่วไป" หรือไม่?`;

    if (confirm(confirmText)) {
      try {
        await updateUserRole(user.id, newRole);
      } catch (err: any) {
        alert('เกิดข้อผิดพลาด: ' + err?.message);
      }
    }
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteQuery.trim()) return;

    setPromoteLoading(true);
    setPromoteFeedback(null);

    const res = await promoteUserToAdminByQuery(promoteQuery);
    setPromoteLoading(false);

    if (res.success) {
      setPromoteFeedback({ type: 'success', message: res.message });
      setPromoteQuery('');
      setTimeout(() => setPromoteFeedback(null), 5000);
    } else {
      setPromoteFeedback({ type: 'error', message: res.message });
    }
  };

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const memberCount = users.filter((u) => u.role !== 'admin').length;

  return (
    <div className="rounded-3xl bg-white dark:bg-[#2b2d31] p-5 sm:p-7 border border-slate-200 dark:border-zinc-700/80 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#5865F2]/10 text-[#5865F2] dark:text-[#7983f5] flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>ระบบหลังบ้าน: จัดการสิทธิ์ Admin & โควตาสกิน</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5865F2] text-white">
                ADMIN PANEL
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              กำหนดว่าบัญชี Discord ใดคือแอดมินจริง และควบคุมโควตาการส่งสกินรายบุคคล
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ Discord, ID หรือ IC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
          />
        </div>
      </div>

      {/* QUICK ADMIN PROMOTION BOX */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-slate-50 dark:from-[#1e1f22] dark:to-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-black text-indigo-950 dark:text-indigo-200">
            <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>กดยอมรับ / แต่งตั้งแอดมินด้วย Discord Username หรือ ID:</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400">
            ปัจจุบันมี Admin {adminCount} คน • Member {memberCount} คน
          </span>
        </div>

        <form onSubmit={handlePromoteSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={promoteQuery}
              onChange={(e) => setPromoteQuery(e.target.value)}
              placeholder="ระบุ Discord Username เช่น kinraven_12 หรือ User ID..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
            />
          </div>
          <button
            type="submit"
            disabled={promoteLoading || !promoteQuery.trim()}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>{promoteLoading ? 'กำลังตรวจสอบ...' : 'แต่งตั้งเป็น Admin'}</span>
          </button>
        </form>

        {promoteFeedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              promoteFeedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
            }`}
          >
            {promoteFeedback.type === 'success' ? (
              <Check className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{promoteFeedback.message}</span>
          </div>
        )}
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setRoleFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            roleFilter === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
              : 'bg-slate-100 dark:bg-[#1e1f22] text-slate-600 dark:text-zinc-400'
          }`}
        >
          ทั้งหมด ({users.length})
        </button>
        <button
          onClick={() => setRoleFilter('admin')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            roleFilter === 'admin'
              ? 'bg-[#5865F2] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-[#1e1f22] text-slate-600 dark:text-zinc-400'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>แอดมิน ({adminCount})</span>
        </button>
        <button
          onClick={() => setRoleFilter('member')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            roleFilter === 'member'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-[#1e1f22] text-slate-600 dark:text-zinc-400'
          }`}
        >
          สมาชิก ({memberCount})
        </button>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-xs">
            ไม่พบบัญชีผู้ใช้งานที่ค้นหา
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isEditing = editingUserId === user.id;
            const isExceeded = (user.submittedSkinsCount || 0) >= user.skinQuota;
            const isAdmin = user.role === 'admin';

            return (
              <div
                key={user.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200 dark:border-zinc-800 space-y-3"
              >
                {/* User Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover border border-[#5865F2]/40 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        <span>{user.globalName || user.username}</span>
                        {isAdmin && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-500 border border-amber-500/30">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        @{user.username} • ID: {user.discordId}
                      </div>
                    </div>
                  </div>

                  {/* Role Toggle Button Mobile */}
                  <button
                    onClick={() => handleToggleRole(user)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer flex-shrink-0 ${
                      isAdmin
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-white'
                    }`}
                    title={isAdmin ? 'กดเพื่อลดสิทธิ์เป็น Member' : 'กดเพื่อเลื่อนสิทธิ์เป็น Admin'}
                  >
                    <Crown className="w-3 h-3" />
                    <span>{isAdmin ? 'เป็น Admin' : 'แต่งตั้ง Admin'}</span>
                  </button>
                </div>

                {/* IC Name & Quota Meter */}
                <div className="flex items-center justify-between text-xs py-1 border-t border-b border-slate-200/60 dark:border-zinc-800/80">
                  <span className="text-slate-500 dark:text-zinc-400">
                    ชื่อ IC ในเกม:{' '}
                    <strong className="text-slate-800 dark:text-zinc-200">
                      {user.icName || '(ยังไม่ระบุ)'}
                    </strong>
                  </span>

                  <span
                    className={`font-black ${
                      isExceeded ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {user.submittedSkinsCount || 0} / {user.skinQuota} สกิน
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isExceeded ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        ((user.submittedSkinsCount || 0) / Math.max(1, user.skinQuota)) * 100
                      )}%`,
                    }}
                  />
                </div>

                {/* Actions Bar */}
                {isEditing ? (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-xs text-slate-500 dark:text-zinc-400">โควตา:</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={tempQuota}
                        onChange={(e) => setTempQuota(Number(e.target.value))}
                        className="w-20 px-2 py-1.5 rounded-lg bg-white dark:bg-[#2b2d31] border border-slate-300 dark:border-zinc-600 text-sm font-bold"
                      />
                    </div>
                    <button
                      onClick={() => handleUpdateQuota(user.id, tempQuota)}
                      disabled={saving}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer active:scale-95"
                    >
                      บันทึก
                    </button>
                    <button
                      onClick={() => setEditingUserId(null)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => {
                        setEditingUserId(user.id);
                        setTempQuota(user.skinQuota);
                      }}
                      className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] dark:text-[#7983f5] font-bold text-xs cursor-pointer active:scale-95"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>ปรับโควตา ({user.skinQuota})</span>
                    </button>

                    <button
                      onClick={() => handleResetCount(user)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-slate-900 active:scale-95 cursor-pointer"
                      title="รีเซ็ตจำนวนที่ส่งแล้วเป็น 0"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleToggleBlock(user)}
                      className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl cursor-pointer active:scale-95 ${
                        user.isBlocked
                          ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                          : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-rose-500'
                      }`}
                      title={user.isBlocked ? 'ปลดบล็อก' : 'ระงับสิทธิ์'}
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Users Quota & Role Table (Desktop md+) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800">
        <table className="w-full text-left text-xs text-slate-600 dark:text-zinc-300">
          <thead className="bg-slate-50 dark:bg-[#1e1f22] text-slate-700 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-zinc-800">
            <tr>
              <th className="py-3 px-4">บัญชี Discord</th>
              <th className="py-3 px-4">สิทธิ์ / บทบาท (Role)</th>
              <th className="py-3 px-4">ชื่อ IC ล่าสุด</th>
              <th className="py-3 px-4">ส่งแล้ว / โควตาสูงสุด</th>
              <th className="py-3 px-4">สถานะส่งสกิน</th>
              <th className="py-3 px-4 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  ไม่พบบัญชีผู้ใช้งาน
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isEditing = editingUserId === user.id;
                const isExceeded = (user.submittedSkinsCount || 0) >= user.skinQuota;
                const isAdmin = user.role === 'admin';

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#1e1f22]/50 transition duration-150"
                  >
                    {/* Discord User */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-8 h-8 rounded-full object-cover border border-[#5865F2]/30"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {user.globalName || user.username}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <span>@{user.username}</span>
                            <span>•</span>
                            <span className="font-mono text-[10px]">ID: {user.discordId}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleRole(user)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold text-xs transition cursor-pointer ${
                          isAdmin
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-[#5865F2]/10 hover:text-[#5865F2]'
                        }`}
                        title={
                          isAdmin
                            ? 'คลิกเพื่อลดสิทธิ์เป็น Member ทั่วไป'
                            : 'คลิกเพื่อกดยอมรับให้เป็น Admin'
                        }
                      >
                        <Crown className={`w-3.5 h-3.5 ${isAdmin ? 'text-amber-500' : 'text-slate-400'}`} />
                        <span>{isAdmin ? '👑 Admin (ผู้ดูแล)' : '👤 Member (ทั่วไป)'}</span>
                      </button>
                    </td>

                    {/* IC Name */}
                    <td className="py-3.5 px-4">
                      {user.icName ? (
                        <span className="font-bold text-slate-800 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                          {user.icName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">ยังไม่ระบุ</span>
                      )}
                    </td>

                    {/* Usage Progress */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-bold">
                          <span
                            className={
                              isExceeded
                                ? 'text-rose-500'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }
                          >
                            {user.submittedSkinsCount || 0}
                          </span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-900 dark:text-white">
                            {user.skinQuota} สกิน
                          </span>
                        </div>
                        <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isExceeded ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                ((user.submittedSkinsCount || 0) / Math.max(1, user.skinQuota)) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Blocked or Active */}
                    <td className="py-3.5 px-4">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                          <Ban className="w-3 h-3" />
                          <span>ระงับการส่ง</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ส่งได้ปกติ</span>
                        </span>
                      )}
                    </td>

                    {/* Actions: Edit Quota / Reset */}
                    <td className="py-3.5 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={tempQuota}
                            onChange={(e) => setTempQuota(Number(e.target.value))}
                            className="w-16 px-2 py-1 rounded bg-slate-50 dark:bg-[#1e1f22] border border-slate-300 dark:border-zinc-600 text-xs font-bold"
                          />
                          <button
                            onClick={() => handleUpdateQuota(user.id, tempQuota)}
                            disabled={saving}
                            className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                          >
                            บันทึก
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-2 py-1 rounded text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingUserId(user.id);
                              setTempQuota(user.skinQuota);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] dark:text-[#7983f5] font-semibold text-xs cursor-pointer"
                            title="ตั้งค่าจำนวนสกินที่อนุญาต"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>กำหนดโควตา</span>
                          </button>

                          <button
                            onClick={() => handleResetCount(user)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="รีเซ็ตจำนวนที่ส่งแล้วเป็น 0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleBlock(user)}
                            className={`p-1.5 rounded-lg cursor-pointer ${
                              user.isBlocked
                                ? 'bg-rose-500/10 text-rose-500'
                                : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-rose-500'
                            }`}
                            title={user.isBlocked ? 'ปลดบล็อก' : 'ระงับสิทธิ์'}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
