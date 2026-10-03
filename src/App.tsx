import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { SubmissionsList } from './components/SubmissionsList';
import { AdminQuotaManagement } from './components/AdminQuotaManagement';
import { SkinSubmissionModal } from './components/SkinSubmissionModal';
import { EditSkinModal } from './components/EditSkinModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { DiscordBotConsole } from './components/DiscordBotConsole';
import { LoginModal } from './components/LoginModal';
import { MobileNavigation } from './components/MobileNavigation';
import { NotificationToast, ToastAlert } from './components/NotificationToast';
import { SkinSubmission, BotLog } from './types';
import {
  subscribeToSubmissions,
  subscribeToBotLogs,
  updateSkinSubmissionStatus,
} from './lib/db';
import { dispatchDiscordNotification, playNotificationSound } from './lib/discord';

function AuthenticatedApp() {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  const [submissions, setSubmissions] = useState<SkinSubmission[]>([]);
  const [botLogs, setBotLogs] = useState<BotLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & view state
  const [isNewSubOpen, setIsNewSubOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SkinSubmission | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isBotConsoleOpen, setIsBotConsoleOpen] = useState(false);
  const [selectedSubForEmbed, setSelectedSubForEmbed] = useState<SkinSubmission | null>(null);

  // Admin view toggle (strictly restricted to admins)
  const [isAdminView, setIsAdminView] = useState(isAdmin);
  const [mobileTab, setMobileTab] = useState<'submissions' | 'admin'>('submissions');

  // Keep admin view in sync with role
  useEffect(() => {
    if (!isAdmin) {
      setIsAdminView(false);
      setMobileTab('submissions');
      setIsBotConsoleOpen(false);
    }
  }, [isAdmin]);

  // Real-time toast alerts
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const isFirstLoad = useRef(true);

  // Listen to Firestore real-time updates with role-based query isolation
  useEffect(() => {
    const unsubSubs = subscribeToSubmissions(currentUser, (subList) => {
      if (!isFirstLoad.current && subList.length > submissions.length) {
        const newest = subList[0];
        if (newest) {
          const newToast: ToastAlert = {
            id: `toast_${Date.now()}`,
            title: `🎮 สกินใหม่: ${newest.addonFileName}`,
            message: isAdmin
              ? `IC: ${newest.icName} โดย @${newest.discordUsername} ส่งเข้าหลังบ้านแล้ว`
              : `สกิน ${newest.addonFileName} ของ IC [${newest.icName}] ถูกส่งเข้าระบบเรียบร้อย`,
            type: 'bot',
          };
          setToasts((prev) => [newToast, ...prev.slice(0, 3)]);

          if (currentUser.notificationSettings?.soundEnabled) {
            playNotificationSound();
          }
        }
      }

      setSubmissions(subList);
      setLoading(false);
      isFirstLoad.current = false;
    });

    const unsubBot = subscribeToBotLogs((logs) => {
      setBotLogs(logs);
    });

    return () => {
      unsubSubs();
      unsubBot();
    };
  }, [currentUser.id, currentUser.role, currentUser.notificationSettings?.soundEnabled, submissions.length, isAdmin]);

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSelectSubForEmbed = (sub: SkinSubmission) => {
    if (!isAdmin) return;
    setSelectedSubForEmbed(sub);
    setIsBotConsoleOpen(true);
  };

  const handleUpdateStatus = async (
    sub: SkinSubmission,
    newStatus: 'approved' | 'rejected',
    note: string
  ) => {
    if (!isAdmin) {
      alert('คุณไม่มีสิทธิ์ในการเปลี่ยนสถานะการตรวจสอบ');
      return;
    }

    try {
      await updateSkinSubmissionStatus(
        sub.id,
        newStatus,
        note,
        currentUser.globalName || currentUser.username
      );

      // Trigger automatic Discord Bot notification for the status change
      const updatedSub = { ...sub, status: newStatus, adminNote: note };
      await dispatchDiscordNotification({
        webhookUrl: currentUser.notificationSettings?.webhookUrl,
        sub: updatedSub,
        user: currentUser,
        eventType: 'status_change',
      });

      setToasts((prev) => [
        {
          id: `toast_${Date.now()}`,
          title: `สถานะสกิน: ${newStatus === 'approved' ? 'อนุมัติเรียบร้อย' : 'ไม่อนุมัติ'}`,
          message: `สกินของ IC [${sub.icName}] อัปเดตและแจ้งเตือน Discord แล้ว`,
          type: 'bot',
        },
        ...prev.slice(0, 2),
      ]);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const handleEditCompleted = (updatedSub: SkinSubmission) => {
    setToasts((prev) => [
      {
        id: `toast_${Date.now()}`,
        title: 'อัปเดตสกินสำเร็จ',
        message: `แก้ไขข้อมูลและส่งแจ้งเตือนบอท Discord สำหรับ [${updatedSub.addonFileName}] เรียบร้อย`,
        type: 'bot',
      },
      ...prev.slice(0, 2),
    ]);
  };

  const handleDeleteCompleted = () => {
    setToasts((prev) => [
      {
        id: `toast_${Date.now()}`,
        title: 'ลบรายการสกินสำเร็จ',
        message: 'ลบสกินและคืนสิทธิ์โควตาให้บัญชีของคุณเรียบร้อยแล้ว',
        type: 'bot',
      },
      ...prev.slice(0, 2),
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1e1f22] text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        onOpenNewSubmission={() => setIsNewSubOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenBotConsole={() => {
          if (isAdmin) setIsBotConsoleOpen(true);
        }}
        onToggleAdminView={() => {
          if (isAdmin) setIsAdminView(!isAdminView);
        }}
        isAdminView={isAdmin && isAdminView}
        botAlertCount={botLogs.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-24 md:pb-12">
        {/* Dashboard Stats & Quota Banner */}
        <DashboardStats
          submissions={submissions}
          currentUser={currentUser}
          onOpenNewSubmission={() => setIsNewSubOpen(true)}
          onOpenBotConsole={() => {
            if (isAdmin) setIsBotConsoleOpen(true);
          }}
          onToggleAdminView={() => {
            if (isAdmin) setIsAdminView(!isAdminView);
          }}
          isAdminView={isAdmin && isAdminView}
          botAlertCount={botLogs.length}
        />

        {/* Admin Quota Management (STRICTLY for Admins only) */}
        {isAdmin && isAdminView && (
          <AdminQuotaManagement />
        )}

        {/* Submissions List:
            - Regular member sees ONLY their own submission history with edit options
            - Admin sees all server submissions with review/quota options
        */}
        <SubmissionsList
          submissions={submissions}
          currentUser={currentUser}
          onUpdateStatus={handleUpdateStatus}
          onSelectSubForEmbed={handleSelectSubForEmbed}
          onEditSub={(sub) => setEditingSub(sub)}
          onOpenNewSubmission={() => setIsNewSubOpen(true)}
        />
      </main>

      {/* Mobile Floating Bottom Bar */}
      <MobileNavigation
        activeTab={mobileTab}
        setActiveTab={(tab) => {
          if (tab === 'admin' && !isAdmin) return;
          setMobileTab(tab);
          if (tab === 'admin') setIsAdminView(true);
        }}
        onOpenNewSubmission={() => setIsNewSubOpen(true)}
        onOpenBotConsole={() => {
          if (isAdmin) setIsBotConsoleOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        botAlertCount={botLogs.length}
      />

      {/* Modals */}
      <SkinSubmissionModal
        isOpen={isNewSubOpen}
        onClose={() => setIsNewSubOpen(false)}
      />

      {/* Edit Skin Modal (Allows editing IC name, description, or replacing .mcaddon file) */}
      <EditSkinModal
        isOpen={Boolean(editingSub)}
        submission={editingSub}
        onClose={() => setEditingSub(null)}
        onUpdated={handleEditCompleted}
        onDeleted={handleDeleteCompleted}
      />

      <NotificationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Admin Discord Bot Console (Guarded) */}
      {isAdmin && (
        <DiscordBotConsole
          isOpen={isBotConsoleOpen}
          onClose={() => {
            setIsBotConsoleOpen(false);
            setSelectedSubForEmbed(null);
          }}
          selectedSub={selectedSubForEmbed}
        />
      )}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      {/* Real-time Toast Banner Alerts */}
      <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

function MainApp() {
  const { currentUser } = useAuth();

  // If user is not logged in, enforce login first before showing skin portal
  if (!currentUser) {
    return <LoginScreen />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
