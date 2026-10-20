import { collection, getDocs, addDoc, doc, setDoc, query, limit } from 'firebase/firestore';
import { db } from './config';
import { Job, WorkerProfile, ServiceListing } from '../types';

export const INITIAL_WORKERS: Partial<WorkerProfile>[] = [
  {
    uid: 'worker-alex-rivers',
    displayName: 'Alex Rivers',
    headline: 'Senior Full-Stack & React / Next.js Engineer',
    bio: '8+ years creating lightning-fast SaaS products, microservices, and AI-integrated web applications. Passionate about clean code, robust architecture, and high converting UI.',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    coverURL: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    categories: ['Website Development', 'Artificial Intelligence'],
    skills: ['React Development', 'Full-Stack Development', 'Python Development', 'AI Website Integration', 'UI/UX Design'],
    hourlyRate: 65,
    experienceLevel: 'expert',
    availability: 'full_time',
    location: 'Austin, TX, USA',
    languages: ['English (Native)', 'Spanish (Conversational)'],
    socialLinks: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      whatsapp: '+15125550198',
      showWhatsappPublic: true,
      website: 'https://example.com/alex-rivers',
    },
    rating: 4.95,
    reviewCount: 38,
    completedProjects: 42,
    portfolio: [
      {
        id: 'p1',
        title: 'Modern AI-Powered Analytics Dashboard',
        description: 'Real-time telemetry and revenue forecasting using React 19, Tailwind, and Node.js.',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        projectUrl: 'https://example.com',
        skills: ['React Development', 'UI/UX Design', 'Full-Stack Development'],
      },
      {
        id: 'p2',
        title: 'Enterprise Headless E-commerce Store',
        description: 'Scalable shopfront processing 10k orders/day with sub-second page loads.',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        projectUrl: 'https://example.com',
        skills: ['E-commerce Websites', 'React Development'],
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'worker-priya-sharma',
    displayName: 'Priya Sharma',
    headline: 'Creative Video Editor & Motion Graphics Specialist',
    bio: 'Crafting viral YouTube long-forms, Reels, and 3D motion graphics for tech founders and creators with over 50M+ views generated across clients.',
    photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    coverURL: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
    categories: ['Video & Audio', 'Graphic Design'],
    skills: ['Video Editing', 'YouTube Video Editing', 'Motion Graphics', 'Thumbnail Creation', 'TikTok Video Editing'],
    hourlyRate: 50,
    experienceLevel: 'expert',
    availability: 'part_time',
    location: 'London, UK',
    languages: ['English (Fluent)', 'Hindi (Native)'],
    socialLinks: {
      youtube: 'https://youtube.com',
      instagram: 'https://instagram.com',
      whatsapp: '+447911123456',
      showWhatsappPublic: true,
    },
    rating: 5.0,
    reviewCount: 47,
    completedProjects: 53,
    portfolio: [
      {
        id: 'p3',
        title: 'Tech Documentary Series Editing',
        description: 'Sound design, pacing, and 4k cinematic grading for documentary series.',
        imageUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80',
        skills: ['Video Editing', 'Motion Graphics'],
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'worker-marcus-chen',
    displayName: 'Marcus Chen',
    headline: 'AI Agent & LLM Solutions Architect',
    bio: 'Transforming businesses with custom LangChain/Gemini pipelines, automated multi-agent workflows, and intelligent customer support bots.',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    coverURL: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    categories: ['Artificial Intelligence', 'Website Development'],
    skills: ['AI Chatbot Development', 'AI Agent Development', 'AI Automation', 'Prompt Engineering', 'Python Development'],
    hourlyRate: 85,
    experienceLevel: 'expert',
    availability: 'full_time',
    location: 'San Francisco, CA',
    languages: ['English (Fluent)', 'Mandarin (Native)'],
    socialLinks: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
    rating: 4.98,
    reviewCount: 29,
    completedProjects: 31,
    portfolio: [
      {
        id: 'p4',
        title: 'Autonomous Customer Support Agent',
        description: 'Reduced support resolution time by 72% using autonomous retrieval and tool calling.',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
        skills: ['AI Agent Development', 'Prompt Engineering'],
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'worker-elena-rostova',
    displayName: 'Elena Rostova',
    headline: 'Senior Brand Identity & UI/UX Designer',
    bio: 'Designing unforgettable digital products, design systems, and visual identities for Fortune 500 companies and high-growth YC startups.',
    photoURL: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    coverURL: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    categories: ['Graphic Design', 'Website Development'],
    skills: ['Brand Identity', 'Logo Design', 'UI/UX Design', 'UI Design', 'Social Media Posts'],
    hourlyRate: 55,
    experienceLevel: 'expert',
    availability: 'full_time',
    location: 'Berlin, Germany',
    languages: ['English (Fluent)', 'German (Conversational)'],
    socialLinks: {
      website: 'https://example.com/elena',
      instagram: 'https://instagram.com',
    },
    rating: 4.92,
    reviewCount: 41,
    completedProjects: 45,
    portfolio: [
      {
        id: 'p5',
        title: 'FinTech Mobile App Redesign',
        description: 'Complete UX overhaul increasing user engagement by 44%.',
        imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=800&q=80',
        skills: ['UI/UX Design', 'Brand Identity'],
      },
    ],
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_JOBS: Partial<Job>[] = [
  {
    clientUid: 'client-stellar-labs',
    clientName: 'Stellar Labs Inc.',
    clientPhoto: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    title: 'Senior React & Node.js Full-Stack Developer for FinTech Portal',
    description: 'We are seeking an experienced Full-Stack Engineer to lead the front-end overhaul and API integrations for our automated investment platform. Must be proficient with React 19, TypeScript, state management, and secure webhook integrations.',
    category: 'Website Development',
    skills: ['React Development', 'Full-Stack Development', 'Backend Development', 'UI/UX Design'],
    budgetType: 'fixed',
    budgetMin: 3500,
    budgetMax: 5000,
    experienceLevel: 'expert',
    deliveryTime: '3-4 weeks',
    deadline: '2026-11-15',
    status: 'open',
    proposalCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    clientUid: 'client-creator-hub',
    clientName: 'Creator Media Network',
    clientPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    title: 'Professional YouTube & Short-Form Video Editor Wanted',
    description: 'Looking for a talented editor for our technology and startup channel (450K subscribers). Responsibilities include pacing, sound effects, motion titles, B-roll selection, and cutting 3 viral Shorts per week.',
    category: 'Video & Audio',
    skills: ['Video Editing', 'YouTube Video Editing', 'Shorts Editing', 'Motion Graphics', 'Thumbnail Creation'],
    budgetType: 'hourly',
    budgetMin: 40,
    budgetMax: 65,
    experienceLevel: 'intermediate',
    deliveryTime: 'Ongoing (Weekly)',
    deadline: '2026-11-01',
    status: 'open',
    proposalCount: 7,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    clientUid: 'client-ai-innovate',
    clientName: 'Nexus AI Solutions',
    clientPhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
    title: 'Build Custom AI Chatbot & Customer Automation Workflow',
    description: 'Need an AI specialist to deploy an intelligent agent that parses our internal knowledge base (PDFs and docs), handles client inquiries 24/7, and triggers appointment booking in our CRM.',
    category: 'Artificial Intelligence',
    skills: ['AI Chatbot Development', 'AI Automation', 'Prompt Engineering', 'Python Development'],
    budgetType: 'fixed',
    budgetMin: 2000,
    budgetMax: 3500,
    experienceLevel: 'expert',
    deliveryTime: '2 weeks',
    deadline: '2026-11-10',
    status: 'open',
    proposalCount: 3,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    clientUid: 'client-urban-brand',
    clientName: 'Aura Lifestyle',
    clientPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    title: 'Brand Identity, Minimalist Logo & Packaging Design',
    description: 'We are launching an eco-friendly organic skincare line. Looking for a high-end designer to create our visual identity, logo variations, color palette, typography guidelines, and packaging mockups.',
    category: 'Graphic Design',
    skills: ['Brand Identity', 'Logo Design', 'Poster Design', 'Photo Editing'],
    budgetType: 'fixed',
    budgetMin: 1200,
    budgetMax: 2200,
    experienceLevel: 'intermediate',
    deliveryTime: '10 days',
    deadline: '2026-11-05',
    status: 'open',
    proposalCount: 5,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

export const INITIAL_SERVICES: Partial<ServiceListing>[] = [
  {
    workerUid: 'worker-priya-sharma',
    workerName: 'Priya Sharma',
    workerPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    title: 'I will professionally edit your YouTube videos with engaging retention pacing',
    category: 'Video & Audio',
    description: 'Elevate your content with cinema-grade color correction, crisp sound design, smooth zooms, animations, and high-retention storytelling.',
    coverImage: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    startingPrice: 120,
    deliveryDays: 3,
    revisions: 3,
    skills: ['Video Editing', 'YouTube Video Editing', 'Motion Graphics'],
    rating: 5.0,
    reviewCount: 34,
    createdAt: new Date().toISOString(),
  },
  {
    workerUid: 'worker-alex-rivers',
    workerName: 'Alex Rivers',
    workerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    title: 'I will build a modern, high-converting responsive web application in React & Tailwind',
    category: 'Website Development',
    description: 'Get a clean, production-ready web application built with modern React 19, TypeScript, responsive mobile styling, and database connectivity.',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    startingPrice: 350,
    deliveryDays: 5,
    revisions: 4,
    skills: ['Website Development', 'React Development', 'UI/UX Design'],
    rating: 4.95,
    reviewCount: 28,
    createdAt: new Date().toISOString(),
  },
  {
    workerUid: 'worker-marcus-chen',
    workerName: 'Marcus Chen',
    workerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    title: 'I will develop an intelligent custom AI chatbot and automation pipeline',
    category: 'Artificial Intelligence',
    description: 'Full integration of Gemini or Claude LLMs with your documents, API webhooks, customer service workflows, and auto-reply bots.',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    startingPrice: 450,
    deliveryDays: 4,
    revisions: 2,
    skills: ['AI Chatbot Development', 'AI Automation', 'Prompt Engineering'],
    rating: 4.98,
    reviewCount: 19,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Seed Firestore with initial marketplace items if empty
 */
export async function seedMarketplaceIfEmpty() {
  try {
    const jobsSnap = await getDocs(query(collection(db, 'jobs'), limit(1)));
    if (jobsSnap.empty) {
      console.log('Seeding initial marketplace jobs & workers...');
      // Seed jobs
      for (const job of INITIAL_JOBS) {
        await addDoc(collection(db, 'jobs'), job);
      }
      // Seed workers
      for (const worker of INITIAL_WORKERS) {
        if (worker.uid) {
          await setDoc(doc(db, 'workerProfiles', worker.uid), worker);
        }
      }
      // Seed services
      for (const service of INITIAL_SERVICES) {
        await addDoc(collection(db, 'services'), service);
      }
      console.log('Marketplace successfully initialized with starter data.');
    }
  } catch (err) {
    console.warn('Seeding check note:', err);
  }
}
