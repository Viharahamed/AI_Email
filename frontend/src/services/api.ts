import { Email, MailFilter, SendEmailPayload } from '../types/mail';

const API_BASE = '/api/mail';
const AUTH_BASE = '/api/auth';

function buildFilterParams(filters?: MailFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (!filters) return params;

  if (filters.unreadOnly) params.append('unread', 'true');
  if (filters.sender) params.append('sender', filters.sender);
  if (filters.keyword) params.append('keyword', filters.keyword);
  if (filters.dateRange) params.append('dateRange', filters.dateRange);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  return params;
}

export async function fetchInboxApi(filters?: MailFilter): Promise<Email[]> {
  const params = buildFilterParams(filters);
  const res = await fetch(`${API_BASE}/inbox?${params.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch inbox');
  return json.data;
}

export async function fetchSentApi(filters?: MailFilter): Promise<Email[]> {
  const params = buildFilterParams(filters);
  const res = await fetch(`${API_BASE}/sent?${params.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch sent emails');
  return json.data;
}

export async function fetchEmailDetailApi(id: string): Promise<Email> {
  const res = await fetch(`${API_BASE}/email/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch email detail');
  return json.data;
}

export async function searchEmailsApi(query: string, filters?: MailFilter): Promise<Email[]> {
  const params = buildFilterParams(filters);
  params.append('q', query);

  const res = await fetch(`${API_BASE}/search?${params.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to search emails');
  return json.data;
}

export async function sendEmailApi(payload: SendEmailPayload): Promise<Email> {
  const res = await fetch(`${API_BASE}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to send email');
  return json.data;
}

// Authentication APIs
export async function fetchAuthStatusApi(): Promise<{ authenticated: boolean; user?: any; provider: 'gmail' | 'mock' }> {
  const res = await fetch(`${AUTH_BASE}/status`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch auth status');
  return { authenticated: json.authenticated, user: json.user, provider: json.provider };
}

export async function getGoogleAuthUrlApi(): Promise<string> {
  const res = await fetch(`${AUTH_BASE}/google/url`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to get auth URL');
  return json.url;
}

export async function logoutApi(): Promise<void> {
  await fetch(`${AUTH_BASE}/logout`, { method: 'POST' });
}

// AI Assistant APIs
export async function processAiPromptApi(prompt: string, context: any) {
  const res = await fetch('/api/ai/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, context })
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'AI request failed');
  return json;
}

