import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getActiveMailService } from '../services/mailServiceFactory';
import { authService } from '../services/authService';
import { MockMailService } from '../services/mockMailService';
import { GmailMailService } from '../services/gmailMailService';

describe('MailServiceFactory', () => {
  it('should return MockMailService when user is not authenticated', () => {
    // Force unauthenticated state for test
    const originalIsAuth = authService.isAuthenticated.bind(authService);
    (authService as any).isAuthenticated = () => false;

    try {
      const active = getActiveMailService();
      assert.ok(active instanceof MockMailService);
    } finally {
      (authService as any).isAuthenticated = originalIsAuth;
    }
  });

  it('should return GmailMailService when user is authenticated with Google', () => {
    // Mock authenticated state
    const originalIsAuth = authService.isAuthenticated.bind(authService);
    (authService as any).isAuthenticated = () => true;

    try {
      const active = getActiveMailService();
      assert.ok(active instanceof GmailMailService);
    } finally {
      (authService as any).isAuthenticated = originalIsAuth;
    }
  });
});

