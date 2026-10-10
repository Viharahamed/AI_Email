import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const TOKEN_PATH = path.join(__dirname, '../../.tokens.json');

export class AuthService {
  private _oauth2Client: any = null;

  public getOAuth2Client() {
    if (!this._oauth2Client || !this._oauth2Client._clientId) {
      const clientId = process.env.GMAIL_CLIENT_ID || '';
      const clientSecret = process.env.GMAIL_CLIENT_SECRET || '';
      const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

      this._oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

      this.loadSavedTokens();
    }
    return this._oauth2Client;
  }

  public generateAuthUrl(): string {
    const client = this.getOAuth2Client();
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes
    });
  }

  public async handleCallback(code: string) {
    const client = this.getOAuth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    this.saveTokens(tokens);
    return tokens;
  }

  public isAuthenticated(): boolean {
    const client = this.getOAuth2Client();
    const creds = client.credentials;
    return !!(creds && (creds.access_token || creds.refresh_token));
  }

  public async getUserProfile() {
    if (!this.isAuthenticated()) return null;
    try {
      const client = this.getOAuth2Client();
      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const res = await oauth2.userinfo.get();
      return {
        email: res.data.email,
        name: res.data.name,
        picture: res.data.picture
      };
    } catch (err) {
      console.error('[AuthService] Error fetching user profile:', err);
      return null;
    }
  }

  public logout() {
    const client = this.getOAuth2Client();
    client.setCredentials({});
    if (fs.existsSync(TOKEN_PATH)) {
      try {
        fs.unlinkSync(TOKEN_PATH);
      } catch (err) {
        console.error('Error removing token file:', err);
      }
    }
  }

  private saveTokens(tokens: any) {
    try {
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    } catch (err) {
      console.error('Error saving tokens:', err);
    }
  }

  private loadSavedTokens() {
    try {
      if (fs.existsSync(TOKEN_PATH)) {
        const data = fs.readFileSync(TOKEN_PATH, 'utf-8');
        const tokens = JSON.parse(data);
        if (this._oauth2Client) {
          this._oauth2Client.setCredentials(tokens);
        }
        console.log('[AuthService] Loaded saved OAuth tokens');
      }
    } catch (err) {
      console.error('Error loading tokens:', err);
    }
  }
}

export const authService = new AuthService();
