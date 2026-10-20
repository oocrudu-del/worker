export type UserRole = 'worker' | 'client' | 'both' | 'pending';

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
  isAdmin?: boolean;
}

export interface SocialLinks {
  whatsapp?: string; // E.g. +1234567890
  showWhatsappPublic?: boolean;
  tiktok?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  telegram?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  projectUrl?: string;
  skills: string[];
}

export interface WorkerProfile {
  uid: string;
  displayName: string;
  headline: string;
  bio: string;
  photoURL?: string;
  coverURL?: string;
  categories: string[];
  skills: string[];
  hourlyRate: number;
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  availability: 'full_time' | 'part_time' | 'not_available';
  location: string;
  timezone?: string;
  languages: string[];
  socialLinks?: SocialLinks;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  portfolio?: PortfolioItem[];
  updatedAt: string;
}

export interface ClientProfile {
  uid: string;
  displayName: string;
  companyName?: string;
  description?: string;
  photoURL?: string;
  location?: string;
  website?: string;
  neededServices?: string[];
  totalHired: number;
  totalSpent: number;
  rating: number;
  updatedAt: string;
}

export type BudgetType = 'fixed' | 'hourly';
export type JobStatus = 'open' | 'in_progress' | 'completed' | 'closed';

export interface Job {
  id: string;
  clientUid: string;
  clientName: string;
  clientPhoto?: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budgetType: BudgetType;
  budgetMin: number;
  budgetMax: number;
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  deliveryTime?: string;
  deadline?: string;
  workersNeeded?: number;
  status: JobStatus;
  proposalCount: number;
  createdAt: string;
  updatedAt?: string;
}

export type ApplicationStatus = 'submitted' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle?: string;
  workerUid: string;
  workerName: string;
  workerHeadline?: string;
  workerPhoto?: string;
  clientUid: string;
  coverLetter: string;
  proposedPrice: number;
  estimatedDays: number;
  portfolioLinks?: string[];
  status: ApplicationStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ServiceListing {
  id: string;
  workerUid: string;
  workerName: string;
  workerPhoto?: string;
  title: string;
  category: string;
  description: string;
  coverImage: string;
  startingPrice: number;
  deliveryDays: number;
  revisions: number;
  skills: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantUids: string[];
  participantDetails: {
    [uid: string]: {
      displayName: string;
      photoURL?: string;
      role?: 'worker' | 'client';
    };
  };
  lastMessageText?: string;
  lastMessageSenderUid?: string;
  lastMessageTimestamp?: string;
  unreadCount?: { [uid: string]: number };
  relatedJobId?: string;
  relatedJobTitle?: string;
  relatedProjectId?: string;
  updatedAt: string;
}

export type MessageType = 'text' | 'image' | 'file' | 'video' | 'audio';

export interface Message {
  id: string;
  conversationId: string;
  senderUid: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  messageType: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
}

export type ProjectStatus =
  | 'awaiting_start'
  | 'in_progress'
  | 'submitted_for_review'
  | 'revision_requested'
  | 'completed'
  | 'cancelled';

export interface ProjectContract {
  id: string;
  title: string;
  jobId?: string;
  clientUid: string;
  clientName: string;
  workerUid: string;
  workerName: string;
  agreedPrice: number;
  deadline?: string;
  status: ProjectStatus;
  description?: string;
  clientReviewed?: boolean;
  workerReviewed?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface Review {
  id: string;
  projectId: string;
  fromUid: string;
  fromName: string;
  fromPhoto?: string;
  fromRole: 'client' | 'worker';
  toUid: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  recipientUid: string;
  title: string;
  body: string;
  link?: string;
  type: 'message' | 'application' | 'hire' | 'review' | 'system';
  read: boolean;
  createdAt: string;
}
