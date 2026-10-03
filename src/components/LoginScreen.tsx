import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, ShieldCheck, Sun, Moon, Lock, AlertCircle, Crown, FileCode, Bell, Layers } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { theme, toggleTheme, signIn } = useAuth();
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const handleRealDiscordOAuth = async () => {
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
    <div className="min-h-screen bg-[#0f1012] text-zinc-100 flex flex-col font-sans relative overflow-hidden selection:bg-[#5865F2] selection:text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-[#5865F2]/20 via-emerald-500/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#5865F2]/10 blur-3xl pointer-events-none -z-10" />
      <header className="w-full border-b border-zinc-800/80 bg-black/40 backdrop-blur-md px-3.5 sm:px-8 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-[#5865F2] flex items-center justify-center text-white"><Box className="w-5 h-5" /></div><div className="min-w-0"><div className="font-black text-sm tracking-tight text-white">SkinAddon</div><p className="text-[10px] text-zinc-400 truncate hidden xs:block">ระบบส่งสกินและแจ้งเตือน Discord</p></div></div>
        <button onClick={toggleTheme} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 min-h-[40px] min-w-[40px] flex items-center justify-center" title="สลับโหมดสี">{theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}</button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6 sm:space-y-8 my-auto">
        <div className="text-center space-y-3 max-w-2xl px-2"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#5865F2]/15 text-[#7983f5] border border-[#5865F2]/30"><Lock className="w-3.5 h-3.5" /><span>เข้าสู่ระบบด้วยบัญชี Discord จริงก่อนส่งสกิน</span></div><h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">เข้าสู่ระบบด้วย <span className="text-[#5865F2]">Discord</span><br />เพื่อส่งไฟล์สกิน Minecraft</h1><p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl mx-auto">เชื่อมต่อบัญชี Discord จริงของคุณเพื่อส่งไฟล์สกิน <strong className="text-zinc-200">.mcaddon</strong> ระบบจะบันทึกลงฐานข้อมูลและส่งแจ้งเตือนบอทเข้า Discord ทันที</p></div>
        <div className="w-full max-w-md mx-auto space-y-3">{oauthError && <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5"><AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{oauthError}</span></div>}<button onClick={handleRealDiscordOAuth} disabled={oauthLoading} className="w-full min-h-[56px] sm:min-h-[60px] px-6 py-3.5 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-black text-base sm:text-lg flex items-center justify-center gap-3"> <ShieldCheck className="w-6 h-6" /><span>{oauthLoading ? 'กำลังไปยัง Discord...' : 'เข้าสู่ระบบด้วย Discord'}</span></button><div className="flex items-center justify-center px-1 text-xs text-zinc-400"><span className="flex items-center gap-1 text-[11px]"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /><span>ตั้งค่า OAuth บนเซิร์ฟเวอร์อย่างปลอดภัย</span></span></div></div>
        <div className="w-full max-w-xl space-y-3"><div className="p-4 rounded-2xl bg-indigo-950/30 border border-[#5865F2]/30 space-y-2"><div className="flex items-center gap-2 text-[#7983f5] text-xs font-black"><Crown className="w-4 h-4 text-amber-400" /><span>การกำหนดสิทธิ์ผู้ดูแลระบบ</span></div><p className="text-xs text-zinc-300 leading-relaxed">สิทธิ์ Admin ถูกกำหนดฝั่งเซิร์ฟเวอร์เท่านั้น</p></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left text-xs"><div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"><div className="font-bold text-white flex items-center gap-1.5 text-[11px]"><FileCode className="w-3.5 h-3.5 text-emerald-400" /><span>รองรับ .mcaddon</span></div><p className="text-[11px] text-zinc-400">อัปโหลด Skin Pack สำหรับ Bedrock</p></div><div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"><div className="font-bold text-white flex items-center gap-1.5 text-[11px]"><Bell className="w-3.5 h-3.5 text-[#7983f5]" /><span>แจ้งเตือนอัตโนมัติ</span></div><p className="text-[11px] text-zinc-400">แจ้งเตือนเมื่อมีการส่งหรืออนุมัติ</p></div><div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"><div className="font-bold text-white flex items-center gap-1.5 text-[11px]"><Layers className="w-3.5 h-3.5 text-amber-400" /><span>ระบบโควตา</span></div><p className="text-[11px] text-zinc-400">ป้องกันการส่งสแปม</p></div></div></div>
      </main>
      <footer className="w-full border-t border-zinc-800/80 bg-black/40 py-4 text-center text-xs text-zinc-500"><p>Discord SkinAddon Submission System</p></footer>
    </div>
  );
};
