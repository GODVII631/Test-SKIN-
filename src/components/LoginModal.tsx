import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Bot,
  ExternalLink,
  Globe,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { signIn, currentUser, logout } = useAuth();

  // Real OAuth config state
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  if (!isOpen) return null;

  const handleOAuthLaunch = async () => {
    setOauthError(null);
    setOauthLoading(true);
    try {
      await signIn(); // redirects to Discord via Supabase Auth
    } catch (err: any) {
      setOauthError(err?.message || 'เกิดข้อผิดพลาดในการเปิด Discord OAuth');
      setOauthLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-zinc-700 shadow-2xl p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#5865F2] text-white flex items-center justify-center shadow-lg shadow-[#5865F2]/30">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                บัญชี Discord
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                เข้าสู่ระบบด้วย Discord OAuth2
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

        {currentUser ? (
          /* Already Logged In Details */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.username}
                  className="w-12 h-12 rounded-full border-2 border-[#5865F2]"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {currentUser.globalName || currentUser.username}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                    @{currentUser.username}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#5865F2]/10 text-[#5865F2] dark:text-[#7983f5]">
                    <ShieldCheck className="w-3 h-3" />
                    <span>บทบาท: {currentUser.role === 'admin' ? '👑 Admin' : '👤 Member'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition cursor-pointer"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        ) : (
          /* Login Action */
          <div className="space-y-4">
            {oauthError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{oauthError}</span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-200 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#5865F2]" />
                <span>เข้าสู่ระบบด้วย Discord จริง</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                ระบบจะเปิดหน้าต่างยืนยันสิทธิ์ของ Discord อย่างปลอดภัย ไม่มีการเก็บรหัสผ่าน
              </p>
            </div>

            <button
              onClick={handleOAuthLaunch}
              disabled={oauthLoading}
              className="w-full min-h-[50px] flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-bold shadow-lg shadow-[#5865F2]/30 transition cursor-pointer disabled:opacity-75"
            >
              <svg className="w-5 h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>{oauthLoading ? 'กำลังเปิด Discord...' : 'เข้าสู่ระบบด้วย Discord'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
