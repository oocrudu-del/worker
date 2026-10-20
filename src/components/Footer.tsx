import React from 'react';
import { Briefcase, ShieldCheck, Zap, Lock, Globe, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
  onOpenPolicy: (type: 'terms' | 'privacy' | 'guidelines') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenPolicy }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-slate-800 text-center sm:text-left">
          <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Protected Milestones</h4>
              <p className="text-slate-400 text-xs mt-0.5">Clear contract terms, deliverables review, and mutual protection.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Instant Real-Time Chat</h4>
              <p className="text-slate-400 text-xs mt-0.5">Share briefs, files, videos, and specifications without delay.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Verified Talent & Reviews</h4>
              <p className="text-slate-400 text-xs mt-0.5">Zero fabricated ratings. Authentic client feedback on completed work.</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12">
          {/* Brand Info */}
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Work<span className="text-indigo-400">Nova</span>
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-400 leading-relaxed max-w-sm">
              The premier marketplace connecting ambitious companies with world-class engineers, designers, video editors, AI specialists, and digital marketers.
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs text-slate-400">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Global Remote Network · Active across 120+ countries</span>
            </div>
          </div>

          {/* For Clients */}
          <div>
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">For Clients</h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => onNavigate('talent')} className="hover:text-white transition-colors cursor-pointer">
                  Find Freelancers
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('post-job')} className="hover:text-white transition-colors cursor-pointer">
                  Post a Project
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors cursor-pointer">
                  Browse Service Gigs
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('jobs')} className="hover:text-white transition-colors cursor-pointer">
                  Marketplace Pricing
                </button>
              </li>
            </ul>
          </div>

          {/* For Freelancers */}
          <div>
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">For Freelancers</h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => onNavigate('jobs')} className="hover:text-white transition-colors cursor-pointer">
                  Explore Open Jobs
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('profile')} className="hover:text-white transition-colors cursor-pointer">
                  Create Portfolio
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors cursor-pointer">
                  List Your Services
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-white transition-colors cursor-pointer">
                  Freelancer Hub
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Policies */}
          <div>
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Trust & Policies</h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => onOpenPolicy('terms')} className="hover:text-white transition-colors cursor-pointer">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('privacy')} className="hover:text-white transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('guidelines')} className="hover:text-white transition-colors cursor-pointer">
                  Community Standards
                </button>
              </li>
              <li>
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Firebase Secured
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 WorkNova Marketplace. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with modern architecture for global talent.
          </p>
        </div>
      </div>
    </footer>
  );
};
