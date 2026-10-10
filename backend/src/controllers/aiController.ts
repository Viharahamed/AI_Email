import { Request, Response } from 'express';
import { aiService } from '../services/aiService';

export const processPrompt = async (req: Request, res: Response) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid prompt string is required.'
      });
    }

    const result = await aiService.processPrompt({ prompt, context });
    return res.json(result);
  } catch (error: any) {
    console.error('Error processing AI prompt:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error processing AI prompt'
    });
  }
};
