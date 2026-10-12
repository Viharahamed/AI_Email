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

    const { textBody, htmlBody } = this.extractBodies(msg.payload);
    const body = textBody || (htmlBody ? GmailMailService.htmlToPlainText(htmlBody) : (msg.snippet || ''));
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
      htmlBody: htmlBody || undefined,
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

  private decodeBase64Url(data: string): string {
    if (!data) return '';
    try {
      return Buffer.from(data, 'base64url').toString('utf-8');
    } catch {
      const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(normalized, 'base64').toString('utf-8');
    }
  }

  private extractBodies(payload?: gmail_v1.Schema$MessagePart): { textBody: string; htmlBody: string } {
    let textBody = '';
    let htmlBody = '';

    if (!payload) return { textBody, htmlBody };

    const walk = (part: gmail_v1.Schema$MessagePart) => {
      // Ignore attachment parts
      const disposition = part.headers?.find(h => h.name?.toLowerCase() === 'content-disposition')?.value || '';
      if (
        disposition.toLowerCase().includes('attachment') ||
        (part.filename && part.filename.length > 0 && part.mimeType !== 'text/plain' && part.mimeType !== 'text/html')
      ) {
        return;
      }

      if (part.mimeType === 'text/plain' && part.body?.data && !textBody) {
        textBody = this.decodeBase64Url(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data && !htmlBody) {
        htmlBody = this.decodeBase64Url(part.body.data);
      }

      if (part.parts && part.parts.length > 0) {
        for (const child of part.parts) {
          walk(child);
        }
      }
    };

    if (payload.body?.data) {
      if (payload.mimeType === 'text/html') {
        htmlBody = this.decodeBase64Url(payload.body.data);
      } else if (payload.mimeType === 'text/plain' || !payload.mimeType) {
        textBody = this.decodeBase64Url(payload.body.data);
      }
    }

    if (payload.parts && payload.parts.length > 0) {
      for (const part of payload.parts) {
        walk(part);
      }
    }

    return { textBody, htmlBody };
  }

  public static htmlToPlainText(html: string): string {
    if (!html) return '';
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/td>/gi, ' ')
      .replace(/<hr\s*\/?>/gi, '\n---\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&mdash;/gi, '—')
      .replace(/&ndash;/gi, '–')
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();
  }
}
