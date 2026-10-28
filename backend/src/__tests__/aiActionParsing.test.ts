import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { aiService } from '../services/aiService';

describe('AI Action Parsing (Deterministic Rule Engine)', () => {
  let savedApiKey: string | undefined;

  beforeEach(() => {
    // Ensure offline deterministic rule parser is active during unit tests
    savedApiKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (savedApiKey !== undefined) {
      process.env.GEMINI_API_KEY = savedApiKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  });

  describe('search_emails Action', () => {
    it('should parse simple keyword search queries', async () => {
      const res = await aiService.processPrompt({
        prompt: 'search for quarterly review',
        context: { currentView: 'inbox' }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'search_emails');
      assert.equal(res.action.query, 'quarterly review');
    });

    it('should parse "find" keyword search queries', async () => {
      const res = await aiService.processPrompt({
        prompt: 'find interview notes',
        context: { currentView: 'inbox' }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'search_emails');
      assert.equal(res.action.query, 'interview notes');
    });

    it('should parse multi-word keyword search queries', async () => {
      const res = await aiService.processPrompt({
        prompt: 'search for quarterly revenue reports',
        context: { currentView: 'inbox' }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'search_emails');
      assert.equal(res.action.query, 'quarterly revenue reports');
    });
  });

  describe('apply_filter Action', () => {
    it('should parse unread filter requests', async () => {
      const res = await aiService.processPrompt({
        prompt: 'show unread emails',
        context: { currentView: 'inbox' }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'apply_filter');
      assert.equal(res.action.filter?.unreadOnly, true);
    });

    it('should parse sender filter requests', async () => {
      const res = await aiService.processPrompt({
        prompt: 'filter emails from Sarah',
        context: { currentView: 'inbox' }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'apply_filter');
      assert.equal(res.action.filter?.sender, 'sarah');
    });

    it('should parse combined unread and sender filters', async () => {
      const res = await aiService.processPrompt({
        prompt: 'show unread emails from David',
        context: { currentView: 'inbox' }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'apply_filter');
      assert.equal(res.action.filter?.unreadOnly, true);
      assert.equal(res.action.filter?.sender, 'david');
    });

    it('should parse date range preset filters (today, 10 days, this week, this month)', async () => {
      const presets = [
        { prompt: 'show emails from today', expected: 'today' },
        { prompt: 'show emails from last 10 days', expected: '10days' },
        { prompt: 'show emails this week', expected: 'this_week' },
        { prompt: 'show emails this month', expected: 'this_month' }
      ];

      for (const { prompt, expected } of presets) {
        const res = await aiService.processPrompt({
          prompt,
          context: { currentView: 'inbox' }
        });
        assert.equal(res.success, true);
        assert.equal(res.action.type, 'apply_filter');
        assert.equal(res.action.filter?.dateRange, expected);
      }
    });
  });

  describe('open_email Action', () => {
    it('should parse "open latest email from David"', async () => {
      const res = await aiService.processPrompt({
        prompt: 'open latest email from David',
        context: { currentView: 'inbox' }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'open_email');
      assert.equal(res.action.targetSender, 'david');
    });

    it('should parse "open the email" without sender', async () => {
      const res = await aiService.processPrompt({
        prompt: 'open the email',
        context: { currentView: 'inbox' }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'open_email');
      assert.equal(res.action.targetSender, undefined);
    });
  });

  describe('navigate Action', () => {
    it('should navigate to sent folder', async () => {
      const res = await aiService.processPrompt({
        prompt: 'go to sent',
        context: { currentView: 'inbox' }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'navigate');
      assert.equal(res.action.view, 'sent');
    });

    it('should navigate to inbox', async () => {
      const res = await aiService.processPrompt({
        prompt: 'open inbox',
        context: { currentView: 'sent' }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'navigate');
      assert.equal(res.action.view, 'inbox');
    });
  });

  describe('clear_filters Action', () => {
    it('should parse "clear filters"', async () => {
      const res = await aiService.processPrompt({
        prompt: 'clear all filters',
        context: { currentView: 'inbox' }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'clear_filters');
    });

    it('should parse "show all emails" as clear filters', async () => {
      const res = await aiService.processPrompt({
        prompt: 'show all emails',
        context: { currentView: 'inbox' }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'clear_filters');
    });
  });

  describe('draft_email and reply_email Actions', () => {
    it('should parse draft email request with recipient and subject', async () => {
      const res = await aiService.processPrompt({
        prompt: 'draft an email to alex@example.com about project update',
        context: { currentView: 'inbox' }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'draft_email');
      assert.equal(res.action.draft?.to, 'alex@example.com');
      assert.equal(res.action.draft?.subject, 'Project Update');
      assert.ok(res.action.draft?.body?.includes('project update'));
    });

    it('should parse reply intent when saying text is specified', async () => {
      const res = await aiService.processPrompt({
        prompt: 'reply saying thank you for the feedback',
        context: {
          currentView: 'email-detail',
          selectedEmail: {
            id: 'email-123',
            sender: { name: 'Sarah Connor', email: 'sarah@example.com' },
            subject: 'Design Review',
            body: 'Here are the design mockups.'
          }
        }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'reply_email');
      assert.equal(res.action.draft?.to, 'sarah@example.com');
      assert.equal(res.action.draft?.subject, 'Re: Design Review');
      assert.equal(res.action.draft?.replyToEmailId, 'email-123');
      assert.ok(res.action.draft?.body?.includes('Thank you for the feedback'));
    });
  });
});
