import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Send, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

export const ComposeModal: React.FC = () => {
  const { composeState, closeCompose, updateComposeForm, sendEmail, isLoading, error } = useApp();
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);

  // Accessibility: Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && composeState.isOpen) {
        closeCompose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [composeState.isOpen, closeCompose]);

  if (!composeState.isOpen) return null;

  const handleSendClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeState.to || !composeState.subject || !composeState.body) return;
    setShowConfirm(true);
  };

  const confirmAndExecuteSend = async () => {
    setShowConfirm(false);
    const success = await sendEmail();
    if (success) {
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
      }, 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Compose Email Message"
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5252] animate-pulse" />
            <h3 className="font-bold text-slate-800 text-base">
              {composeState.mode === 'reply' ? 'Reply to Email' : composeState.mode === 'forward' ? 'Forward Email' : 'New Message'}
            </h3>
          </div>
          <button
            onClick={closeCompose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            aria-label="Close compose modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {sendSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
            <span>Email sent successfully!</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSendClick} className="p-6 space-y-4 flex-1 flex flex-col">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">To</label>
            <input
              type="email"
              required
              value={composeState.to}
              onChange={(e) => updateComposeForm({ to: e.target.value })}
              placeholder="recipient@example.com"
              aria-label="Recipient Email Address"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Subject</label>
            <input
              type="text"
              required
              value={composeState.subject}
              onChange={(e) => updateComposeForm({ subject: e.target.value })}
              placeholder="Enter subject line..."
              aria-label="Email Subject"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex-1 flex flex-col min-h-[180px]">
            <label className="block text-xs font-bold text-slate-600 mb-1">Message Body</label>
            <textarea
              required
              value={composeState.body}
              onChange={(e) => updateComposeForm({ body: e.target.value })}
              placeholder="Write your email here..."
              aria-label="Email Message Body"
              className="w-full flex-1 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 resize-none font-sans leading-relaxed transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={closeCompose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              Discard Draft
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl coral-btn text-white font-bold text-sm shadow-md flex items-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isLoading ? 'Sending...' : 'Send Email'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Human-in-the-Loop Send Confirmation Dialog */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Email Send"
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-60 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-sky-600">
              <Sparkles className="w-6 h-6 text-purple-600 animate-bounce" />
              <h4 className="font-bold text-lg text-slate-800">Confirm Email Send</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to send this email through the connected mail provider?
            </p>
            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-700 border border-slate-200/80">
              <p><strong>To:</strong> {composeState.to}</p>
              <p><strong>Subject:</strong> {composeState.subject}</p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndExecuteSend}
                className="px-4 py-2 rounded-xl coral-btn text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Confirm & Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
