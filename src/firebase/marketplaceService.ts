import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import {
  Job,
  JobApplication,
  ServiceListing,
  ProjectContract,
  Review,
  AppNotification,
  WorkerProfile,
  ClientProfile,
} from '../types';

/* ========================================================
   JOBS SERVICE
   ======================================================== */
export async function createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'proposalCount'>): Promise<string> {
  const jobsRef = collection(db, 'jobs');
  const now = new Date().toISOString();
  const docRef = await addDoc(jobsRef, {
    ...jobData,
    proposalCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function getJobs(category?: string, searchTerm?: string): Promise<Job[]> {
  const jobsRef = collection(db, 'jobs');
  let q = query(jobsRef, orderBy('createdAt', 'desc'), limit(50));
  if (category && category !== 'All') {
    q = query(jobsRef, where('category', '==', category), limit(50));
  }
  const snap = await getDocs(q);
  let results: Job[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Job, 'id'>) }));

  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    results = results.filter(
      (j) =>
        j.title.toLowerCase().includes(term) ||
        j.description.toLowerCase().includes(term) ||
        j.skills?.some((s) => s.toLowerCase().includes(term))
    );
  }
  return results;
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const docSnap = await getDoc(doc(db, 'jobs', jobId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...(docSnap.data() as Omit<Job, 'id'>) };
}

export async function deleteJob(jobId: string): Promise<void> {
  await deleteDoc(doc(db, 'jobs', jobId));
}

export async function closeJob(jobId: string): Promise<void> {
  await updateDoc(doc(db, 'jobs', jobId), { status: 'closed', updatedAt: new Date().toISOString() });
}

/* ========================================================
   APPLICATIONS SERVICE
   ======================================================== */
export async function submitApplication(
  data: Omit<JobApplication, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  // Prevent duplicate applications
  const q = query(
    collection(db, 'jobApplications'),
    where('jobId', '==', data.jobId),
    where('workerUid', '==', data.workerUid)
  );
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error('You have already submitted an application for this job.');
  }

  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'jobApplications'), {
    ...data,
    status: 'submitted',
    createdAt: now,
    updatedAt: now,
  });

  // Increment proposal count on job
  try {
    const jobSnap = await getDoc(doc(db, 'jobs', data.jobId));
    if (jobSnap.exists()) {
      const currentCount = jobSnap.data().proposalCount || 0;
      await updateDoc(doc(db, 'jobs', data.jobId), {
        proposalCount: currentCount + 1,
        updatedAt: now,
      });
    }
  } catch (err) {
    console.warn('Could not increment proposal count:', err);
  }

  // Notify client
  await sendNotification(
    data.clientUid,
    'New Job Proposal Received',
    `${data.workerName} applied for your job: ${data.jobTitle || 'Your job post'}`,
    `/dashboard?tab=applicants&jobId=${data.jobId}`,
    'application'
  );

  return docRef.id;
}

export async function getApplicationsForJob(jobId: string): Promise<JobApplication[]> {
  const q = query(collection(db, 'jobApplications'), where('jobId', '==', jobId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<JobApplication, 'id'>) }));
}

export async function getApplicationsByWorker(workerUid: string): Promise<JobApplication[]> {
  const q = query(collection(db, 'jobApplications'), where('workerUid', '==', workerUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<JobApplication, 'id'>) }));
}

export async function updateApplicationStatus(
  applicationId: string,
  status: JobApplication['status'],
  workerUid?: string,
  jobTitle?: string
): Promise<void> {
  await updateDoc(doc(db, 'jobApplications', applicationId), {
    status,
    updatedAt: new Date().toISOString(),
  });

  if (workerUid) {
    await sendNotification(
      workerUid,
      `Application Status Updated: ${status.toUpperCase()}`,
      `Your proposal for "${jobTitle || 'the project'}" is now marked as ${status}.`,
      '/dashboard?tab=proposals',
      'application'
    );
  }
}

/* ========================================================
   SERVICES (GIGS) SERVICE
   ======================================================== */
export async function createServiceListing(data: Omit<ServiceListing, 'id' | 'createdAt' | 'rating' | 'reviewCount'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'services'), {
    ...data,
    rating: 5.0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getServices(category?: string, searchTerm?: string): Promise<ServiceListing[]> {
  const sRef = collection(db, 'services');
  let q = query(sRef, limit(50));
  if (category && category !== 'All') {
    q = query(sRef, where('category', '==', category), limit(50));
  }
  const snap = await getDocs(q);
  let results: ServiceListing[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ServiceListing, 'id'>) }));

  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    results = results.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term) ||
        s.skills?.some((sk) => sk.toLowerCase().includes(term))
    );
  }
  return results;
}

/* ========================================================
   WORKERS DIRECTORY
   ======================================================== */
export async function getAllWorkers(category?: string, searchTerm?: string): Promise<WorkerProfile[]> {
  const snap = await getDocs(collection(db, 'workerProfiles'));
  let workers: WorkerProfile[] = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<WorkerProfile, 'uid'>) }));

  if (category && category !== 'All') {
    workers = workers.filter((w) => w.categories?.includes(category));
  }

  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    workers = workers.filter(
      (w) =>
        w.displayName?.toLowerCase().includes(term) ||
        w.headline?.toLowerCase().includes(term) ||
        w.bio?.toLowerCase().includes(term) ||
        w.skills?.some((s) => s.toLowerCase().includes(term))
    );
  }

  return workers;
}

export async function getWorkerProfile(uid: string): Promise<WorkerProfile | null> {
  const snap = await getDoc(doc(db, 'workerProfiles', uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...(snap.data() as Omit<WorkerProfile, 'uid'>) };
}

/* ========================================================
   PROJECTS (CONTRACTS) SERVICE
   ======================================================== */
export async function createProjectContract(
  data: Omit<ProjectContract, 'id' | 'createdAt' | 'status' | 'clientReviewed' | 'workerReviewed'>
): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'projects'), {
    ...data,
    status: 'in_progress',
    clientReviewed: false,
    workerReviewed: false,
    createdAt: now,
  });

  // Notify both
  await sendNotification(
    data.workerUid,
    'Contract Started!',
    `Congratulations! A new project "${data.title}" has been started by ${data.clientName}.`,
    '/projects',
    'hire'
  );

  return docRef.id;
}

export async function getProjectsForUser(uid: string): Promise<ProjectContract[]> {
  // Query both as client and worker
  const clientQ = query(collection(db, 'projects'), where('clientUid', '==', uid));
  const workerQ = query(collection(db, 'projects'), where('workerUid', '==', uid));

  const [clientSnap, workerSnap] = await Promise.all([getDocs(clientQ), getDocs(workerQ)]);

  const list: ProjectContract[] = [];
  clientSnap.docs.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<ProjectContract, 'id'>) }));
  workerSnap.docs.forEach((d) => {
    if (!list.some((p) => p.id === d.id)) {
      list.push({ id: d.id, ...(d.data() as Omit<ProjectContract, 'id'>) });
    }
  });

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateProjectStatus(projectId: string, status: ProjectContract['status']): Promise<void> {
  const updates: Partial<ProjectContract> = { status };
  if (status === 'completed') {
    updates.completedAt = new Date().toISOString();
  }
  await updateDoc(doc(db, 'projects', projectId), updates);
}

/* ========================================================
   REVIEWS SERVICE
   ======================================================== */
export async function submitReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'reviews'), {
    ...reviewData,
    createdAt: now,
  });

  // Mark project as reviewed
  const projRef = doc(db, 'projects', reviewData.projectId);
  if (reviewData.fromRole === 'client') {
    await updateDoc(projRef, { clientReviewed: true });
    // Update worker's rating and review count
    const workerRef = doc(db, 'workerProfiles', reviewData.toUid);
    const workerSnap = await getDoc(workerRef);
    if (workerSnap.exists()) {
      const wData = workerSnap.data() as WorkerProfile;
      const count = (wData.reviewCount || 0) + 1;
      const newRating = Number((((wData.rating || 5) * (count - 1) + reviewData.rating) / count).toFixed(2));
      await updateDoc(workerRef, {
        rating: newRating,
        reviewCount: count,
        completedProjects: (wData.completedProjects || 0) + 1,
      });
    }
  } else {
    await updateDoc(projRef, { workerReviewed: true });
  }

  // Notify recipient
  await sendNotification(
    reviewData.toUid,
    'New Review Received!',
    `${reviewData.fromName} left you a ${reviewData.rating}-star review.`,
    `/profile/${reviewData.toUid}`,
    'review'
  );

  return docRef.id;
}

export async function getReviewsForUser(uid: string): Promise<Review[]> {
  const q = query(collection(db, 'reviews'), where('toUid', '==', uid), orderBy('createdAt', 'desc'));
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }));
  } catch (err) {
    // In case composite index isn't ready, fallback to where without orderBy
    const fallbackQ = query(collection(db, 'reviews'), where('toUid', '==', uid));
    const snap = await getDocs(fallbackQ);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

/* ========================================================
   NOTIFICATIONS SERVICE
   ======================================================== */
export async function sendNotification(
  recipientUid: string,
  title: string,
  body: string,
  link = '',
  type: AppNotification['type'] = 'system'
): Promise<void> {
  try {
    await addDoc(collection(db, 'notifications'), {
      recipientUid,
      title,
      body,
      link,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to send notification:', err);
  }
}

export async function getNotifications(uid: string): Promise<AppNotification[]> {
  try {
    const q = query(collection(db, 'notifications'), where('recipientUid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<AppNotification, 'id'>) }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn('Notification fetch warning:', err);
    return [];
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', id), { read: true });
}
