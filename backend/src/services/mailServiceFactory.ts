import { IMailService } from './mailService.interface';
import { GmailMailService } from './gmailMailService';
import { MockMailService } from './mockMailService';
import { authService } from './authService';

const mockService = new MockMailService();
const gmailService = new GmailMailService();

export function getActiveMailService(): IMailService {
  if (authService.isAuthenticated()) {
    return gmailService;
  }
  return mockService;
}
