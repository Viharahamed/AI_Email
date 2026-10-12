import React from 'react';
import { useApp } from '../context/AppContext';
import { Reply, Forward, Calendar, Tag, Mail, Trash2, ArrowLeft, Send } from 'lucide-react';

export const EmailDetailView: React.FC = () => {
  const { currentEmail, setCurrentView, selectEmail, openCompose, isLoading } = useApp();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 bg-white h-full">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-500">Loading email details...</p>
      </div>
    );
  }

  // Empty state when no email is selected
  if (!currentEmail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white h-full text-slate-400 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4 border border-slate-200">
          <Mail className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-slate-700 mb-1">No email selected</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Select an email from the mailbox list on the left to read its contents and reply.
        </p>
      </div>
    );
  }

  const handleReply = () => {
    openCompose({
      to: currentEmail.sender.email,
      subject: currentEmail.subject.startsWith('Re:') ? currentEmail.subject : `Re: ${currentEmail.subject}`,
      body: `\n\n--- On ${new Date(currentEmail.date).toLocaleString()}, ${currentEmail.sender.name} wrote:\n> ${currentEmail.body.replace(/\n/g, '\n> ')}`,
      mode: 'reply',
      replyToEmailId: currentEmail.id
    });
  };

  const handleForward = () => {
    openCompose({
      to: '',
      subject: currentEmail.subject.startsWith('Fwd:') ? currentEmail.subject : `Fwd: ${currentEmail.subject}`,
      body: `\n\n---------- Forwarded message ---------\nFrom: ${currentEmail.sender.name} <${currentEmail.sender.email}>\nDate: ${new Date(currentEmail.date).toLocaleString()}\nSubject: ${currentEmail.subject}\nTo: ${currentEmail.recipient.name} <${currentEmail.recipient.email}>\n\n${currentEmail.body}`,
      mode: 'forward'
    });
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  const avatarLetter = currentEmail.sender.name ? currentEmail.sender.name.charAt(0).toUpperCase() : '?';

  const htmlContent = currentEmail.htmlBody || (
    /<!DOCTYPE|<html|<body|<div|<p>|<table|<br\s*\/?>/i.test(currentEmail.body) 
      ? currentEmail.body 
      : ''
  );
  const isHtml = Boolean(htmlContent && htmlContent.trim());

  const getSanitizedHtmlDoc = (raw: string): string => {
    // Defense-in-depth sanitization: remove scripts, objects, embeds, active handlers
    const clean = raw
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/href\s*=\s*["']?javascript:[^"'>]*["']?/gi, 'href="#"')
      .replace(/src\s*=\s*["']?javascript:[^"'>]*["']?/gi, '');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https: http:; style-src 'unsafe-inline' https: http:; font-src data: https:; frame-src 'none'; script-src 'none';">
  <base target="_blank">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1e293b;
      margin: 16px;
      padding: 0;
      background-color: #ffffff;
      word-break: break-word;
    }
    img { max-width: 100%; height: auto; }
    table { max-width: 100%; }
    a { color: #0284c7; text-decoration: underline; }
  </style>
</head>
<body>
  ${clean}
</body>
</html>`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden text-slate-800">
      {/* Top Toolbar (Inspired by Reference Screenshot) */}
      <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentView('inbox')}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center space-x-1.5 transition-all border border-slate-200/80 cursor-pointer"
            title="Back to List"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>

        {/* Action Icons: Reply, Forward, Delete */}
        <div className="flex items-center space-x-2 text-slate-500">
          <button
            onClick={handleReply}
            title="Reply"
            className="p-2 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-600 border border-slate-200/80 transition-all cursor-pointer"
          >
            <Reply className="w-4 h-4" />
          </button>
          <button
            onClick={handleForward}
            title="Forward"
            className="p-2 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-600 border border-slate-200/80 transition-all cursor-pointer"
          >
            <Forward className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentView('inbox')}
            title="Delete"
            className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Email Body Workspace */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-4xl w-full mx-auto">
        {/* Email Header: Sender Avatar, Name, Timestamp */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
              {avatarLetter}
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-tight">
                {currentEmail.sender.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentEmail.sender.email}
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400 font-medium">
            {formatDate(currentEmail.date)}
          </div>
        </div>

        {/* Email Subject Heading */}
        <div>
          {currentEmail.labels && currentEmail.labels.length > 0 && (
            <div className="flex items-center space-x-1.5 mb-2">
              {currentEmail.labels.map((label, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Tag className="w-2.5 h-2.5" />
                  <span>{label}</span>
                </span>
              ))}
            </div>
          )}
          <h1 className="text-xl font-bold text-slate-900 leading-snug">
            {currentEmail.subject}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            To: <span className="text-slate-600 font-semibold">{currentEmail.recipient.name}</span> ({currentEmail.recipient.email})
          </p>
        </div>

        {/* Full Email Body Container */}
        {isHtml ? (
          <div className="w-full rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
            <iframe
              title="Email Content"
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              srcDoc={getSanitizedHtmlDoc(htmlContent)}
              className="w-full min-h-[450px] h-[65vh] border-0 bg-white"
            />
          </div>
        ) : (
          <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/80 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans min-h-[200px]">
            {currentEmail.body}
          </div>
        )}

        {/* Quick Reply Dock Bar (Matching Reference Screenshot Style) */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="text-slate-400 font-medium pl-2">Click reply to respond to {currentEmail.sender.name}...</span>
            <button
              onClick={handleReply}
              className="px-4 py-2 rounded-xl coral-btn text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Reply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
