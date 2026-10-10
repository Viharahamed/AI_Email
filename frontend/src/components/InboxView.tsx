import React from 'react';
import { useApp } from '../context/AppContext';
import { FilterX, Paperclip } from 'lucide-react';

export const InboxView: React.FC = () => {
  const { emails, openEmail, selectedEmailId, isLoading, filters, searchQuery, clearFilters } = useApp();

  const inboxEmails = emails.filter(e => e.folder === 'inbox');

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (isLoading && inboxEmails.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-500">Loading emails...</p>
      </div>
    );
  }

  if (inboxEmails.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 border border-slate-200">
          <FilterX className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">No emails found</h3>
        <p className="text-xs text-slate-500 max-w-xs text-center mb-4 leading-relaxed">
          {searchQuery || filters.unreadOnly || filters.sender || (filters.dateRange && filters.dateRange !== 'all')
            ? 'No emails match your current search criteria or active filters.'
            : 'Your inbox is empty.'}
        </p>
        {(searchQuery || filters.unreadOnly || filters.sender || (filters.dateRange && filters.dateRange !== 'all')) && (
          <button
            onClick={clearFilters}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200 cursor-pointer"
          >
            Clear Active Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {inboxEmails.map(email => {
        const isSelected = email.id === selectedEmailId;
        const avatarLetter = email.sender.name ? email.sender.name.charAt(0).toUpperCase() : '?';

        return (
          <div
            key={email.id}
            onClick={() => openEmail(email.id)}
            className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex items-start space-x-3 text-left relative group ${
              isSelected
                ? 'bg-white border-sky-400 shadow-md ring-2 ring-sky-400/20'
                : !email.isRead
                ? 'bg-white border-slate-200/90 shadow-sm hover:border-slate-300'
                : 'bg-white/80 border-slate-100 hover:bg-white hover:border-slate-200'
            }`}
          >
            {/* Unread Indicator Pill */}
            {!email.isRead && (
              <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-rose-500" />
            )}

            {/* Sender Avatar */}
            <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
              {avatarLetter}
            </div>

            {/* Email Summary */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center justify-between mb-1">
                <h4 className={`text-xs font-bold truncate pr-2 ${!email.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                  {email.sender.name}
                </h4>
                <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">
                  {formatDate(email.date)}
                </span>
              </div>

              <h5 className={`text-xs font-semibold truncate mb-1 ${!email.isRead ? 'text-slate-900 font-bold' : 'text-slate-800'}`}>
                {email.subject}
              </h5>

              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {email.snippet}
              </p>

              {/* Attachments Indicator if present in snippet/subject */}
              {(email.snippet.toLowerCase().includes('attachment') || email.subject.toLowerCase().includes('attachment')) && (
                <div className="mt-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100 text-[10px] font-medium">
                  <Paperclip className="w-2.5 h-2.5" />
                  <span>Attachments</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
