import { Request, Response } from 'express';
import { getActiveMailService } from '../services/mailServiceFactory';
import { MailFilter, DateRangePreset } from '../types/mail';

function extractFilters(req: Request): MailFilter {
  return {
    unreadOnly: req.query.unread === 'true',
    sender: req.query.sender as string,
    keyword: req.query.keyword as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    dateRange: req.query.dateRange as DateRangePreset
  };
}

export const getInbox = async (req: Request, res: Response) => {
  try {
    const filters = extractFilters(req);
    const mailService = getActiveMailService();
    const emails = await mailService.getInbox(filters);
    res.json({ success: true, count: emails.length, data: emails });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch inbox' });
  }
};

export const getSent = async (req: Request, res: Response) => {
  try {
    const filters = extractFilters(req);
    const mailService = getActiveMailService();
    const emails = await mailService.getSent(filters);
    res.json({ success: true, count: emails.length, data: emails });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch sent emails' });
  }
};

export const getEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mailService = getActiveMailService();
    const email = await mailService.getEmail(id);
    if (!email) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }
    await mailService.markAsRead(id);
    res.json({ success: true, data: email });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch email' });
  }
};

export const searchEmails = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const filters = extractFilters(req);
    const mailService = getActiveMailService();
    const emails = await mailService.searchEmails(q, filters);
    res.json({ success: true, count: emails.length, data: emails });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to search emails' });
  }
};

export const sendEmail = async (req: Request, res: Response) => {
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, error: 'Recipient, subject, and body are required' });
    }
    const mailService = getActiveMailService();
    const sentEmail = await mailService.sendEmail({ to, subject, body });
    res.status(201).json({ success: true, data: sentEmail });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to send email' });
  }
};
