import React from 'react';
import {
  Package,
  PlusCircle,
  Bot,
  ShieldCheck,
  Bell,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileNavigationProps {
  activeTab: 'submissions' | 'admin';
  setActiveTab: (tab: 'submissions' | 'admin') => void;
  onOpenNewSubmission: () => void;
  onOpenBotConsole: () => void;
  onOpenSettings: () => void;
  botAlertCount: number;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewSubmission,
  onOpenBotConsole,
  onOpenSettings,
  botAlertCount,
}) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const isQuotaFull = currentUser.submittedSkinsCount >= currentUser.skinQuota;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1e1f22]/95 backdrop-blur-lg border-t border-slate-200 dark:border-zinc-800 px-3 py-1.5 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* History / Submissions Tab */}
        <button
          onClick={() => {
            setActiveTab('submissions');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition cursor-pointer active:scale-95 ${
            activeTab === 'submissions'
              ? 'text-emerald-500 font-bold'
              : 'text-slate-500 dark:text-zinc-400'
          }`}
        >
          {isAdmin ? <Package className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          <span className="text-[10px] whitespace-nowrap">
            {isAdmin ? 'สกินทั้งหมด' : 'ประวัติของฉัน'}
          </span>
        </button>

        {/* Admin Quota (Admin Only) */}
        {isAdmin && (
          <button
            onClick={() => {
              setActiveTab('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition cursor-pointer active:scale-95 ${
              activeTab === 'admin'
                ? 'text-[#5865F2] font-bold'
                : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] whitespace-nowrap">หลังบ้าน Admin</span>
          </button>
        )}

        {/* Center: Submit .mcaddon */}
        <button
          onClick={onOpenNewSubmission}
          disabled={isQuotaFull}
          className={`-mt-5 w-13 h-13 rounded-full text-white flex items-center justify-center shadow-xl border-2 border-white dark:border-[#1e1f22] active:scale-90 transition cursor-pointer ${
            isQuotaFull
              ? 'bg-slate-400 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-tr from-emerald-500 to-[#5865F2] shadow-emerald-500/40 hover:opacity-95'
          }`}
          title="ส่งไฟล์ .mcaddon"
        >
          <PlusCircle className="w-7 h-7" />
        </button>

        {/* Bot Console (Admin Only) */}
        {isAdmin && (
          <button
            onClick={onOpenBotConsole}
            className="min-h-[44px] min-w-[44px] relative flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-[#5865F2] active:scale-95 transition cursor-pointer"
          >
            <Bot className="w-5 h-5" />
            {botAlertCount > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#5865F2]" />
            )}
            <span className="text-[10px] whitespace-nowrap">บอท Discord</span>
          </button>
        )}

        {/* Settings (For both Member and Admin) */}
        <button
          onClick={onOpenSettings}
          className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-[#5865F2] active:scale-95 transition cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] whitespace-nowrap">ตั้งค่าแจ้งเตือน</span>
        </button>
      </div>
    </div>
  );
};
