import React from 'react';
import { useApp } from '../context/AppContext';
import { FilterX, Send } from 'lucide-react';

export const SentView: React.FC = () => {
  const { emails, openEmail, selectedEmailId, isLoading, filters, searchQuery, clearFilters } = useApp();

  const sentEmails = emails.filter(e => e.folder === 'sent');

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (isLoading && sentEmails.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-500">Loading sent emails...</p>
      </div>
    );
  }

  if (sentEmails.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 border border-slate-200">
          <Send className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">No sent emails</h3>
        <p className="text-xs text-slate-500 max-w-xs text-center mb-4 leading-relaxed">
          {searchQuery || filters.sender
            ? 'No sent emails match your current search parameters.'
            : 'You have not sent any emails yet.'}
        </p>
        {(searchQuery || filters.sender) && (
          <button
            onClick={clearFilters}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200 cursor-pointer"
          >
            Clear Search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {sentEmails.map(email => {
        const isSelected = email.id === selectedEmailId;
        const recipientName = email.recipient?.name || email.recipient?.email || 'Recipient';
        const avatarLetter = recipientName.charAt(0).toUpperCase();

        return (
          <div
            key={email.id}
            onClick={() => openEmail(email.id)}
            className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex items-start space-x-3 text-left relative group ${
              isSelected
                ? 'bg-white border-sky-400 shadow-md ring-2 ring-sky-400/20'
                : 'bg-white border-slate-200/90 shadow-sm hover:border-slate-300'
            }`}
          >
            {/* Recipient Avatar */}
            <div className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
              {avatarLetter}
            </div>

            {/* Email Summary */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-slate-900 truncate pr-2">
                  To: {recipientName}
                </h4>
                <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">
                  {formatDate(email.date)}
                </span>
              </div>

              <h5 className="text-xs font-bold text-slate-800 truncate mb-1">
                {email.subject}
              </h5>

              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {email.snippet}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
