import { AIProcessRequest, AIProcessResponse, AIActionPayload } from '../types/ai';
import { DateRangePreset } from '../types/mail';

export class AIService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  public async processPrompt(req: AIProcessRequest): Promise<AIProcessResponse> {
    const { prompt, context } = req;
    if (!prompt || !prompt.trim()) {
      return {
        success: false,
        message: 'Prompt cannot be empty.',
        action: { type: 'none' }
      };
    }

    // Try Gemini API first if key exists
    if (this.apiKey && this.apiKey !== 'your_gemini_api_key') {
      try {
        const geminiResult = await this.callGeminiApi(prompt, context);
        if (geminiResult) {
          return geminiResult;
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to rule-based parser:', err);
      }
    }

    // Fallback rule parser (deterministic & reliable)
    return this.parsePromptWithRules(prompt, context);
  }

  private async callGeminiApi(prompt: string, context?: any): Promise<AIProcessResponse | null> {
    const systemInstruction = `You are Aura AI, an intelligent mail assistant. 
Your goal is to parse user requests about managing emails and return a valid JSON object.

Context:
- Current View: ${context?.currentView || 'inbox'}
- Current Filters: ${JSON.stringify(context?.filters || {})}
- Current Search Query: "${context?.searchQuery || ''}"

Available Tool Actions:
1. search_emails: search keywords or date ranges.
   JSON: { "type": "search_emails", "query": string, "filter": { "dateRange": "today" | "7days" | "10days" | "this_week" | "this_month" | "all" } }
2. apply_filter: apply filter options.
   JSON: { "type": "apply_filter", "filter": { "unreadOnly"?: boolean, "sender"?: string, "dateRange"?: "today" | "7days" | "10days" | "this_week" | "this_month" | "all", "keyword"?: string } }
3. open_email: open a specific email by sender or topic.
   JSON: { "type": "open_email", "targetSender"?: string, "targetSubject"?: string, "query"?: string }
4. navigate: switch between views.
   JSON: { "type": "navigate", "view": "inbox" | "sent" }
5. clear_filters: reset all filters.
   JSON: { "type": "clear_filters" }
6. none: general question or no action needed.
   JSON: { "type": "none" }

Response Format (JSON ONLY):
{
  "message": "Friendly response summarizing what action was taken",
  "action": <Tool Action JSON object>
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser Request: "${prompt}"` }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      console.warn(`Gemini API returned status ${response.status}`);
      return null;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    return {
      success: true,
      message: parsed.message || 'Action executed successfully.',
      action: parsed.action || { type: 'none' }
    };
  }

  private parsePromptWithRules(prompt: string, context?: any): AIProcessResponse {
    const text = prompt.toLowerCase().trim();

    // 1. Navigation intent
    if (text.includes('go to sent') || text.includes('show sent') || text.includes('open sent')) {
      return {
        success: true,
        message: 'Navigated to Sent folder.',
        action: { type: 'navigate', view: 'sent' }
      };
    }
    if (text.includes('go to inbox') || text.includes('show inbox') || text.includes('open inbox')) {
      return {
        success: true,
        message: 'Navigated to Inbox.',
        action: { type: 'navigate', view: 'inbox' }
      };
    }

    // 2. Clear filters intent
    if (text.includes('clear filter') || text.includes('reset filter') || text.includes('show all email') || text.includes('clear all')) {
      return {
        success: true,
        message: 'Cleared all email filters and searches.',
        action: { type: 'clear_filters' }
      };
    }

    // Date range extraction helper
    let detectedDateRange: DateRangePreset | undefined = undefined;
    if (text.includes('today')) detectedDateRange = 'today';
    else if (text.includes('7 days') || text.includes('last 7')) detectedDateRange = '7days';
    else if (text.includes('10 days') || text.includes('last 10')) detectedDateRange = '10days';
    else if (text.includes('this week')) detectedDateRange = 'this_week';
    else if (text.includes('this month')) detectedDateRange = 'this_month';

    // 3. Sender extraction helper
    let detectedSender: string | undefined = undefined;
    const fromMatch = text.match(/(?:from|by|sent by)\s+([a-zA-Z0-9._%+-]+(?:@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})?|[a-zA-Z]+)/);
    if (fromMatch && fromMatch[1]) {
      detectedSender = fromMatch[1].trim();
    }

    // 4. Open email intent
    if (text.startsWith('open') || text.includes('open the email') || text.includes('view email')) {
      return {
        success: true,
        message: `Opening email${detectedSender ? ` from ${detectedSender}` : ''}...`,
        action: {
          type: 'open_email',
          targetSender: detectedSender,
          query: prompt.replace(/open|email|the|latest|from|by/gi, '').trim()
        }
      };
    }

    // 5. Unread emails filter intent
    const isUnreadOnly = text.includes('unread');
    
    if (isUnreadOnly || detectedSender || detectedDateRange) {
      const filterObj: any = {};
      if (isUnreadOnly) filterObj.unreadOnly = true;
      if (detectedSender) filterObj.sender = detectedSender;
      if (detectedDateRange) filterObj.dateRange = detectedDateRange;

      let msg = 'Applied email filters: ';
      const parts = [];
      if (isUnreadOnly) parts.push('Unread only');
      if (detectedSender) parts.push(`From "${detectedSender}"`);
      if (detectedDateRange) parts.push(`Date range: ${detectedDateRange}`);
      msg += parts.join(', ');

      return {
        success: true,
        message: msg,
        action: {
          type: 'apply_filter',
          filter: filterObj
        }
      };
    }

    // 6. Generic search intent
    if (text.includes('search') || text.includes('find') || text.includes('look for')) {
      const searchQuery = prompt.replace(/search for|search|find|look for|emails about|emails/gi, '').trim();
      return {
        success: true,
        message: `Searching emails for "${searchQuery}"...`,
        action: {
          type: 'search_emails',
          query: searchQuery,
          filter: detectedDateRange ? { dateRange: detectedDateRange } : undefined
        }
      };
    }

    // Default response
    return {
      success: true,
      message: `Processed command: "${prompt}". I can help filter emails by sender, date range, unread status, or search keywords.`,
      action: { type: 'none' }
    };
  }
}

export const aiService = new AIService();
