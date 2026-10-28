import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MockMailService } from '../services/mockMailService';
import { Email } from '../types/mail';

describe('MockMailService (Section 2.D)', () => {
  let service: MockMailService;

  beforeEach(() => {
    service = new MockMailService();
  });

  describe('Inbox and Sent Retrieval', () => {
    it('should retrieve all initial inbox emails without filters', async () => {
      const inbox = await service.getInbox();
      assert.equal(inbox.length, 3);
      assert.ok(inbox.every(e => e.folder === 'inbox'));
    });

    it('should retrieve all initial sent emails without filters', async () => {
      const sent = await service.getSent();
      assert.equal(sent.length, 1);
      assert.ok(sent.every(e => e.folder === 'sent'));
      assert.equal(sent[0].subject, 'UI Wireframes Feedback');
    });

    it('should retrieve a single email by id', async () => {
      const email = await service.getEmail('email-1');
      assert.ok(email);
      assert.equal(email?.id, 'email-1');
      assert.equal(email?.sender.name, 'Sarah Connor');
    });

    it('should return null when retrieving an email with non-existent id', async () => {
      const email = await service.getEmail('email-nonexistent-999');
      assert.equal(email, null);
    });

    it('should mark an unread email as read', async () => {
      const initial = await service.getEmail('email-1');
      assert.equal(initial?.isRead, false);

      const success = await service.markAsRead('email-1');
      assert.equal(success, true);

      const updated = await service.getEmail('email-1');
      assert.equal(updated?.isRead, true);
    });
  });

  describe('Keyword and Sender Filtering', () => {
    it('should filter inbox emails by sender name or email address case-insensitively', async () => {
      const byName = await service.getInbox({ sender: 'sarah' });
      assert.equal(byName.length, 1);
      assert.equal(byName[0].sender.name, 'Sarah Connor');

      const byEmail = await service.getInbox({ sender: 'skynet-research.org' });
      assert.equal(byEmail.length, 1);
      assert.equal(byEmail[0].id, 'email-1');
    });

    it('should filter inbox emails by keyword across subject and snippet', async () => {
      const bySubject = await service.getInbox({ keyword: 'milestones' });
      assert.equal(bySubject.length, 1);
      assert.equal(bySubject[0].id, 'email-1');

      const bySnippet = await service.getInbox({ keyword: 'sync' });
      assert.equal(bySnippet.length, 1);
      assert.equal(bySnippet[0].id, 'email-2');
    });

    it('should return empty array when sender or keyword does not match any messages', async () => {
      const noSender = await service.getInbox({ sender: 'unknown-user@fake.com' });
      assert.equal(noSender.length, 0);

      const noKeyword = await service.getInbox({ keyword: 'supercalifragilistic' });
      assert.equal(noKeyword.length, 0);
    });
  });

  describe('Unread Filtering', () => {
    it('should filter to only unread emails when unreadOnly is true', async () => {
      const unread = await service.getInbox({ unreadOnly: true });
      assert.equal(unread.length, 2);
      assert.ok(unread.every(e => e.isRead === false));
    });

    it('should combine unread filter with sender filter', async () => {
      const sarahUnread = await service.getInbox({ unreadOnly: true, sender: 'sarah' });
      assert.equal(sarahUnread.length, 1);
      assert.equal(sarahUnread[0].sender.name, 'Sarah Connor');

      // David is already read (isRead: true in mock data), so unread filter should return empty
      const davidUnread = await service.getInbox({ unreadOnly: true, sender: 'david' });
      assert.equal(davidUnread.length, 0);
    });
  });

  describe('Date Presets & Date Filtering Semantics', () => {
    it('should filter emails within "today" preset (last 24 hours)', async () => {
      // In mock data: email-1 is 45m ago, email-2 is 5h ago, email-3 is 2 days ago
      const todayEmails = await service.getInbox({ dateRange: 'today' });
      assert.equal(todayEmails.length, 2);
      assert.ok(todayEmails.some(e => e.id === 'email-1'));
      assert.ok(todayEmails.some(e => e.id === 'email-2'));
    });

    it('should filter emails within "7days" preset', async () => {
      const sevenDays = await service.getInbox({ dateRange: '7days' });
      assert.equal(sevenDays.length, 3);
    });

    it('should return all emails when dateRange is "all"', async () => {
      const allEmails = await service.getInbox({ dateRange: 'all' });
      assert.equal(allEmails.length, 3);
    });

    /**
     * DOCUMENTED SEMANTIC MISMATCH:
     * Current implementation of "this_week" uses a rolling 7-day window (now - 7d)
     * rather than a calendar-boundary week starting Sunday/Monday.
     * Current implementation of "this_month" uses a rolling 30-day window (now - 30d)
     * rather than the 1st of the current calendar month.
     */
    it('documents that "this_week" currently implements a rolling 7-day window', async () => {
      const thisWeekEmails = await service.getInbox({ dateRange: 'this_week' });
      // All 3 initial mock emails are within 2 days, so all 3 match the 7-day rolling window
      assert.equal(thisWeekEmails.length, 3);
    });

    it('documents that "this_month" currently implements a rolling 30-day window', async () => {
      const thisMonthEmails = await service.getInbox({ dateRange: 'this_month' });
      assert.equal(thisMonthEmails.length, 3);
    });
  });

  describe('Sending Emails & State Modification', () => {
    it('should add sent email to the beginning of the sent folder and return it', async () => {
      const payload = {
        to: 'partner@enterprise.com',
        subject: 'Contract Agreement Review',
        body: 'Please review the updated agreement clauses.'
      };

      const sent = await service.sendEmail(payload);
      assert.ok(sent.id.startsWith('email-'));
      assert.equal(sent.folder, 'sent');
      assert.equal(sent.recipient.email, 'partner@enterprise.com');
      assert.equal(sent.subject, 'Contract Agreement Review');
      assert.equal(sent.isRead, true);

      // Verify it appears in getSent()
      const allSent = await service.getSent();
      assert.equal(allSent.length, 2);
      assert.equal(allSent[0].id, sent.id);
    });
  });
});

