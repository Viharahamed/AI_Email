import { DateRangePreset, MailFilter } from './mail';

export type AIActionType = 
  | 'search_emails'
  | 'apply_filter'
  | 'open_email'
  | 'navigate'
  | 'clear_filters'
  | 'draft_email'
  | 'reply_email'
  | 'none';

export interface AIDraftPayload {
  to?: string;
  subject?: string;
  body?: string;
  replyToEmailId?: string;
}

export interface AIActionPayload {
  type: AIActionType;
  query?: string;
  view?: 'inbox' | 'sent';
  emailId?: string;
  targetSender?: string;
  targetSubject?: string;
  filter?: Partial<MailFilter>;
  draft?: AIDraftPayload;
}

export interface SelectedEmailContext {
  id: string;
  sender: {
    name: string;
    email: string;
  };
  recipient?: {
    name: string;
    email: string;
  };
  subject: string;
  date?: string;
  snippet?: string;
  body?: string;
  isTruncated?: boolean;
}

export interface AIProcessRequest {
  prompt: string;
  context?: {
    currentView?: string;
    selectedEmailId?: string | null;
    selectedEmail?: SelectedEmailContext | null;
    filters?: MailFilter;
    searchQuery?: string;
  };
}

export interface AIProcessResponse {
  success: boolean;
  message: string;
  action: AIActionPayload;
  explanation?: string;
}

