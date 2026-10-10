import { Email, MailFilter, SendEmailPayload } from '../types/mail';

export interface IMailService {
  getInbox(filters?: MailFilter): Promise<Email[]>;
  getSent(filters?: MailFilter): Promise<Email[]>;
  getEmail(id: string): Promise<Email | null>;
  searchEmails(query: string, filters?: MailFilter): Promise<Email[]>;
  sendEmail(payload: SendEmailPayload): Promise<Email>;
  markAsRead(id: string): Promise<boolean>;
}
