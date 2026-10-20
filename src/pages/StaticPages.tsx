import React from 'react';
import { X, ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';

interface StaticPagesModalProps {
  type: 'terms' | 'privacy' | 'guidelines' | null;
  onClose: () => void;
}

export const StaticPagesModal: React.FC<StaticPagesModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              {type === 'terms' && <FileText className="w-5 h-5" />}
              {type === 'privacy' && <Lock className="w-5 h-5" />}
              {type === 'guidelines' && <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {type === 'terms' && 'Terms of Service'}
                {type === 'privacy' && 'Privacy Policy'}
                {type === 'guidelines' && 'Community Guidelines'}
              </h3>
              <p className="text-xs text-slate-400">Effective Date: October 2026</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {type === 'terms' && (
            <>
              <h4 className="text-sm font-bold text-slate-900">1. Acceptance of Terms</h4>
              <p>
                By registering, accessing, or using WorkNova, you acknowledge and agree to abide by these Terms of Service. WorkNova provides a verified marketplace connecting independent contractors ("Freelancers") with businesses and individuals seeking services ("Clients").
              </p>

              <h4 className="text-sm font-bold text-slate-900">2. Contracts and Deliverables</h4>
              <p>
                When a client accepts a freelancer proposal or orders a listed service package, a binding project contract is formed. Both parties agree to communicate respectfully, honor agreed milestones, and submit deliverables as described in the job specification.
              </p>

              <h4 className="text-sm font-bold text-slate-900">3. Authentic Reviews Policy</h4>
              <p>
                Ratings and reviews on WorkNova must be genuine reflections of work completed. Fabricated ratings, review manipulation, and deceptive feedback are strictly prohibited and result in permanent platform suspension.
              </p>
            </>
          )}

          {type === 'privacy' && (
            <>
              <h4 className="text-sm font-bold text-slate-900">1. Information We Collect</h4>
              <p>
                We collect your account profile information (display name, email, avatar), professional credentials, skills, portfolio items, and internal communication messages needed to operate the marketplace safely.
              </p>

              <h4 className="text-sm font-bold text-slate-900">2. Contact Privacy & Protection</h4>
              <p>
                WorkNova never automatically publishes your private contact details or phone numbers. If you choose to share your WhatsApp number or social links, you maintain complete control over their public visibility.
              </p>

              <h4 className="text-sm font-bold text-slate-900">3. Firebase Security & Storage</h4>
              <p>
                All account authentications and database transactions are secured using Firebase Authentication and hardened Firestore Security Rules. Sensitive account credentials are never exposed to unauthorized third parties.
              </p>
            </>
          )}

          {type === 'guidelines' && (
            <>
              <h4 className="text-sm font-bold text-slate-900">1. Professional Respect</h4>
              <p>
                Treat all community members with courtesy. Harassment, discrimination, hate speech, or deceptive solicitations are grounds for immediate account revocation.
              </p>

              <h4 className="text-sm font-bold text-slate-900">2. Quality Standards</h4>
              <p>
                Freelancers must only bid on work they have genuine skills to deliver. Clients must provide clear specifications and promptly review completed deliverables.
              </p>

              <h4 className="text-sm font-bold text-slate-900">3. Safe File Sharing</h4>
              <p>
                WorkNova allows sharing briefs, photos, videos, and project files through internal encrypted channels. Sharing malicious code, unauthorized copyrighted materials, or illegal media is strictly forbidden.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
