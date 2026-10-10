import { DateRangePreset, MailFilter } from './mail';

export type AIActionType = 
  | 'search_emails'
  | 'apply_filter'
  | 'open_email'
  | 'navigate'
  | 'clear_filters'
  | 'none';

export interface AIActionPayload {
  type: AIActionType;
  query?: string;
  view?: 'inbox' | 'sent';
  emailId?: string;
  targetSender?: string;
  targetSubject?: string;
  filter?: Partial<MailFilter>;
}

export interface AIProcessRequest {
  prompt: string;
  context?: {
    currentView?: string;
    selectedEmailId?: string | null;
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
