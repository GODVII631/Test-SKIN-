import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SkinSubmission } from '../types';
import { createSkinSubmissionInFirestore } from '../lib/db';
import { dispatchDiscordNotification } from '../lib/discord';
import {
  Upload,
  X,
  FileCheck,
  Package,
  AlertCircle,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  FileCode,
} from 'lucide-react';

interface SkinSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SkinSubmissionModal: React.FC<SkinSubmissionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();

  const [icName, setIcName] = useState(currentUser?.icName || '');
  const [skinTitle, setSkinTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    data: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const quotaRemaining = Math.max(0, currentUser.skinQuota - currentUser.submittedSkinsCount);
  const isQuotaFull = currentUser.submittedSkinsCount >= currentUser.skinQuota;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check extension
    if (!file.name.endsWith('.mcaddon') && !file.name.endsWith('.zip') && !file.name.endsWith('.png')) {
      setError('กรุณาเลือกไฟล์นามสกุล .mcaddon, .zip หรือ .png');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        size: file.size,
        data: reader.result as string,
      });
      setError(null);
      if (!skinTitle) {
        setSkinTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseSampleAddon = () => {
    // Generate a dummy valid sample .mcaddon
    const sampleName = `Knight_Skin_Pack_${currentUser.username}.mcaddon`;
    setSelectedFile({
      name: sampleName,
      size: 154200,
      data: 'data:application/octet-stream;base64,UEsDBBQAAAAIAAAAAAAAAAAAAAAAAAAAAAA=',
    });
    setSkinTitle('ชุดเกราะอัศวินหน่วยรบพิเศษ (Special Knight Pack)');
    setDescription('สกินคัสตอม Minecraft Bedrock 64x64 สำหรับเล่นโรลเพลย์ในเซิร์ฟเวอร์');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentUser.isBlocked) {
      setError('บัญชีของคุณถูกระงับสิทธิ์การส่งไฟล์สกิน');
      return;
    }

    if (isQuotaFull) {
      setError(`โควตาสกินของคุณเต็มแล้ว (${currentUser.submittedSkinsCount}/${currentUser.skinQuota} สกิน) กรุณาติดต่อ Admin เพื่อขอเพิ่มโควตา`);
      return;
    }

    if (!icName.trim()) {
      setError('กรุณาระบุชื่อ IC (ชื่อตัวละครใน Minecraft / In-Character Name)');
      return;
    }

    if (!selectedFile) {
      setError('กรุณาเลือกหรืออัปโหลดไฟล์ .mcaddon');
      return;
    }

    setLoading(true);

    try {
      // 1. Write to Firestore
      const newSubmission = await createSkinSubmissionInFirestore(
        {
          discordUserId: currentUser.id,
          discordUsername: currentUser.username,
          discordAvatar: currentUser.avatar,
          discordId: currentUser.discordId,
          icName: icName.trim(),
          skinTitle: skinTitle.trim() || selectedFile.name,
          description: description.trim(),
          addonFileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileData: selectedFile.data,
        },
        currentUser
      );

      // 2. Dispatch live Discord notification
      await dispatchDiscordNotification({
        webhookUrl: currentUser.notificationSettings?.webhookUrl,
        sub: newSubmission,
        user: {
          ...currentUser,
          submittedSkinsCount: currentUser.submittedSkinsCount + 1,
        },
        eventType: 'new_submission',
      });

      setLoading(false);
      onClose();
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err?.message || 'เกิดข้อผิดพลาดในการส่งไฟล์');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-zinc-700 shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                ส่งไฟล์ Addon สกิน Minecraft (.mcaddon)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                ข้อมูลจะถูกบันทึกเข้าระบบหลังบ้าน และแจ้งเตือนเข้าห้อง Discord ทันที
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

        {/* Quota Status Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-zinc-300">
              โควตาการส่งสกินของบัญชีนี้:
            </span>
            <span
              className={`font-black text-sm ${
                isQuotaFull
                  ? 'text-rose-500'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              ส่งแล้ว {currentUser.submittedSkinsCount} / {currentUser.skinQuota} สกิน
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isQuotaFull ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(100, (currentUser.submittedSkinsCount / Math.max(1, currentUser.skinQuota)) * 100)}%`,
              }}
            />
          </div>

          <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
            <span>
              {isQuotaFull
                ? '⚠️ โควตาเต็มแล้ว (กรุณาแจ้ง Admin เพื่อขอเปิดเพิ่ม)'
                : `เหลือส่งได้อีก ${quotaRemaining} สกิน`}
            </span>
            <span className="text-[10px] text-[#5865F2] font-semibold">
              Admin ควบคุมโควตารายบุคคล
            </span>
          </div>
        </div>

        {/* Discord Account Info */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/20">
          <img
            src={currentUser.avatar}
            alt={currentUser.username}
            className="w-10 h-10 rounded-full object-cover border border-[#5865F2]/40"
          />
          <div className="overflow-hidden flex-1">
            <div className="text-xs text-slate-500 dark:text-zinc-400">
              บัญชี Discord ที่เชื่อมต่อ (ดึงอัตโนมัติ):
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
              {currentUser.globalName || currentUser.username} (@{currentUser.username})
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-[#5865F2] font-bold">
              ID: {currentUser.discordId.slice(0, 8)}...
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* In-Character (IC) Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#5865F2]" />
              <span>ขอชื่อ IC (ชื่อตัวละครใน Minecraft / In-Character Name) *</span>
            </label>
            <input
              type="text"
              required
              disabled={isQuotaFull}
              value={icName}
              onChange={(e) => setIcName(e.target.value)}
              placeholder="เช่น Worawat_J, Steve_Gamer, Officer_Ken"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#5865F2]/50 disabled:opacity-50"
            />
          </div>

          {/* Skin Title / Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              ชื่อสกิน / ชุดแอดออน *
            </label>
            <input
              type="text"
              required
              disabled={isQuotaFull}
              value={skinTitle}
              onChange={(e) => setSkinTitle(e.target.value)}
              placeholder="เช่น สกินทหารหน่วยรบพิเศษ หรือ สกินช่างกล"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]/50 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              รายละเอียดเพิ่มเติมเกี่ยวกับสกิน
            </label>
            <textarea
              rows={2}
              disabled={isQuotaFull}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุ เช่น สกินแบบ 64x64 หรือ 128x128, สำหรับหน่วยงานใดในเซิร์ฟเวอร์..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]/50 disabled:opacity-50"
            />
          </div>

          {/* File Upload Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                <span>ไฟล์ Addon สกิน (.mcaddon / .zip) *</span>
              </label>
              <button
                type="button"
                onClick={handleUseSampleAddon}
                className="text-[11px] text-[#5865F2] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>ใช้ไฟล์ .mcaddon ตัวอย่างทดสอบ</span>
              </button>
            </div>

            <div className="relative border-2 border-dashed border-slate-200 dark:border-zinc-700 hover:border-[#5865F2] dark:hover:border-[#5865F2] rounded-2xl p-5 text-center transition cursor-pointer bg-slate-50/50 dark:bg-[#1e1f22]/50">
              <input
                type="file"
                accept=".mcaddon,.zip,.png"
                disabled={isQuotaFull}
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">
                      {selectedFile.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB • พร้อมส่งเข้าหลังบ้าน
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                  </div>
                  <div className="text-[11px] text-slate-400">
                    รองรับไฟล์ .mcaddon, .zip (สูงสุด 25MB)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading || isQuotaFull || !selectedFile}
              className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#5865F2] hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/25 transition cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'กำลังส่งและแจ้งเตือนบอท...' : 'ส่งไฟล์สกินไปยังหลังบ้าน'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
