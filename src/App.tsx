import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { ApplyJobModal } from './components/ApplyJobModal';
import { ReviewModal } from './components/ReviewModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StaticPagesModal } from './pages/StaticPages';
import { HomePage } from './pages/HomePage';
import { JobsPage } from './pages/JobsPage';
import { TalentPage } from './pages/TalentPage';
import { ServicesPage } from './pages/ServicesPage';
import { PostJobPage } from './pages/PostJobPage';
import { MessagesPage } from './pages/MessagesPage';
import { WorkerProfilePage } from './pages/WorkerProfilePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { DashboardPage } from './pages/DashboardPage';
import { testConnection } from './firebase/connectionTest';
import { seedMarketplaceIfEmpty } from './firebase/seedData';
import { Job, ProjectContract } from './types';

function MainApp() {
  const { currentUser } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedWorkerUid, setSelectedWorkerUid] = useState<string | undefined>(undefined);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyModalJob, setApplyModalJob] = useState<Job | null>(null);
  const [reviewModalProject, setReviewModalProject] = useState<ProjectContract | null>(null);
  const [staticPolicyType, setStaticPolicyType] = useState<'terms' | 'privacy' | 'guidelines' | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // 1. Validate connection to Firestore on boot as mandated by skill
    testConnection();
    // 2. Initialize default marketplace items if empty
    seedMarketplaceIfEmpty();
  }, []);

  const handleNavigate = (tab: string, filter?: string) => {
    if (filter) setSearchFilter(filter);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToMessages = (convId?: string) => {
    if (convId) setActiveConversationId(convId);
    setCurrentTab('messages');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectWorker = (workerUid: string) => {
    setSelectedWorkerUid(workerUid);
    setCurrentTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setCurrentTab('jobs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenApplyModal = (job: Job) => {
    setApplyModalJob(job);
  };

  const handleOpenReviewModal = (project: ProjectContract) => {
    setReviewModalProject(project);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'profile') {
            setSelectedWorkerUid(undefined); // default to own profile
          }
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectWorker={handleSelectWorker}
            onSelectJob={handleSelectJob}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {currentTab === 'jobs' && (
          <JobsPage
            initialSearch={searchFilter}
            onOpenApplyModal={handleOpenApplyModal}
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigateToMessages={handleNavigateToMessages}
            onNavigate={handleNavigate}
            selectedJobProp={selectedJob}
          />
        )}

        {currentTab === 'talent' && (
          <TalentPage
            onSelectWorker={handleSelectWorker}
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigateToMessages={handleNavigateToMessages}
          />
        )}

        {currentTab === 'services' && (
          <ServicesPage
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigateToMessages={handleNavigateToMessages}
            onSelectWorker={handleSelectWorker}
          />
        )}

        {currentTab === 'post-job' && (
          <PostJobPage
            onJobCreated={() => {
              setCurrentTab('jobs');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {currentTab === 'messages' && (
          <MessagesPage
            onSelectWorker={handleSelectWorker}
            onOpenAuth={() => setAuthModalOpen(true)}
            initialConversationId={activeConversationId}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectsPage
            onOpenReviewModal={handleOpenReviewModal}
            onNavigateToMessages={handleNavigateToMessages}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            onNavigate={setCurrentTab}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSelectJob={handleSelectJob}
            onSelectWorker={handleSelectWorker}
            onNavigateToMessages={handleNavigateToMessages}
          />
        )}

        {currentTab === 'profile' && (
          <WorkerProfilePage
            workerUid={selectedWorkerUid}
            onNavigateToMessages={handleNavigateToMessages}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenPolicy={(type) => setStaticPolicyType(type)}
      />

      {/* Modals & Dialogs */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <RoleSelectionModal />
      <ApplyJobModal
        job={applyModalJob}
        isOpen={Boolean(applyModalJob)}
        onClose={() => setApplyModalJob(null)}
        onApplied={() => {
          // Handled inside modal
        }}
      />
      <ReviewModal
        project={reviewModalProject}
        isOpen={Boolean(reviewModalProject)}
        onClose={() => setReviewModalProject(null)}
      />
      <StaticPagesModal
        type={staticPolicyType}
        onClose={() => setStaticPolicyType(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
