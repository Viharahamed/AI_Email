import { IMailService } from './mailService.interface';
import { Email, MailFilter, SendEmailPayload } from '../types/mail';

export class MockMailService implements IMailService {
  private emails: Email[] = [
    {
      id: 'email-1',
      sender: { name: 'Sarah Connor', email: 'sarah@skynet-research.org' },
      recipient: { name: 'Me', email: 'user@example.com' },
      subject: 'Project Update & Q3 Milestones',
      snippet: "Hi team, here is the quick summary of our Q3 progress and upcoming sprint goals...",
      body: "Hi team,\n\nHere is the quick summary of our Q3 progress and upcoming sprint goals.\nWe have completed 80% of our targets for the AI natural language interface.\n\nLet me know if you have any questions.\n\nBest,\nSarah",
      date: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
      isRead: false,
      folder: 'inbox',
      labels: ['work', 'important']
    },
    {
      id: 'email-2',
      sender: { name: 'David Miller', email: 'david.m@acme-corp.com' },
      recipient: { name: 'Me', email: 'user@example.com' },
      subject: 'Weekly Sync & Schedule Confirmation',
      snippet: "Hey, let's confirm the agenda for tomorrow's call. I've listed the items below...",
      body: "Hey,\n\nLet's confirm the agenda for tomorrow's call.\n1. Architecture review\n2. Gmail OAuth setup\n3. Next steps\n\nPlease reply if you need to add anything else.\n\nRegards,\nDavid",
      date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hrs ago
      isRead: true,
      folder: 'inbox',
      labels: ['meeting']
    },
    {
      id: 'email-3',
      sender: { name: 'John Doe', email: 'john@example.com' },
      recipient: { name: 'Me', email: 'user@example.com' },
      subject: 'Meeting Tomorrow',
      snippet: "Can we reschedule our 3pm discussion? Let me know what time works best for you.",
      body: "Hi,\n\nCan we reschedule our 3pm discussion? Let me know what time works best for you.\n\nThanks,\nJohn",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      isRead: false,
      folder: 'inbox',
      labels: ['personal']
    },
    {
      id: 'email-4',
      sender: { name: 'Me', email: 'user@example.com' },
      recipient: { name: 'Alex Rivera', email: 'alex@design-studio.io' },
      subject: 'UI Wireframes Feedback',
      snippet: "Thanks Alex! The wireframes look great. I left a few minor comments on Figma...",
      body: "Thanks Alex!\n\nThe wireframes look great. I left a few minor comments on Figma regarding the sidebar contrast.\n\nBest,\nUser",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      isRead: true,
      folder: 'sent',
      labels: ['design']
    }
  ];

  async getInbox(filters?: MailFilter): Promise<Email[]> {
    let result = this.emails.filter(e => e.folder === 'inbox');
    return this.applyFilters(result, filters);
  }

  async getSent(filters?: MailFilter): Promise<Email[]> {
    let result = this.emails.filter(e => e.folder === 'sent');
    return this.applyFilters(result, filters);
  }

  async getEmail(id: string): Promise<Email | null> {
    const email = this.emails.find(e => e.id === id);
    return email || null;
  }

  async searchEmails(query: string, filters?: MailFilter): Promise<Email[]> {
    const q = query.toLowerCase();
    let result = this.emails.filter(e => 
      e.subject.toLowerCase().includes(q) ||
      e.snippet.toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q) ||
      e.sender.name.toLowerCase().includes(q) ||
      e.sender.email.toLowerCase().includes(q)
    );
    return this.applyFilters(result, filters);
  }

  async sendEmail(payload: SendEmailPayload): Promise<Email> {
    const newEmail: Email = {
      id: `email-${Date.now()}`,
      sender: { name: 'Me', email: 'user@example.com' },
      recipient: { name: payload.to.split('@')[0], email: payload.to },
      subject: payload.subject,
      snippet: payload.body.substring(0, 80) + '...',
      body: payload.body,
      date: new Date().toISOString(),
      isRead: true,
      folder: 'sent',
      labels: []
    };
    this.emails.unshift(newEmail);
    return newEmail;
  }

  async markAsRead(id: string): Promise<boolean> {
    const email = this.emails.find(e => e.id === id);
    if (email) {
      email.isRead = true;
      return true;
    }
    return false;
  }

  private applyFilters(emails: Email[], filters?: MailFilter): Email[] {
    if (!filters) return emails;
    const now = Date.now();

    return emails.filter(e => {
      if (filters.unreadOnly && e.isRead) return false;
      if (filters.sender && !e.sender.email.toLowerCase().includes(filters.sender.toLowerCase()) && !e.sender.name.toLowerCase().includes(filters.sender.toLowerCase())) return false;
      if (filters.keyword && !e.subject.toLowerCase().includes(filters.keyword.toLowerCase()) && !e.snippet.toLowerCase().includes(filters.keyword.toLowerCase())) return false;

      const emailTime = new Date(e.date).getTime();
      if (filters.dateRange && filters.dateRange !== 'all') {
        if (filters.dateRange === 'today' && now - emailTime > 1000 * 60 * 60 * 24) return false;
        if (filters.dateRange === '7days' && now - emailTime > 1000 * 60 * 60 * 24 * 7) return false;
        if (filters.dateRange === '10days' && now - emailTime > 1000 * 60 * 60 * 24 * 10) return false;
        if (filters.dateRange === 'this_week' && now - emailTime > 1000 * 60 * 60 * 24 * 7) return false;
        if (filters.dateRange === 'this_month' && now - emailTime > 1000 * 60 * 60 * 24 * 30) return false;
      }

      if (filters.startDate && emailTime < new Date(filters.startDate).getTime()) return false;
      if (filters.endDate && emailTime > new Date(filters.endDate).getTime()) return false;

      return true;
    });
  }
}
