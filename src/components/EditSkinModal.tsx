import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SkinSubmission } from '../types';
import {
  updateSkinSubmissionInFirestore,
  deleteSkinSubmissionFromFirestore,
} from '../lib/db';
import { dispatchDiscordNotification } from '../lib/discord';
import {
  X,
  Upload,
  FileCode,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface EditSkinModalProps {
  isOpen: boolean;
  submission: SkinSubmission | null;
  onClose: () => void;
  onUpdated?: (updatedSub: SkinSubmission) => void;
  onDeleted?: (deletedSubId: string) => void;
}

export const EditSkinModal: React.FC<EditSkinModalProps> = ({
  isOpen,
  submission,
  onClose,
  onUpdated,
  onDeleted,
}) => {
  const { currentUser } = useAuth();

  const [icName, setIcName] = useState('');
  const [skinTitle, setSkinTitle] = useState('');
  const [description, setDescription] = useState('');

  // File replacement state
  const [isReplacingFile, setIsReplacingFile] = useState(false);
  const [newFile, setNewFile] = useState<{
    name: string;
    size: number;
    data: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (submission) {
      setIcName(submission.icName || '');
      setSkinTitle(submission.skinTitle || '');
      setDescription(submission.description || '');
      setIsReplacingFile(false);
      setNewFile(null);
      setError(null);
      setConfirmDelete(false);
    }
  }, [submission]);

  if (!isOpen || !submission || !currentUser) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.mcaddon') && !file.name.endsWith('.zip') && !file.name.endsWith('.png')) {
      setError('กรุณาเลือกไฟล์นามสกุล .mcaddon, .zip หรือ .png');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewFile({
        name: file.name,
        size: file.size,
        data: reader.result as string,
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUseSampleNewFile = () => {
    const sampleName = `Updated_${submission.addonFileName || 'skin.mcaddon'}`;
    setNewFile({
      name: sampleName,
      size: 172800,
      data: 'data:application/octet-stream;base64,UEsDBBQAAAAIAAAAAAAAAAAAAAAAAAAAAAA=',
    });
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!icName.trim()) {
      setError('กรุณาระบุชื่อ IC (In-Character Name)');
      return;
    }

    if (!skinTitle.trim()) {
      setError('กรุณาระบุชื่อชุดสกิน');
      return;
    }

    setLoading(true);

    try {
      const updateData: {
        icName: string;
        skinTitle: string;
        description: string;
        addonFileName?: string;
        fileSize?: number;
        fileData?: string;
      } = {
        icName: icName.trim(),
        skinTitle: skinTitle.trim(),
        description: description.trim(),
      };

      if (isReplacingFile && newFile) {
        updateData.addonFileName = newFile.name;
        updateData.fileSize = newFile.size;
        updateData.fileData = newFile.data;
      }

      const updatedSub = await updateSkinSubmissionInFirestore(
        submission.id,
        updateData,
        currentUser
      );

      // Trigger automatic Discord notification for the edit
      await dispatchDiscordNotification({
        webhookUrl: currentUser.notificationSettings?.webhookUrl,
        sub: updatedSub,
        user: currentUser,
        eventType: 'updated_submission',
      });

      if (onUpdated) {
        onUpdated(updatedSub);
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving edited submission:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกการแก้ไข');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteSkinSubmissionFromFirestore(submission.id, currentUser);
      if (onDeleted) {
        onDeleted(submission.id);
      }
      onClose();
    } catch (err: any) {
      console.error('Error deleting submission:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการลบ');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-zinc-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5865F2]/10 text-[#5865F2] flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                แก้ไขการส่งไฟล์ Addon สกิน
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                แก้ไขข้อมูลชื่อ IC, รายละเอียดสกิน หรืออัปโหลดไฟล์ .mcaddon ใหม่
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Status Note */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-zinc-700/80 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-zinc-300 font-medium">
              สถานะปัจจุบันของสกินนี้:
            </span>
            <span
              className={`font-bold px-2.5 py-0.5 rounded-full ${
                submission.status === 'approved'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : submission.status === 'rejected'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}
            >
              {submission.status === 'approved'
                ? '✅ อนุมัติแล้ว'
                : submission.status === 'rejected'
                ? '❌ ไม่อนุมัติ'
                : '⏳ รอดำเนินการ'}
            </span>
          </div>

          {submission.adminNote && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
              <span className="font-bold">หมายเหตุเดิมจาก Admin:</span> {submission.adminNote}
            </div>
          )}

          {/* IC Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center justify-between">
              <span>ชื่อ IC (Minecraft In-Character Name) *</span>
              <span className="text-[11px] text-slate-400 font-normal">ชื่อตัวละครในเกม</span>
            </label>
            <input
              type="text"
              required
              value={icName}
              onChange={(e) => setIcName(e.target.value)}
              placeholder="เช่น Somchai_Kaiser, Kuro_Warrior"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
            />
          </div>

          {/* Skin Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              ชื่อชุดสกิน / สกินแพ็ค (Skin Title) *
            </label>
            <input
              type="text"
              required
              value={skinTitle}
              onChange={(e) => setSkinTitle(e.target.value)}
              placeholder="เช่น ชุดเกราะอัศวินทองคำ, เสื้อฮู้ดเรดการ์ด"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              รายละเอียดเพิ่มเติมเกี่ยวกับสกิน
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุธีม หรือบทบาท เช่น สกินประจำตำแหน่งหัวหน้าหน่วยอัศวิน..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
            />
          </div>

          {/* Addon File Section */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                ไฟล์แอดออนสกิน (.mcaddon)
              </label>
              {!isReplacingFile ? (
                <button
                  type="button"
                  onClick={() => setIsReplacingFile(true)}
                  className="text-xs font-bold text-[#5865F2] hover:underline cursor-pointer"
                >
                  + อัปโหลดไฟล์ใหม่แทนที่ไฟล์เดิม
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsReplacingFile(false);
                    setNewFile(null);
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
                >
                  ใช้ไฟล์เดิมต่อไป
                </button>
              )}
            </div>

            {!isReplacingFile ? (
              /* Display Current File */
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center flex-shrink-0">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 truncate">
                      {submission.addonFileName}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {(submission.fileSize / 1024).toFixed(1)} KB (ไฟล์ปัจจุบัน)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReplacingFile(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold hover:bg-[#5865F2] hover:text-white transition cursor-pointer"
                >
                  เปลี่ยนไฟล์
                </button>
              </div>
            ) : (
              /* File Replacement Upload Area */
              <div className="space-y-2 animate-in fade-in duration-150">
                <div className="relative border-2 border-dashed border-[#5865F2]/50 hover:border-[#5865F2] rounded-2xl p-5 text-center bg-slate-50 dark:bg-[#1e1f22] transition group">
                  <input
                    type="file"
                    accept=".mcaddon,.zip,.png"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-[#5865F2]/10 text-[#5865F2] flex items-center justify-center group-hover:scale-105 transition">
                      <Upload className="w-5 h-5" />
                    </div>
                    {newFile ? (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>เลือกไฟล์ใหม่แล้ว: {newFile.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          ขนาด {(newFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                          ลากและวางไฟล์ .mcaddon ใหม่ที่นี่ หรือคลิกเพื่อเลือกไฟล์
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          รองรับไฟล์ .mcaddon, .zip หรือ .png
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleUseSampleNewFile}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5865F2] hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ใช้ไฟล์ทดสอบตัวอย่าง (Sample .mcaddon)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
            {/* Delete button */}
            <div>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบรายการสกินนี้</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-sm"
                  >
                    {deleteLoading ? 'กำลังลบ...' : 'ยืนยันการลบสกิน'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ยกเลิก
                  </button>
                </div>
              )}
            </div>

            {/* Save & Cancel */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
