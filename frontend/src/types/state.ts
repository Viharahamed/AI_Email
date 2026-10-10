import { Email, MailFilter, ComposeState } from './mail';

export type ActiveView = 'inbox' | 'sent' | 'email-detail' | 'compose';

export interface AuthState {
  authenticated: boolean;
  user?: {
    name?: string;
    email?: string;
    picture?: string;
  } | null;
  provider: 'gmail' | 'mock';
}

export interface ApplicationState {
  currentView: ActiveView;
  selectedEmailId: string | null;
  currentEmail: Email | null;
  emails: Email[];
  filters: MailFilter;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  composeState: ComposeState;
  isAssistantOpen: boolean;
  auth: AuthState;
}

export interface ApplicationActions {
  setCurrentView: (view: ActiveView) => void;
  selectEmail: (emailId: string | null) => void;
  setFilters: (filters: Partial<MailFilter>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  fetchInbox: () => Promise<void>;
  fetchSent: () => Promise<void>;
  searchEmails: (query: string) => Promise<void>;
  openEmail: (emailId: string) => Promise<void>;
  openCompose: (initial?: Partial<ComposeState>) => void;
  closeCompose: () => void;
  updateComposeForm: (updates: Partial<ComposeState>) => void;
  sendEmail: () => Promise<boolean>;
  toggleAssistant: () => void;
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}
