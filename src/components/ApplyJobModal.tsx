import React, { useState } from 'react';
import { X, Send, DollarSign, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Job } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { submitApplication } from '../firebase/marketplaceService';

interface ApplyJobModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export const ApplyJobModal: React.FC<ApplyJobModalProps> = ({ job, isOpen, onClose, onApplied }) => {
  const { currentUser, workerProfile } = useAuth();
  const [proposedPrice, setProposedPrice] = useState<number>(job ? job.budgetMin : 500);
  const [estimatedDays, setEstimatedDays] = useState<number>(7);
  const [coverLetter, setCoverLetter] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError(null);
    setLoading(true);

    try {
      if (!coverLetter.trim()) {
        throw new Error('Please write a cover letter describing your approach.');
      }

      await submitApplication({
        jobId: job.id,
        jobTitle: job.title,
        workerUid: currentUser.uid,
        workerName: workerProfile?.displayName || currentUser.displayName || 'Freelancer',
        workerHeadline: workerProfile?.headline || 'Professional Freelancer',
        workerPhoto: workerProfile?.photoURL || currentUser.photoURL || undefined,
        clientUid: job.clientUid,
        coverLetter: coverLetter.trim(),
        proposedPrice: Number(proposedPrice),
        estimatedDays: Number(estimatedDays),
        portfolioLinks: portfolioLink ? [portfolioLink.trim()] : [],
      });

      setSuccess(true);
      if (onApplied) onApplied();
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1800);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit proposal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
              Submit Proposal
            </span>
            <h3 className="text-lg font-bold mt-1 line-clamp-1">{job.title}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Client budget:{' '}
              {job.budgetType === 'fixed'
                ? `$${job.budgetMin} - $${job.budgetMax} (Fixed)`
                : `$${job.budgetMin} - $${job.budgetMax}/hr`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Proposal Submitted!</h4>
              <p className="text-xs text-slate-500">
                The client has been notified and will review your proposal shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Bid Amount ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="number"
                      required
                      min={5}
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimated Delivery (Days)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="number"
                      required
                      min={1}
                      max={180}
                      value={estimatedDays}
                      onChange={(e) => setEstimatedDays(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cover Letter & Proposal Details
                </label>
                <textarea
                  required
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself, your relevant experience with these skills, and how you will execute this project successfully..."
                  className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relevant Portfolio Link (Optional)
                </label>
                <input
                  type="url"
                  value={portfolioLink}
                  onChange={(e) => setPortfolioLink(e.target.value)}
                  placeholder="https://github.com/... or https://dribbble.com/..."
                  className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Submitting...' : 'Submit Proposal'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
