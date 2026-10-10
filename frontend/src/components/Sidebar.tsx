import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Inbox,
  Send,
  PenSquare,
  Sparkles,
  LogOut,
  LogIn,
  Star,
  FileText,
  Trash2,
  MoreHorizontal,
  Plus,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const {
    currentView,
    setCurrentView,
    openCompose,
    emails,
    isAssistantOpen,
    toggleAssistant,
    auth,
    loginWithGoogle,
    logoutUser
  } = useApp();

  const unreadCount = emails.filter(e => e.folder === 'inbox' && !e.isRead).length;
  const userName = auth.user?.name || (auth.user?.email ? auth.user.email.split('@')[0] : 'Mike Manson');
  const userEmail = auth.user?.email || 'iammike@gmail.com';
  const avatarLetter = userName.charAt(0).toUpperCase();

  // Handle Escape key to close mobile sidebar drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpenMobile && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpenMobile, onCloseMobile]);

  const sidebarContent = (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-full p-5 select-none font-sans flex-shrink-0 rounded-l-2xl">
      <div className="space-y-6 overflow-y-auto pr-1">
        {/* User Profile & Gmail Account Info */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {avatarLetter}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  auth.authenticated ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-slate-800 truncate leading-tight">{userName}</h3>
              <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              aria-label="Close sidebar navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* OAuth Authentication Status Action */}
        <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                auth.authenticated ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              {auth.provider === 'gmail' ? 'Gmail OAuth' : 'Mock Mode'}
            </span>
          </div>
          {auth.authenticated ? (
            <button
              onClick={logoutUser}
              title="Disconnect Gmail Account"
              aria-label="Disconnect Gmail Account"
              className="text-rose-500 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={loginWithGoogle}
              title="Connect Gmail OAuth"
              aria-label="Connect Gmail OAuth"
              className="text-indigo-600 hover:text-indigo-700 font-semibold text-[11px] flex items-center space-x-1 hover:underline cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connect</span>
            </button>
          )}
        </div>

        {/* Primary Mail Navigation */}
        <nav className="space-y-1" aria-label="Mailbox sections">
          <button
            onClick={() => {
              setCurrentView('inbox');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              currentView === 'inbox'
                ? 'bg-sky-50 text-sky-600 border-l-4 border-sky-500 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Inbox className={`w-4 h-4 ${currentView === 'inbox' ? 'text-sky-500' : 'text-slate-400'}`} />
              <span>Inbox</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-[#FF5252] text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            disabled
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:bg-slate-50 transition-all cursor-not-allowed opacity-70"
          >
            <div className="flex items-center space-x-3">
              <Star className="w-4 h-4 text-slate-400" />
              <span>Flagged</span>
            </div>
          </button>

          <button
            disabled
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:bg-slate-50 transition-all cursor-not-allowed opacity-70"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Draft</span>
            </div>
          </button>

          <button
            onClick={() => {
              setCurrentView('sent');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              currentView === 'sent'
                ? 'bg-sky-50 text-sky-600 border-l-4 border-sky-500 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Send className={`w-4 h-4 ${currentView === 'sent' ? 'text-sky-500' : 'text-slate-400'}`} />
              <span>Sent</span>
            </div>
          </button>

          <button
            disabled
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:bg-slate-50 transition-all cursor-not-allowed opacity-70"
          >
            <div className="flex items-center space-x-3">
              <Trash2 className="w-4 h-4 text-slate-400" />
              <span>Trash</span>
            </div>
          </button>

          <button
            disabled
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:bg-slate-50 transition-all cursor-not-allowed opacity-70"
          >
            <div className="flex items-center space-x-3">
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
              <span>More</span>
            </div>
          </button>
        </nav>

        {/* Folders Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-bold text-slate-400 tracking-wider">Folders</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold flex items-center space-x-0.5">
              <Plus className="w-2.5 h-2.5" />
              <span>Add</span>
            </span>
          </div>

          <div className="space-y-1 text-xs font-medium text-slate-600">
            <div className="flex items-center space-x-3 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Office</span>
            </div>
            <div className="flex items-center space-x-3 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Personal</span>
            </div>
            <div className="flex items-center space-x-3 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Freelance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer: Compose Button */}
      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={() => {
            openCompose({ mode: 'new' });
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full py-3 px-4 rounded-2xl coral-btn text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 group cursor-pointer"
        >
          <PenSquare className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span>Compose</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />
          <div className="relative z-10 h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
