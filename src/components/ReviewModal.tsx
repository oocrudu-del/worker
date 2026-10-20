import React, { useState } from 'react';
import { X, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProjectContract } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { submitReview } from '../firebase/marketplaceService';

interface ReviewModalProps {
  project: ProjectContract | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ project, isOpen, onClose, onReviewSubmitted }) => {
  const { currentUser, userAccount } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !project || !currentUser) return null;

  const isClient = currentUser.uid === project.clientUid;
  const targetUid = isClient ? project.workerUid : project.clientUid;
  const targetName = isClient ? project.workerName : project.clientName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!comment.trim()) {
        throw new Error('Please enter a written review.');
      }

      await submitReview({
        projectId: project.id,
        fromUid: currentUser.uid,
        fromName: currentUser.displayName || 'User',
        fromPhoto: currentUser.photoURL || undefined,
        fromRole: isClient ? 'client' : 'worker',
        toUid: targetUid,
        rating,
        comment: comment.trim(),
      });

      if (onReviewSubmitted) onReviewSubmitted();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Leave Feedback</span>
            <h3 className="text-base font-bold mt-1">Review {targetName}</h3>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">Project: {project.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star Rating */}
            <div className="text-center py-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2">Overall Rating</label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        (hoverRating || rating) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500 font-medium mt-1 block">
                {rating === 5 && 'Outstanding experience (5/5)'}
                {rating === 4 && 'Very good work (4/5)'}
                {rating === 3 && 'Average delivery (3/5)'}
                {rating === 2 && 'Needs improvement (2/5)'}
                {rating === 1 && 'Unsatisfactory (1/5)'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Written Feedback</label>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience working on this contract, communication quality, and deliverables..."
                className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
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
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Post Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
