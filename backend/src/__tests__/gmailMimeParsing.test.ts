import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GmailMailService } from '../services/gmailMailService';
import { gmail_v1 } from 'googleapis';

describe('Gmail MIME & Message Parsing (Section 2.E)', () => {
  const service = new GmailMailService();

  // Helper to invoke private parseGmailMessage on GmailMailService
  const parseMessage = (msg: gmail_v1.Schema$Message) => {
    return (service as any).parseGmailMessage(msg);
  };

  // Helper to invoke private decodeBase64Url
  const decodeBase64 = (data: string) => {
    return (service as any).decodeBase64Url(data);
  };

  // Helper to invoke private extractBodies
  const extractBodies = (payload?: gmail_v1.Schema$MessagePart) => {
    return (service as any).extractBodies(payload);
  };

  describe('Base64url Decoding', () => {
    it('should correctly decode standard base64url encoded text', () => {
      const rawText = 'Hello World! This is a test message.';
      const encoded = Buffer.from(rawText).toString('base64url');
      const decoded = decodeBase64(encoded);
      assert.equal(decoded, rawText);
    });

    it('should correctly decode base64url with "-" and "_" characters', () => {
      // String designed to generate '-' and '_' in base64url
      const rawText = '>>> ??? ~~~ Special characters: €£¥';
      const encoded = Buffer.from(rawText).toString('base64url');
      assert.ok(encoded.includes('-') || encoded.includes('_') || encoded.length > 0);
      const decoded = decodeBase64(encoded);
      assert.equal(decoded, rawText);
    });

    it('should return empty string for empty input', () => {
      assert.equal(decodeBase64(''), '');
    });
  });

  describe('Plain-Text Message Parsing', () => {
    it('should parse a simple plain-text message part into body and snippet', () => {
      const plainText = 'Hi team, the release deployment is scheduled for 8pm tonight.';
      const encoded = Buffer.from(plainText).toString('base64url');

      const fixture: gmail_v1.Schema$Message = {
        id: 'msg-001',
        threadId: 'thread-001',
        labelIds: ['INBOX', 'UNREAD'],
        snippet: 'Hi team, the release deployment...',
        payload: {
          mimeType: 'text/plain',
          headers: [
            { name: 'From', value: 'Lead Engineer <lead@tech-firm.com>' },
            { name: 'To', value: 'Dev Team <dev@tech-firm.com>' },
            { name: 'Subject', value: 'Deployment Alert' },
            { name: 'Date', value: 'Tue, 15 Oct 2026 14:00:00 +0000' }
          ],
          body: {
            data: encoded,
            size: encoded.length
          }
        }
      };

      const email = parseMessage(fixture);
      assert.equal(email.id, 'msg-001');
      assert.equal(email.threadId, 'thread-001');
      assert.equal(email.sender.name, 'Lead Engineer');
      assert.equal(email.sender.email, 'lead@tech-firm.com');
      assert.equal(email.recipient.name, 'Dev Team');
      assert.equal(email.recipient.email, 'dev@tech-firm.com');
      assert.equal(email.subject, 'Deployment Alert');
      assert.equal(email.body, plainText);
      assert.equal(email.htmlBody, undefined);
      assert.equal(email.isRead, false, 'Unread message because labelIds includes UNREAD');
      assert.equal(email.folder, 'inbox');
    });
  });

  describe('HTML-Only Message Parsing', () => {
    it('should parse an HTML-only message and populate htmlBody and plain text fallback', () => {
      const htmlText = '<div><h1>Welcome to the Service</h1><p>Click <a href="https://example.com">here</a> to activate.</p></div>';
      const encoded = Buffer.from(htmlText).toString('base64url');

      const fixture: gmail_v1.Schema$Message = {
        id: 'msg-html-002',
        labelIds: ['INBOX'],
        payload: {
          mimeType: 'text/html',
          headers: [
            { name: 'From', value: 'Support <support@platform.io>' },
            { name: 'To', value: 'customer@client.com' },
            { name: 'Subject', value: 'Activate Your Account' }
          ],
          body: {
            data: encoded
          }
        }
      };

      const email = parseMessage(fixture);
      assert.equal(email.id, 'msg-html-002');
      assert.equal(email.htmlBody, htmlText);
      assert.ok(email.body.includes('Welcome to the Service'));
      assert.ok(!email.body.includes('<h1>'), 'Fallback body should strip HTML tags');
      assert.equal(email.isRead, true, 'Read message because labelIds lacks UNREAD');
    });
  });

  describe('Multipart/Alternative Message Parsing', () => {
    it('should extract both textBody and htmlBody from multipart/alternative payload', () => {
      const plain = 'Hello! Please review the document.';
      const html = '<p>Hello! <strong>Please review</strong> the document.</p>';

      const payload: gmail_v1.Schema$MessagePart = {
        mimeType: 'multipart/alternative',
        parts: [
          {
            mimeType: 'text/plain',
            body: { data: Buffer.from(plain).toString('base64url') }
          },
          {
            mimeType: 'text/html',
            body: { data: Buffer.from(html).toString('base64url') }
          }
        ]
      };

      const bodies = extractBodies(payload);
      assert.equal(bodies.textBody, plain);
      assert.equal(bodies.htmlBody, html);
    });
  });

  describe('Nested MIME Parts & Attachment Handling', () => {
    it('should traverse nested multipart/mixed structures and ignore attachments without body corruption', () => {
      const plain = 'Here is the quarterly invoice report in attachment.';
      const html = '<p>Here is the quarterly invoice report in attachment.</p>';

      const nestedPayload: gmail_v1.Schema$MessagePart = {
        mimeType: 'multipart/mixed',
        parts: [
          {
            mimeType: 'multipart/alternative',
            parts: [
              {
                mimeType: 'text/plain',
                body: { data: Buffer.from(plain).toString('base64url') }
              },
              {
                mimeType: 'text/html',
                body: { data: Buffer.from(html).toString('base64url') }
              }
            ]
          },
          {
            // Attachment Part (PDF)
            mimeType: 'application/pdf',
            filename: 'Invoice_Q3.pdf',
            headers: [
              { name: 'Content-Disposition', value: 'attachment; filename="Invoice_Q3.pdf"' }
            ],
            body: {
              attachmentId: 'att-xyz-123',
              size: 512000
            }
          }
        ]
      };

      const bodies = extractBodies(nestedPayload);
      assert.equal(bodies.textBody, plain);
      assert.equal(bodies.htmlBody, html);
    });
  });

  describe('Header & Contact Parsing Edge Cases', () => {
    it('should parse From header with quoted name and angle-bracket email', () => {
      const fixture: gmail_v1.Schema$Message = {
        id: 'msg-contacts',
        payload: {
          headers: [
            { name: 'From', value: '"Dr. Gregory House" <house@princeton-plainsboro.org>' },
            { name: 'To', value: 'cameron@princeton-plainsboro.org' }
          ]
        }
      };

      const email = parseMessage(fixture);
      assert.equal(email.sender.name, 'Dr. Gregory House');
      assert.equal(email.sender.email, 'house@princeton-plainsboro.org');
      assert.equal(email.recipient.name, 'cameron@princeton-plainsboro.org');
      assert.equal(email.recipient.email, 'cameron@princeton-plainsboro.org');
      assert.equal(email.subject, '(No Subject)');
    });

    it('should handle missing From/To headers gracefully with Unknown defaults', () => {
      const fixture: gmail_v1.Schema$Message = {
        id: 'msg-no-headers',
        payload: {
          headers: []
        }
      };

      const email = parseMessage(fixture);
      assert.equal(email.sender.name, 'Unknown');
      assert.equal(email.sender.email, '');
      assert.equal(email.subject, '(No Subject)');
    });
  });

  describe('htmlToPlainText Utility', () => {
    it('should strip script, style, and comments while converting br and p tags to clean newlines', () => {
      const rawHtml = `
        <html>
          <head>
            <style>body { color: red; }</style>
            <script>alert("malicious");</script>
          </head>
          <body>
            <!-- comment -->
            <h2>Meeting Confirmation</h2>
            <p>Hi team,<br/>Tomorrow sync at 10am.</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
            <p>Thanks &amp; regards,<br>Sarah &copy;</p>
          </body>
        </html>
      `;

      const text = GmailMailService.htmlToPlainText(rawHtml);
      assert.ok(!text.includes('color: red;'), 'Styles must be stripped');
      assert.ok(!text.includes('alert('), 'Scripts must be stripped');
      assert.ok(!text.includes('<!--'), 'Comments must be stripped');
      assert.ok(text.includes('Meeting Confirmation'));
      assert.ok(text.includes('Tomorrow sync at 10am.'));
      assert.ok(text.includes('• Item 1'));
      assert.ok(text.includes('• Item 2'));
      assert.ok(text.includes('&'));
    });
  });
});

