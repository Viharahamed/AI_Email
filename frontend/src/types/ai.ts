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

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionTaken?: string;
  isExecuting?: boolean;
}

export interface AIProcessResponse {
  success: boolean;
  message: string;
  action: AIActionPayload;
  explanation?: string;
}
