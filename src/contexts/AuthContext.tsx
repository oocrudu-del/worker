import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserAccount, WorkerProfile, ClientProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userAccount: UserAccount | null;
  workerProfile: WorkerProfile | null;
  clientProfile: ClientProfile | null;
  activeRole: 'worker' | 'client';
  setActiveRole: (role: 'worker' | 'client') => void;
  loading: boolean;
  needsRoleSelection: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  selectInitialRole: (role: 'worker' | 'client') => Promise<void>;
  updateWorkerProfileData: (data: Partial<WorkerProfile>) => Promise<void>;
  updateClientProfileData: (data: Partial<ClientProfile>) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [activeRole, setActiveRole] = useState<'worker' | 'client'>('worker');
  const [loading, setLoading] = useState(true);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  const fetchUserData = async (user: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const acc = userSnap.data() as UserAccount;
        setUserAccount(acc);

        if (acc.role === 'pending') {
          setNeedsRoleSelection(true);
        } else {
          setNeedsRoleSelection(false);
          if (acc.role === 'client') {
            setActiveRole('client');
          } else if (acc.role === 'worker') {
            setActiveRole('worker');
          }
        }
      } else {
        // First-time registration or Google Sign-In: create user doc with pending role
        const newAccount: UserAccount = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || undefined,
          role: 'pending',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newAccount);
        setUserAccount(newAccount);
        setNeedsRoleSelection(true);
      }

      // Fetch worker profile if exists
      const workerRef = doc(db, 'workerProfiles', user.uid);
      const workerSnap = await getDoc(workerRef);
      if (workerSnap.exists()) {
        setWorkerProfile(workerSnap.data() as WorkerProfile);
      }

      // Fetch client profile if exists
      const clientRef = doc(db, 'clientProfiles', user.uid);
      const clientSnap = await getDoc(clientRef);
      if (clientSnap.exists()) {
        setClientProfile(clientSnap.data() as ClientProfile);
      }
    } catch (err) {
      console.error('Error fetching user data from Firestore:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user);
      } else {
        setUserAccount(null);
        setWorkerProfile(null);
        setClientProfile(null);
        setNeedsRoleSelection(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfiles = async () => {
    if (currentUser) {
      await fetchUserData(currentUser);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (res.user) {
      await updateProfile(res.user, { displayName: name });
      const newAccount: UserAccount = {
        uid: res.user.uid,
        email: res.user.email || '',
        displayName: name,
        role: 'pending',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', res.user.uid), newAccount);
      setUserAccount(newAccount);
      setNeedsRoleSelection(true);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserAccount(null);
    setWorkerProfile(null);
    setClientProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const selectInitialRole = async (role: 'worker' | 'client') => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);

    await updateDoc(userRef, {
      role: role,
      updatedAt: new Date().toISOString(),
    });

    if (role === 'worker') {
      const initialWorker: WorkerProfile = {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Freelancer',
        headline: 'Professional Freelancer',
        bio: 'Welcome to my profile. I am dedicated to delivering high quality results.',
        photoURL: currentUser.photoURL || undefined,
        categories: ['Website Development'],
        skills: ['React Development', 'Website Development'],
        hourlyRate: 45,
        experienceLevel: 'intermediate',
        availability: 'full_time',
        location: 'Remote',
        languages: ['English'],
        rating: 5.0,
        reviewCount: 0,
        completedProjects: 0,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'workerProfiles', currentUser.uid), initialWorker);
      setWorkerProfile(initialWorker);
      setActiveRole('worker');
    } else {
      const initialClient: ClientProfile = {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Client',
        description: 'Looking to hire talented professionals for quality projects.',
        photoURL: currentUser.photoURL || undefined,
        location: 'Remote',
        totalHired: 0,
        totalSpent: 0,
        rating: 5.0,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'clientProfiles', currentUser.uid), initialClient);
      setClientProfile(initialClient);
      setActiveRole('client');
    }

    setNeedsRoleSelection(false);
    setUserAccount((prev) => (prev ? { ...prev, role } : null));
  };

  const updateWorkerProfileData = async (data: Partial<WorkerProfile>) => {
    if (!currentUser) return;
    const workerRef = doc(db, 'workerProfiles', currentUser.uid);
    const updated = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(workerRef, updated, { merge: true });
    setWorkerProfile((prev) => (prev ? { ...prev, ...updated } : (updated as WorkerProfile)));
  };

  const updateClientProfileData = async (data: Partial<ClientProfile>) => {
    if (!currentUser) return;
    const clientRef = doc(db, 'clientProfiles', currentUser.uid);
    const updated = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(clientRef, updated, { merge: true });
    setClientProfile((prev) => (prev ? { ...prev, ...updated } : (updated as ClientProfile)));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userAccount,
        workerProfile,
        clientProfile,
        activeRole,
        setActiveRole,
        loading,
        needsRoleSelection,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        resetPassword,
        selectInitialRole,
        updateWorkerProfileData,
        updateClientProfileData,
        refreshProfiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
