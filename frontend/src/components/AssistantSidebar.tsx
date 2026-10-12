import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Bot, Eye, Send, ArrowRight, Zap, X } from 'lucide-react';
import { processAiPromptApi } from '../services/api';
import { ChatMessage, AIActionPayload } from '../types/ai';

const stripHtmlToText = (text: string): string => {
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text) || text.includes('<!DOCTYPE') || text.includes('&nbsp;') || text.includes('&amp;')) {
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/td>/gi, ' ')
      .replace(/<hr\s*\/?>/gi, '\n---\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&mdash;/gi, '—')
      .replace(/&ndash;/gi, '–')
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();
  }
  return text;
};

export const AssistantSidebar: React.FC = () => {
  const {
    isAssistantOpen,
    toggleAssistant,
    currentView,
    selectedEmailId,
    currentEmail,
    filters,
    searchQuery,
    emails,
    setCurrentView,
    setFilters,
    clearFilters,
    setSearchQuery,
    openEmail,
    openCompose
  } = useApp();

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Hello! I am Aura AI, your email assistant. Ask me to filter emails, search, open messages, or draft emails using natural language.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAssistantOpen) {
      scrollToBottom();
    }
  }, [messages, isProcessing, isAssistantOpen]);

  // Accessibility: Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAssistantOpen) {
        toggleAssistant();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAssistantOpen, toggleAssistant]);

  if (!isAssistantOpen) return null;

  // Execute tool action returned by AI Backend
  const executeToolAction = (action: AIActionPayload): string => {
    switch (action.type) {
      case 'navigate': {
        if (action.view) {
          setCurrentView(action.view);
          return `Switched view to ${action.view.toUpperCase()}`;
        }
        return 'Navigation completed';
      }

      case 'clear_filters': {
        clearFilters();
        if (currentView === 'email-detail') setCurrentView('inbox');
        return 'Reset all search & filter options';
      }

      case 'apply_filter': {
        if (action.filter) {
          setFilters(action.filter);
          if (currentView === 'email-detail') setCurrentView('inbox');
          const filterKeys = Object.keys(action.filter);
          return `Applied filters (${filterKeys.join(', ')})`;
        }
        return 'Filters applied';
      }

      case 'search_emails': {
        if (action.filter) {
          setFilters(action.filter);
        }
        if (action.query !== undefined) {
          setSearchQuery(action.query);
          if (currentView === 'email-detail') setCurrentView('inbox');
          return `Searched for "${action.query}"`;
        }
        return 'Search query executed';
      }

      case 'open_email': {
        let targetId = action.emailId;
        if (!targetId && emails.length > 0) {
          if (action.targetSender) {
            const senderLower = action.targetSender.toLowerCase();
            const matched = emails.find(
              e =>
                e.sender.name.toLowerCase().includes(senderLower) ||
                e.sender.email.toLowerCase().includes(senderLower)
            );
            if (matched) targetId = matched.id;
          }
          if (!targetId && action.query) {
            const qLower = action.query.toLowerCase();
            const matched = emails.find(
              e =>
                e.subject.toLowerCase().includes(qLower) ||
                e.snippet.toLowerCase().includes(qLower)
            );
            if (matched) targetId = matched.id;
          }
          if (!targetId) {
            targetId = emails[0].id;
          }
        }

        if (targetId) {
          openEmail(targetId);
          return `Opened target email #${targetId.slice(-4)}`;
        }
        return 'No matching email found to open';
      }

      case 'draft_email': {
        const draft = action.draft;
        openCompose({
          to: draft?.to || '',
          subject: draft?.subject || '',
          body: draft?.body || '',
          mode: 'new'
        });
        return draft?.to 
          ? `Created draft to ${draft.to}` 
          : 'Created draft in compose window';
      }

      case 'reply_email': {
        const draft = action.draft;
        const targetTo = draft?.to || currentEmail?.sender.email || '';
        const targetSubject = draft?.subject || (currentEmail ? (currentEmail.subject.startsWith('Re:') ? currentEmail.subject : `Re: ${currentEmail.subject}`) : 'Re: Conversation');
        const targetBody = draft?.body || '';

        openCompose({
          to: targetTo,
          subject: targetSubject,
          body: targetBody,
          mode: 'reply',
          replyToEmailId: draft?.replyToEmailId || currentEmail?.id
        });
        return targetTo 
          ? `Prepared reply to ${targetTo}` 
          : 'Prepared reply draft in compose window';
      }

      case 'none':
      default:
        return '';
    }
  };

  const handleSendPrompt = async (promptToSend?: string) => {
    const textToSubmit = promptToSend || inputPrompt;
    if (!textToSubmit.trim() || isProcessing) return;

    const userMsgId = Date.now().toString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSubmit,
      timestamp: timeStr
    };

    setMessages(prev => [...prev, userMessage]);
    if (!promptToSend) setInputPrompt('');
    setIsProcessing(true);

    try {
      const activeEmail = currentEmail || (selectedEmailId ? emails.find(e => e.id === selectedEmailId) : null);
      const rawBody = activeEmail?.body ? activeEmail.body.substring(0, 8000) : (activeEmail?.snippet || '');
      const cleanBody = stripHtmlToText(rawBody);

      const contextData = {
        currentView,
        selectedEmailId: activeEmail?.id || selectedEmailId,
        selectedEmail: activeEmail ? {
          id: activeEmail.id,
          sender: activeEmail.sender,
          recipient: activeEmail.recipient,
          subject: activeEmail.subject,
          date: activeEmail.date,
          snippet: activeEmail.snippet,
          body: cleanBody,
          isTruncated: activeEmail.body ? activeEmail.body.length > 8000 : false
        } : null,
        filters,
        searchQuery
      };

      const response = await processAiPromptApi(textToSubmit, contextData);

      let actionNotice = '';
      if (response.action && response.action.type !== 'none') {
        actionNotice = executeToolAction(response.action);
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: response.message || 'Done.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionTaken: actionNotice || undefined
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `Error processing request: ${err.message || 'Could not connect to AI service'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const suggestedPrompts = [
    'Summarize this email',
    'What is the main request?',
    'List the action items',
    'Draft an email to test@example.com about project deadline',
    'Reply to this email saying I accept the meeting invitation',
    'Show unread emails from Sarah',
    'Find emails from last 10 days',
    'Clear all filters'
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        onClick={toggleAssistant}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 lg:hidden transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        role="dialog"
        aria-label="Aura AI Assistant Panel"
        className="w-80 md:w-96 bg-white border-l border-slate-200/90 shadow-2xl flex flex-col h-full select-none z-40 fixed right-0 top-0 bottom-0 md:relative rounded-l-3xl overflow-hidden font-sans"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Aura AI Assistant</h3>
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-semibold">Active & Context Aware</span>
              </div>
            </div>
          </div>
          <button
            onClick={toggleAssistant}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            title="Close Assistant Drawer (Esc)"
            aria-label="Close Assistant Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {/* Tracked Context Inspector */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-xs space-y-2 shadow-sm">
            <div className="flex items-center space-x-1.5 text-indigo-600 font-bold">
              <Eye className="w-3.5 h-3.5" />
              <span>Tracked Application Context</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-mono">
              <div>
                <span className="text-slate-400">View:</span>{' '}
                <strong className="text-slate-800">{currentView}</strong>
              </div>
              <div>
                <span className="text-slate-400">Email ID:</span>{' '}
                <strong className="text-slate-800 truncate">{selectedEmailId ? selectedEmailId.slice(-6) : 'None'}</strong>
              </div>
            </div>
            {currentEmail && (
              <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200/60 truncate">
                <span className="text-indigo-600 font-bold">Open: </span>
                {currentEmail.subject}
              </div>
            )}
            {(filters.unreadOnly || filters.sender || filters.dateRange || searchQuery) && (
              <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200/60 truncate space-y-0.5">
                {filters.unreadOnly && <div>• Unread Only</div>}
                {filters.sender && <div>• Sender: {filters.sender}</div>}
                {filters.dateRange && <div>• Range: {filters.dateRange}</div>}
                {searchQuery && <div>• Search: "{searchQuery}"</div>}
              </div>
            )}
          </div>

          {/* Chat Messages Log */}
          <div className="space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.actionTaken && (
                    <div className="mt-2 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg flex items-center space-x-1 font-mono">
                      <Zap className="w-3 h-3 text-emerald-600" />
                      <span>{msg.actionTaken}</span>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center space-x-2 text-xs text-indigo-600 bg-indigo-50 p-3 rounded-2xl border border-indigo-100 animate-pulse">
                <Bot className="w-4 h-4 animate-spin text-purple-600" />
                <span>Aura AI is evaluating request & executing tools...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Commands */}
          <div className="space-y-2 pt-2 border-t border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Tools</span>
            <div className="flex flex-wrap gap-1.5">
              {suggestedPrompts.map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPrompt(promptText)}
                  disabled={isProcessing}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 transition-all text-left flex items-center space-x-1 group shadow-2xs cursor-pointer"
                >
                  <span>{promptText}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Dock */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              placeholder="Ask AI assistant..."
              aria-label="Ask AI assistant prompt"
              className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 disabled:opacity-50"
            />
            <button
              onClick={() => handleSendPrompt()}
              disabled={!inputPrompt.trim() || isProcessing}
              aria-label="Send AI prompt"
              className="absolute right-2 p-1.5 rounded-lg coral-btn text-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
