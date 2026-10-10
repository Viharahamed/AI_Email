import { Request, Response } from 'express';
import { authService } from '../services/authService';

export const getAuthUrl = (req: Request, res: Response) => {
  try {
    const url = authService.generateAuthUrl();
    res.json({ success: true, url });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to generate auth URL' });
  }
};

export const handleGoogleCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.status(400).send('Authorization code missing');
    }
    await authService.handleCallback(code);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?auth=success`);
  } catch (err: any) {
    console.error('Error handling google OAuth callback:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?auth=error&message=${encodeURIComponent(err.message)}`);
  }
};

export const getAuthStatus = async (req: Request, res: Response) => {
  try {
    const authenticated = authService.isAuthenticated();
    let user = null;
    if (authenticated) {
      user = await authService.getUserProfile();
    }
    res.json({
      success: true,
      authenticated,
      user,
      provider: authenticated ? 'gmail' : 'mock'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const logout = (req: Request, res: Response) => {
  try {
    authService.logout();
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
