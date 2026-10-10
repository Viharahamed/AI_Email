import { google, gmail_v1 } from 'googleapis';
import { IMailService } from './mailService.interface';
import { Email, MailFilter, SendEmailPayload } from '../types/mail';
import { authService } from './authService';

export class GmailMailService implements IMailService {
  private getGmailClient(): gmail_v1.Gmail {
    const auth = authService.getOAuth2Client();
    return google.gmail({ version: 'v1', auth });
  }

  async getInbox(filters?: MailFilter): Promise<Email[]> {
    let q = 'label:INBOX';
    q = this.appendFilterQuery(q, filters);
    return this.fetchMessagesList(q);
  }

  async getSent(filters?: MailFilter): Promise<Email[]> {
    let q = 'label:SENT';
    q = this.appendFilterQuery(q, filters);
    return this.fetchMessagesList(q, 'sent');
  }

  async searchEmails(query: string, filters?: MailFilter): Promise<Email[]> {
    let q = query || '';
    q = this.appendFilterQuery(q, filters);
    return this.fetchMessagesList(q);
  }

  async getEmail(id: string): Promise<Email | null> {
    try {
      const gmail = this.getGmailClient();
      const res = await gmail.users.messages.get({
        userId: 'me',
        id,
        format: 'full'
      });

      if (!res.data) return null;
      return this.parseGmailMessage(res.data);
    } catch (err: any) {
      console.error(`[GmailMailService] Error fetching email ${id}:`, err);
      return null;
    }
  }

  async sendEmail(payload: SendEmailPayload): Promise<Email> {
    const gmail = this.getGmailClient();

    const utf8Subject = `=?utf-8?B?${Buffer.from(payload.subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${payload.to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      payload.body
    ];
    const message = messageParts.join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: payload.threadId
      }
    });

    return {
      id: res.data.id || `sent-${Date.now()}`,
      threadId: res.data.threadId || undefined,
      sender: { name: 'Me', email: 'me' },
      recipient: { name: payload.to.split('@')[0], email: payload.to },
      subject: payload.subject,
      snippet: payload.body.substring(0, 80) + '...',
      body: payload.body,
      date: new Date().toISOString(),
      isRead: true,
      folder: 'sent'
    };
  }

  async markAsRead(id: string): Promise<boolean> {
    try {
      const gmail = this.getGmailClient();
      await gmail.users.messages.modify({
        userId: 'me',
        id,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
      return true;
    } catch (err) {
      console.error(`[GmailMailService] Failed to mark email ${id} as read:`, err);
      return false;
    }
  }

  private appendFilterQuery(baseQuery: string, filters?: MailFilter): string {
    let q = baseQuery;
    if (!filters) return q;

    if (filters.unreadOnly) q += ' label:UNREAD';
    if (filters.sender) q += ` from:${filters.sender}`;
    if (filters.keyword) q += ` ${filters.keyword}`;

    if (filters.dateRange && filters.dateRange !== 'all') {
      if (filters.dateRange === 'today') q += ' newer_than:1d';
      else if (filters.dateRange === '7days') q += ' newer_than:7d';
      else if (filters.dateRange === '10days') q += ' newer_than:10d';
      else if (filters.dateRange === 'this_week') q += ' newer_than:7d';
      else if (filters.dateRange === 'this_month') q += ' newer_than:30d';
    }

    if (filters.startDate) {
      const d = new Date(filters.startDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      q += ` after:${yyyy}/${mm}/${dd}`;
    }

    if (filters.endDate) {
      const d = new Date(filters.endDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      q += ` before:${yyyy}/${mm}/${dd}`;
    }

    return q.trim();
  }

  private async fetchMessagesList(query: string, defaultFolder: 'inbox' | 'sent' = 'inbox'): Promise<Email[]> {
    try {
      const gmail = this.getGmailClient();
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 20
      });

      const messages = listRes.data.messages || [];
      if (messages.length === 0) return [];

      const emailPromises = messages.map(m => this.getEmail(m.id!));
      const results = await Promise.all(emailPromises);
      return results.filter((e): e is Email => e !== null);
    } catch (err: any) {
      console.error('[GmailMailService] Error fetching message list:', err);
      throw new Error(`Gmail API Error: ${err.message}`);
    }
  }

  private parseGmailMessage(msg: gmail_v1.Schema$Message): Email {
    const headers = msg.payload?.headers || [];
    const getHeader = (name: string) => {
      const h = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
      return h ? h.value || '' : '';
    };

    const fromRaw = getHeader('From');
    const toRaw = getHeader('To');
    const subject = getHeader('Subject') || '(No Subject)';
    const dateStr = getHeader('Date');

    const sender = this.parseContact(fromRaw);
    const recipient = this.parseContact(toRaw);

    const body = this.extractBody(msg.payload);
    const labelIds = msg.labelIds || [];
    const isUnread = labelIds.includes('UNREAD');
    const isSent = labelIds.includes('SENT');

    return {
      id: msg.id || '',
      threadId: msg.threadId || undefined,
      sender,
      recipient,
      subject,
      snippet: msg.snippet || body.substring(0, 100),
      body,
      date: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
      isRead: !isUnread,
      folder: isSent ? 'sent' : 'inbox',
      labels: labelIds
    };
  }

  private parseContact(raw: string): { name: string; email: string } {
    if (!raw) return { name: 'Unknown', email: '' };
    const match = raw.match(/(.*?)\s*<([^>]+)>/);
    if (match) {
      const name = match[1].replace(/^["']|["']$/g, '').trim() || match[2];
      return { name, email: match[2] };
    }
    return { name: raw, email: raw };
  }

  private extractBody(payload?: gmail_v1.Schema$MessagePart): string {
    if (!payload) return '';

    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts && payload.parts.length > 0) {
      const plainPart = payload.parts.find(p => p.mimeType === 'text/plain');
      if (plainPart && plainPart.body?.data) {
        return Buffer.from(plainPart.body.data, 'base64').toString('utf-8');
      }

      const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
      if (htmlPart && htmlPart.body?.data) {
        const rawHtml = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
        return rawHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }

      for (const part of payload.parts) {
        const subBody = this.extractBody(part);
        if (subBody) return subBody;
      }
    }

    return '';
  }
}
