export interface Email {
  id: string;
  threadId?: string;
  sender: {
    name: string;
    email: string;
  };
  recipient: {
    name: string;
    email: string;
  };
  subject: string;
  snippet: string;
  body: string;
  date: string;
  isRead: boolean;
  folder: 'inbox' | 'sent' | 'trash' | 'drafts';
  labels?: string[];
}

export type DateRangePreset = 'today' | '7days' | '10days' | 'this_week' | 'this_month' | 'all';

export interface MailFilter {
  sender?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  unreadOnly?: boolean;
  dateRange?: DateRangePreset;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
}

export interface ComposeState {
  to: string;
  subject: string;
  body: string;
  isOpen: boolean;
  mode: 'new' | 'reply' | 'forward';
  replyToEmailId?: string;
}
