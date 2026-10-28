import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { aiService } from '../services/aiService';
import { SelectedEmailContext } from '../types/ai';

describe('AI Safety, Context Awareness & Grounded Q&A', () => {
  let savedApiKey: string | undefined;

  beforeEach(() => {
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

  describe('Section 2.B: Draft and Reply Safety', () => {
    it('should preserve a supplied recipient email address exactly', async () => {
      const targetEmail = 'engineer.lead@corp-domain.io';
      const res = await aiService.processPrompt({
        prompt: `draft an email to ${targetEmail} about quarterly sync`,
        context: { currentView: 'inbox' }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'draft_email');
      assert.equal(res.action.draft?.to, targetEmail);
    });

    it('should NOT fabricate a recipient when none is provided in prompt or context', async () => {
      const res = await aiService.processPrompt({
        prompt: 'compose an email about architecture review',
        context: { currentView: 'inbox', selectedEmail: null }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'draft_email');
      assert.equal(res.action.draft?.to, '', 'Recipient address must be empty string, not fabricated');
      assert.ok(res.message.includes('enter the recipient address before sending'));
    });

    it('should populate reply draft fields from selected email sender and subject', async () => {
      const selectedEmail: SelectedEmailContext = {
        id: 'email-999',
        sender: { name: 'Elena Rostova', email: 'elena@research.org' },
        subject: 'Research Proposal Feedback',
        body: 'Please review the attached notes.'
      };

      const res = await aiService.processPrompt({
        prompt: 'reply saying thank you for the feedback',
        context: {
          currentView: 'email-detail',
          selectedEmail
        }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'reply_email');
      assert.equal(res.action.draft?.to, 'elena@research.org');
      assert.equal(res.action.draft?.subject, 'Re: Research Proposal Feedback');
      assert.equal(res.action.draft?.replyToEmailId, 'email-999');
      assert.ok(res.action.draft?.body?.includes('Hi Elena'));
    });

    it('should handle a reply request safely when NO email is currently selected', async () => {
      const res = await aiService.processPrompt({
        prompt: 'reply saying I will attend tomorrow',
        context: {
          currentView: 'inbox',
          selectedEmail: null
        }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'reply_email');
      assert.equal(res.action.draft?.to, '', 'Must not invent an email recipient');
      assert.equal(res.action.draft?.replyToEmailId, undefined);
      assert.ok(res.message.includes('No email is currently selected to reply to'));
    });

    it('should NOT invoke an automated email-send action during drafting or replies', async () => {
      const draftRes = await aiService.processPrompt({
        prompt: 'send an email to john@example.com about deployment',
        context: { currentView: 'inbox' }
      });

      // Crucial Safety Constraint: Natural language "send an email" must map to draft_email, never a silent send operation
      assert.notEqual(draftRes.action.type as string, 'send_email');
      assert.equal(draftRes.action.type, 'draft_email');
      assert.ok(draftRes.message.includes('compose window'));
    });
  });

  describe('Section 2.C: Selected-Email Context, Summarization & Q&A', () => {
    const sampleEmailA: SelectedEmailContext = {
      id: 'email-alpha',
      sender: { name: 'Alice Smith', email: 'alice@crypto-lab.net' },
      subject: 'Security Audit Q3',
      body: 'Hi team,\n\nWe completed the security audit.\n1. Update dependencies\n2. Rotate credentials\n\nThe project deadline is Friday, Nov 15th.\n\nBest, Alice'
    };

    const sampleEmailB: SelectedEmailContext = {
      id: 'email-beta',
      sender: { name: 'Bob Jones', email: 'bob@marketing-hub.com' },
      subject: 'Newsletter Draft',
      body: 'Hi all,\nHere is the weekly newsletter draft for review.\nNo immediate tasks needed.\nBest regards,\nBob'
    };

    it('should require selecting an email before answering summarization or Q&A requests', async () => {
      const prompts = [
        'summarize this email',
        'what is the main request?',
        'list the action items',
        'what is the deadline?'
      ];

      for (const prompt of prompts) {
        const res = await aiService.processPrompt({
          prompt,
          context: { currentView: 'inbox', selectedEmail: null }
        });

        assert.equal(res.success, true);
        assert.equal(res.action.type, 'none');
        assert.ok(
          res.message.includes('Please select or open an email first'),
          `Prompt "${prompt}" should reject when selectedEmail is missing`
        );
      }
    });

    it('should ground email summary strictly in the selected email content', async () => {
      const res = await aiService.processPrompt({
        prompt: 'summarize this email',
        context: {
          currentView: 'email-detail',
          selectedEmail: sampleEmailA
        }
      });

      assert.equal(res.success, true);
      assert.equal(res.action.type, 'none');
      assert.ok(res.message.includes('Security Audit Q3'));
      assert.ok(res.message.includes('Alice Smith'));
      assert.ok(res.message.includes('completed the security audit'));
    });

    it('should extract numbered and bulleted action items when present', async () => {
      const res = await aiService.processPrompt({
        prompt: 'list the action items in this email',
        context: {
          currentView: 'email-detail',
          selectedEmail: sampleEmailA
        }
      });

      assert.equal(res.success, true);
      assert.ok(res.message.includes('Update dependencies'));
      assert.ok(res.message.includes('Rotate credentials'));
    });

    it('should explicitly state when no action items are listed without fabricating tasks', async () => {
      const res = await aiService.processPrompt({
        prompt: 'list the action items',
        context: {
          currentView: 'email-detail',
          selectedEmail: sampleEmailB
        }
      });

      assert.equal(res.success, true);
      assert.ok(
        res.message.includes('No specific action items or tasks are listed in this email'),
        'Must explicitly indicate absence of action items'
      );
    });

    it('should extract explicit deadlines when present in the message body', async () => {
      const res = await aiService.processPrompt({
        prompt: 'what is the deadline mentioned?',
        context: {
          currentView: 'email-detail',
          selectedEmail: sampleEmailA
        }
      });

      assert.equal(res.success, true);
      assert.ok(res.message.includes('Friday, Nov 15th'));
    });

    it('should explicitly state when NO deadline is mentioned without inventing dates', async () => {
      const res = await aiService.processPrompt({
        prompt: 'what is the deadline for this email?',
        context: {
          currentView: 'email-detail',
          selectedEmail: sampleEmailB
        }
      });

      assert.equal(res.success, true);
      assert.ok(
        res.message.includes('This email does not mention an explicit deadline'),
        'Must not invent deadlines when none exist'
      );
    });

    it('should cleanly switch context between consecutive requests without retaining stale email state', async () => {
      // First query with Email A
      const resA = await aiService.processPrompt({
        prompt: 'who is the sender of this email?',
        context: {
          currentView: 'email-detail',
          selectedEmail: sampleEmailA
        }
      });
      assert.ok(resA.message.includes('Alice Smith'));
      assert.ok(!resA.message.includes('Bob Jones'));

      // Second query with Email B
      const resB = await aiService.processPrompt({
        prompt: 'who is the sender of this email?',
        context: {
          currentView: 'email-detail',
          selectedEmail: sampleEmailB
        }
      });
      assert.ok(resB.message.includes('Bob Jones'));
      assert.ok(!resB.message.includes('Alice Smith'));
    });
  });
});
