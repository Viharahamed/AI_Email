import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Email, MailFilter, ComposeState } from '../types/mail';
import { ApplicationState, ApplicationActions, ActiveView, AuthState } from '../types/state';
import {
  fetchInboxApi,
  fetchSentApi,
  fetchEmailDetailApi,
  searchEmailsApi,
  sendEmailApi,
  fetchAuthStatusApi,
  getGoogleAuthUrlApi,
  logoutApi
} from '../services/api';

type AppContextType = ApplicationState & ApplicationActions;

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialComposeState: ComposeState = {
  to: '',
  subject: '',
  body: '',
  isOpen: false,
  mode: 'new'
};

const initialFilters: MailFilter = {
  unreadOnly: false,
  sender: '',
  keyword: ''
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ActiveView>('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<Email | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [filters, setFiltersState] = useState<MailFilter>(initialFilters);
  const [searchQuery, setSearchQueryState] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [composeState, setComposeState] = useState<ComposeState>(initialComposeState);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [auth, setAuth] = useState<AuthState>({ authenticated: false, provider: 'mock' });

  const checkAuthStatus = async () => {
    try {
      const status = await fetchAuthStatusApi();
      setAuth(status);
    } catch (err: any) {
      console.warn('Could not check auth status:', err);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const url = await getGoogleAuthUrlApi();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Failed to start Google Login');
    }
  };

  const logoutUser = async () => {
    try {
      await logoutApi();
      await checkAuthStatus();
      if (currentView === 'inbox') fetchInbox();
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    }
  };

  const fetchInbox = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchInboxApi(filters);
      setEmails(data);
    } catch (err: any) {
      setError(err.message || 'Error loading inbox');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSentApi(filters);
      setEmails(data);
    } catch (err: any) {
      setError(err.message || 'Error loading sent emails');
    } finally {
      setIsLoading(false);
    }
  };

  const searchEmails = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      setSearchQueryState(query);
      const data = await searchEmailsApi(query, filters);
      setEmails(data);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const openEmail = async (emailId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      setSelectedEmailId(emailId);
      const detail = await fetchEmailDetailApi(emailId);
      setCurrentEmail(detail);
      setCurrentView('email-detail');
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isRead: true } : e));
    } catch (err: any) {
      setError(err.message || 'Failed to open email');
    } finally {
      setIsLoading(false);
    }
  };

  const selectEmail = (emailId: string | null) => {
    setSelectedEmailId(emailId);
  };

  const setFilters = (newFilters: Partial<MailFilter>) => {
    setFiltersState(prev => {
      const updated = { ...prev, ...newFilters };
      if (currentView === 'inbox') {
        fetchInboxApi(updated).then(setEmails).catch(e => setError(e.message));
      } else if (currentView === 'sent') {
        fetchSentApi(updated).then(setEmails).catch(e => setError(e.message));
      }
      return updated;
    });
  };

  const clearFilters = () => {
    setFiltersState(initialFilters);
    setSearchQueryState('');
    if (currentView === 'inbox') fetchInbox();
    else if (currentView === 'sent') fetchSent();
  };

  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
    if (query.trim()) {
      searchEmails(query);
    } else {
      if (currentView === 'inbox') fetchInbox();
      else if (currentView === 'sent') fetchSent();
    }
  };

  const openCompose = (initial?: Partial<ComposeState>) => {
    setComposeState({
      to: initial?.to || '',
      subject: initial?.subject || '',
      body: initial?.body || '',
      isOpen: true,
      mode: initial?.mode || 'new',
      replyToEmailId: initial?.replyToEmailId
    });
  };

  const closeCompose = () => {
    setComposeState(prev => ({ ...prev, isOpen: false }));
  };

  const updateComposeForm = (updates: Partial<ComposeState>) => {
    setComposeState(prev => ({ ...prev, ...updates }));
  };

  const sendEmail = async (): Promise<boolean> => {
    if (!composeState.to || !composeState.subject || !composeState.body) {
      setError('Please fill in all fields before sending.');
      return false;
    }
    setIsLoading(true);
    setError(null);
    try {
      await sendEmailApi({
        to: composeState.to,
        subject: composeState.subject,
        body: composeState.body
      });
      closeCompose();
      if (currentView === 'sent') {
        fetchSent();
      }
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAssistant = () => {
    setIsAssistantOpen(prev => !prev);
  };

  // Initial auth status check
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // View switcher effect
  useEffect(() => {
    if (currentView === 'inbox') {
      fetchInbox();
    } else if (currentView === 'sent') {
      fetchSent();
    }
  }, [currentView, auth.authenticated]);

  const handleSetCurrentView = (view: ActiveView) => {
    setCurrentView(view);
    if (view === 'inbox' || view === 'sent') {
      setSelectedEmailId(null);
      setCurrentEmail(null);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        selectedEmailId,
        currentEmail,
        emails,
        filters,
        searchQuery,
        isLoading,
        error,
        composeState,
        isAssistantOpen,
        auth,
        setCurrentView: handleSetCurrentView,
        selectEmail,
        setFilters,
        clearFilters,
        setSearchQuery,
        fetchInbox,
        fetchSent,
        searchEmails,
        openEmail,
        openCompose,
        closeCompose,
        updateComposeForm,
        sendEmail,
        toggleAssistant,
        loginWithGoogle,
        logoutUser,
        checkAuthStatus
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
