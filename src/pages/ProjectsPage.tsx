import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Star,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProjectsForUser, updateProjectStatus } from '../firebase/marketplaceService';
import { ProjectContract } from '../types';
import { getOrCreateConversation } from '../firebase/chatService';

interface ProjectsPageProps {
  onOpenReviewModal: (project: ProjectContract) => void;
  onNavigateToMessages: () => void;
  onOpenAuth: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  onOpenReviewModal,
  onNavigateToMessages,
  onOpenAuth,
}) => {
  const { currentUser, userAccount } = useAuth();
  const [projects, setProjects] = useState<ProjectContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (currentUser) {
      loadProjects();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadProjects = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const list = await getProjectsForUser(currentUser.uid);
      setProjects(list);
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (projectId: string, newStatus: ProjectContract['status']) => {
    try {
      await updateProjectStatus(projectId, newStatus);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      console.error('Failed to update project status:', err);
    }
  };

  const handleOpenChat = async (proj: ProjectContract) => {
    if (!currentUser) return;
    const isClient = currentUser.uid === proj.clientUid;
    const targetUid = isClient ? proj.workerUid : proj.clientUid;
    const targetName = isClient ? proj.workerName : proj.clientName;

    try {
      await getOrCreateConversation(
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'User',
          photoURL: currentUser.photoURL || undefined,
          role: isClient ? 'client' : 'worker',
        },
        {
          uid: targetUid,
          displayName: targetName,
          role: isClient ? 'worker' : 'client',
        },
        { id: proj.jobId || proj.id, title: proj.title }
      );
      onNavigateToMessages();
    } catch (err) {
      console.error('Error opening chat for contract:', err);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to View Contracts</h2>
        <p className="text-xs text-slate-500">
          Manage your active contracts, deliverables, milestones, and client feedback.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
        >
          Sign In
        </button>
      </div>
    );
  }

  const filteredProjects = projects.filter((p) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return p.status !== 'completed' && p.status !== 'cancelled';
    if (statusFilter === 'completed') return p.status === 'completed';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Contracts & Project Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track active deliverables, request revisions, mark completions, and exchange reviews.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            All ({projects.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'active' ? 'bg-white text-indigo-600 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'completed' ? 'bg-white text-emerald-600 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Contracts List */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
          Loading contracts...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
          <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No contracts found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When a client accepts a proposal or hires a freelancer, an active contract is generated here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((proj) => {
            const isClient = currentUser.uid === proj.clientUid;
            const otherPartyName = isClient ? proj.workerName : proj.clientName;
            const hasReviewed = isClient ? proj.clientReviewed : proj.workerReviewed;

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-indigo-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          proj.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : proj.status === 'in_progress'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : proj.status === 'submitted_for_review'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {proj.status.replace(/_/g, ' ')}
                      </span>

                      <span className="text-xs text-slate-400">
                        Created {new Date(proj.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{proj.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {isClient ? 'Hired Freelancer: ' : 'Client: '}
                      <span className="font-semibold text-slate-800">{otherPartyName}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xl font-black text-slate-900 block">
                      ${proj.agreedPrice}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Agreed Milestone Budget
                    </span>
                  </div>
                </div>

                {/* State Transition Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenChat(proj)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span>Contract Chat</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Worker action: Submit for review */}
                    {!isClient && proj.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusChange(proj.id, 'submitted_for_review')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        Submit Deliverable for Review
                      </button>
                    )}

                    {/* Client actions: Approve & Complete, or Request Revision */}
                    {isClient && proj.status === 'submitted_for_review' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(proj.id, 'revision_requested')}
                          className="px-3 py-1.5 border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Request Revision
                        </button>
                        <button
                          onClick={() => handleStatusChange(proj.id, 'completed')}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                        >
                          Approve & Complete
                        </button>
                      </>
                    )}

                    {/* Client action: Complete directly if already in progress */}
                    {isClient && proj.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusChange(proj.id, 'completed')}
                        className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Mark Completed
                      </button>
                    )}

                    {/* Review Action */}
                    {proj.status === 'completed' && !hasReviewed && (
                      <button
                        onClick={() => onOpenReviewModal(proj)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-slate-900 text-slate-900" />
                        <span>Leave Review</span>
                      </button>
                    )}

                    {proj.status === 'completed' && hasReviewed && (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Review Submitted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
