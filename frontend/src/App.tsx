import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { InboxView } from './components/InboxView';
import { SentView } from './components/SentView';
import { EmailDetailView } from './components/EmailDetailView';
import { ComposeModal } from './components/ComposeModal';
import { AssistantSidebar } from './components/AssistantSidebar';
import { FloatingRobotButton } from './components/FloatingRobotButton';

interface MainContentProps {
  onToggleMobileSidebar: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ onToggleMobileSidebar }) => {
  const { currentView, currentEmail } = useApp();

  const isEmailSelected = currentView === 'email-detail' && currentEmail !== null;

  return (
    <div className="flex-1 flex h-full min-w-0 bg-white rounded-2xl md:rounded-r-2xl border border-slate-200/80 shadow-sm overflow-hidden relative">
      {/* Email List & Search Header Column */}
      <div
        className={`flex flex-col h-full bg-white transition-all duration-200 ${
          isEmailSelected
            ? 'w-full md:w-[360px] lg:w-[400px] flex-shrink-0 border-r border-slate-200/80 hidden md:flex'
            : 'w-full flex-1'
        }`}
      >
        <Header onToggleMobileSidebar={onToggleMobileSidebar} />
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
          {currentView === 'sent' ? <SentView /> : <InboxView />}
        </div>
      </div>

      {/* Reading Workspace Pane - Rendered ONLY when an email is selected */}
      {isEmailSelected && (
        <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
          <EmailDetailView />
        </div>
      )}

      <ComposeModal />
    </div>
  );
};

export const AppContainer: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F3F4F8] font-sans text-slate-800 antialiased p-1.5 sm:p-2 md:p-3 gap-2 md:gap-3 relative">
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      <MainContent
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
      />
      <AssistantSidebar />
      <FloatingRobotButton />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContainer />
    </AppProvider>
  );
};

export default App;
