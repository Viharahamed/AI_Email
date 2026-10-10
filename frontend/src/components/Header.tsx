import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Filter, X, RefreshCw, MailCheck, Calendar, User, Sparkles, Menu } from 'lucide-react';
import { DateRangePreset } from '../types/mail';

interface HeaderProps {
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const {
    currentView,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    clearFilters,
    fetchInbox,
    fetchSent,
    isLoading,
    isAssistantOpen,
    toggleAssistant
  } = useApp();

  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  const activeFilterCount =
    (filters.unreadOnly ? 1 : 0) +
    (filters.sender ? 1 : 0) +
    (filters.keyword ? 1 : 0) +
    (filters.dateRange && filters.dateRange !== 'all' ? 1 : 0);

  const handleRefresh = () => {
    if (currentView === 'inbox') fetchInbox();
    else if (currentView === 'sent') fetchSent();
  };

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 py-3 flex flex-col space-y-2.5">
      {/* Search Input Bar & Mobile Sidebar Trigger */}
      <div className="relative flex items-center space-x-2">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-all cursor-pointer flex-shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search emails"
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200/90 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          {/* Date Range Selector */}
          <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200/80 px-2.5 py-1.5 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <select
              value={filters.dateRange || 'all'}
              onChange={(e) => setFilters({ dateRange: e.target.value as DateRangePreset })}
              aria-label="Select date range filter"
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="10days">Last 10 Days</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
          </div>

          {/* Unread Filter Toggle */}
          <button
            onClick={() => setFilters({ unreadOnly: !filters.unreadOnly })}
            aria-label="Toggle unread emails filter"
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 border transition-all cursor-pointer ${
              filters.unreadOnly
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <MailCheck className="w-3.5 h-3.5" />
            <span>Unread</span>
          </button>

          {/* Sender Filter Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            aria-label="Toggle sender filter input"
            className={`p-1.5 rounded-xl border font-semibold transition-all cursor-pointer ${
              showAdvancedFilters || filters.sender
                ? 'bg-sky-50 text-sky-600 border-sky-200'
                : 'bg-slate-50 text-slate-500 border-slate-200/80 hover:bg-slate-100'
            }`}
            title="Filter by Sender"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Refresh & AI Assistant Drawer Toggles */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleRefresh}
            title="Refresh Mailbox"
            aria-label="Refresh Mailbox"
            className="p-1.5 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200/80 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
          <button
            onClick={toggleAssistant}
            title="Toggle Aura AI Assistant"
            aria-label="Toggle Aura AI Assistant"
            className={`p-1.5 rounded-xl border font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
              isAssistantOpen
                ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm'
                : 'bg-slate-50 text-slate-500 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
          </button>
        </div>
      </div>

      {/* Advanced Sender Filter Bar & Active Filter Badges */}
      {(showAdvancedFilters || activeFilterCount > 0) && (
        <div className="flex flex-col space-y-2 pt-1 border-t border-slate-100 text-xs">
          {showAdvancedFilters && (
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
              <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={filters.sender || ''}
                onChange={(e) => setFilters({ sender: e.target.value })}
                placeholder="Filter by sender name or email..."
                aria-label="Filter by sender name or email"
                className="bg-transparent text-slate-800 text-xs focus:outline-none w-full placeholder-slate-400"
              />
              {filters.sender && (
                <button
                  onClick={() => setFilters({ sender: '' })}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Remove sender filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Active Filter Badges */}
          <div className="flex items-center justify-between flex-wrap gap-1">
            <div className="flex items-center space-x-1.5 flex-wrap">
              {filters.dateRange && filters.dateRange !== 'all' && (
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center space-x-1 font-semibold text-[11px]">
                  <span>Range: {filters.dateRange}</span>
                  <button
                    onClick={() => setFilters({ dateRange: 'all' })}
                    className="hover:text-sky-900"
                    aria-label="Remove date range filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.sender && (
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center space-x-1 font-semibold text-[11px]">
                  <span>Sender: {filters.sender}</span>
                  <button
                    onClick={() => setFilters({ sender: '' })}
                    className="hover:text-sky-900"
                    aria-label="Remove sender filter tag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.unreadOnly && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1 font-semibold text-[11px]">
                  <span>Unread Only</span>
                  <button
                    onClick={() => setFilters({ unreadOnly: false })}
                    className="hover:text-rose-900"
                    aria-label="Remove unread filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Clear all active filters"
              >
                Clear All ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
