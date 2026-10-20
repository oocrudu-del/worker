import React, { useState } from 'react';
import { UserCheck, Briefcase, Building, Check, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const RoleSelectionModal: React.FC = () => {
  const { needsRoleSelection, selectInitialRole, currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'worker' | 'client' | null>(null);
  const [loading, setLoading] = useState(false);

  if (!needsRoleSelection) return null;

  const handleConfirm = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      await selectInitialRole(selectedRole);
    } catch (err) {
      console.error('Error setting initial role:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="p-8 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Welcome to WorkNova, {currentUser?.displayName || 'there'}!
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">What would you like to do?</h2>
          <p className="text-indigo-200 text-sm mt-2 max-w-lg mx-auto">
            Choose your primary experience. You can seamlessly switch or enable both roles anytime in your settings.
          </p>
        </div>

        {/* Options */}
        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option A: Worker / Freelancer */}
            <div
              onClick={() => setSelectedRole('worker')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedRole === 'worker'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-100 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                      selectedRole === 'worker'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900">I am a Worker / Freelancer</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Showcase your skills, set your hourly rate, apply for client jobs, publish service gigs, and get paid for your expertise.
                </p>
                <div className="mt-4 space-y-1.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>Apply to thousands of verified jobs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>Publish custom service packages</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>Direct WhatsApp & internal chat</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Option B: Client / Hire Someone */}
            <div
              onClick={() => setSelectedRole('client')}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedRole === 'client'
                  ? 'border-emerald-600 bg-emerald-50/50 ring-4 ring-emerald-100 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <Building className="w-6 h-6" />
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                      selectedRole === 'client'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900">I want to Hire Someone / Client</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Post project requirements, discover vetted talent, evaluate proposals, manage contracts, and review deliverables.
                </p>
                <div className="mt-4 space-y-1.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Post fixed-price or hourly projects</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Search & filter vetted talent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Real-time file sharing & contracts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleConfirm}
              disabled={!selectedRole || loading}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{loading ? 'Setting up your profile...' : 'Continue to WorkNova'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
