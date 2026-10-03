import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sun,
  Moon,
  Bell,
  Box,
  ChevronDown,
  UserCheck,
  Bot,
  ExternalLink,
  PackagePlus,
  ShieldCheck,
  Radio,
  Sliders,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  onOpenNewSubmission: () => void;
  onOpenSettings: () => void;
  onOpenLogin: () => void;
  onOpenBotConsole: () => void;
  onToggleAdminView: () => void;
  isAdminView: boolean;
  botAlertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewSubmission,
  onOpenSettings,
  onOpenLogin,
  onOpenBotConsole,
  onToggleAdminView,
  isAdminView,
  botAlertCount,
}) => {
  const { currentUser, theme, toggleTheme, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  if (!currentUser) return null;

  const quotaRemaining = Math.max(0, currentUser.skinQuota - currentUser.submittedSkinsCount);
  const isQuotaFull = currentUser.submittedSkinsCount >= currentUser.skinQuota;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors bg-white/90 dark:bg-[#1e1f22]/90 border-slate-200 dark:border-[#2b2d31]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand & Indicators */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-[#5865F2] to-[#3c45a5] flex items-center justify-center shadow-md shadow-[#5865F2]/20 text-white font-black text-xl">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  Skin<span className="text-[#5865F2]">Addon</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  .MCADDON
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 hidden sm:block">
                ระบบส่งสกินมายคราฟ & แจ้งเตือนบอท Discord
              </p>
            </div>
          </div>

          {/* Realtime badges */}
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-zinc-800 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Firebase เรียลไทม์
            </span>
            {currentUser.role === 'admin' ? (
              <button
                onClick={onOpenBotConsole}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] dark:text-[#7983f5] font-medium transition cursor-pointer"
                title="เปิดดูการแจ้งเตือนบอท Discord (เฉพาะ Admin)"
              >
                <Radio className="w-3 h-3 text-[#5865F2]" />
                Discord Bot
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                บอท Discord แจ้งเตือนพร้อมทำงาน
              </span>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* User Skin Quota Pill (Tablet & Desktop) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#2b2d31] border border-slate-200/80 dark:border-zinc-700/60">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                isQuotaFull
                  ? 'bg-rose-500/10 text-rose-500'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {currentUser.submittedSkinsCount}
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 leading-none">
                โควตาสกิน
              </div>
              <div className="text-xs font-black text-slate-900 dark:text-white">
                {currentUser.submittedSkinsCount} / {currentUser.skinQuota} <span className="text-[10px] font-normal text-slate-400">สกิน</span>
              </div>
            </div>
          </div>

          {/* Admin Toggle View (Admin Only - Hidden on Mobile because bottom nav has it) */}
          {currentUser.role === 'admin' && (
            <button
              onClick={onToggleAdminView}
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isAdminView
                  ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-[#2b2d31] text-slate-700 dark:text-zinc-200'
              }`}
              title="สลับโหมดจัดการหลังบ้าน"
            >
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>{isAdminView ? 'โหมดหลังบ้าน Admin' : 'จัดการโควตา'}</span>
            </button>
          )}

          {/* New Skin Button (Desktop & Tablet) */}
          <button
            onClick={onOpenNewSubmission}
            disabled={isQuotaFull}
            className={`hidden sm:flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer ${
              isQuotaFull
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-emerald-500 to-[#5865F2] hover:opacity-95 shadow-emerald-500/25'
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            <span>ส่งสกิน .mcaddon</span>
          </button>

          {/* Bot Console trigger (Admin Only - Desktop) */}
          {currentUser.role === 'admin' ? (
            <button
              onClick={onOpenBotConsole}
              className="hidden md:flex relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2b2d31] text-slate-600 dark:text-zinc-300 transition cursor-pointer"
              title="เปิดคอนโซลบอท Discord (Admin)"
            >
              <Bot className="w-5 h-5 text-[#5865F2]" />
              {botAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#5865F2] text-[10px] font-bold text-white shadow">
                  {botAlertCount > 9 ? '9+' : botAlertCount}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={onOpenSettings}
              className="hidden md:flex p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2b2d31] text-slate-600 dark:text-zinc-300 transition cursor-pointer"
              title="ตั้งค่าการแจ้งเตือน Discord"
            >
              <Bell className="w-5 h-5 text-[#5865F2]" />
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2b2d31] text-slate-600 dark:text-zinc-300 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {/* User Profile / Discord Switcher */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2b2d31] border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 transition cursor-pointer min-h-[44px]"
            >
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.username}
                  className="w-8 h-8 rounded-full object-cover border border-[#5865F2]/40"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1.5 ring-white dark:ring-[#1e1f22]"></span>
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-tight">
                  {currentUser.globalName || currentUser.username}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 leading-none">
                  @{currentUser.username}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-zinc-700/80 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {/* User info */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/60 dark:border-zinc-800 mb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.username}
                        className="w-11 h-11 rounded-xl object-cover border-2 border-[#5865F2]"
                      />
                      <div className="overflow-hidden">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {currentUser.globalName || currentUser.username}
                        </div>
                        <div className="text-xs text-[#5865F2] font-semibold">
                          @{currentUser.username}#{currentUser.discriminator || '0001'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#5865F2]/20 text-[#5865F2]">
                            {currentUser.role}
                          </span>
                          {currentUser.icName && (
                            <span className="text-[10px] text-emerald-500 font-bold">
                              IC: {currentUser.icName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-zinc-400">โควตาสกิน:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {currentUser.submittedSkinsCount} / {currentUser.skinQuota} สกิน
                      </span>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-zinc-700/80">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1e1f22] transition cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-[#5865F2]" />
                      <span>เข้าสู่ระบบด้วย Discord อื่น</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1e1f22] transition cursor-pointer"
                    >
                      <Bell className="w-4 h-4 text-emerald-500" />
                      <span>ตั้งค่า Webhook แจ้งเตือนบอท</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>ออกจากระบบ (กลับหน้า Login)</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
