import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  MapPin,
  Clock,
  Globe,
  MessageSquare,
  Edit3,
  Plus,
  CheckCircle2,
  ExternalLink,
  Briefcase,
  Save,
  X,
  Phone,
  Camera,
  Loader2,
  Send,
  Upload,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getWorkerProfile, getReviewsForUser } from '../firebase/marketplaceService';
import { WorkerProfile, Review, PortfolioItem, SocialLinks } from '../types';
import { SERVICE_CATEGORIES, ALL_SKILLS } from '../data/categories';
import { getOrCreateConversation } from '../firebase/chatService';
import { uploadUserImage } from '../firebase/imageUploadService';

interface WorkerProfilePageProps {
  workerUid?: string;
  onNavigateToMessages: (convId?: string) => void;
  onOpenAuth: () => void;
}

/**
 * Format any username, handle, or URL into a clickable external link
 */
export function formatSocialUrl(platform: string, raw?: string): string {
  if (!raw || !raw.trim()) return '';
  const val = raw.trim();
  if (val.startsWith('http://') || val.startsWith('https://')) return val;

  const handle = val.replace(/^@/, '');
  switch (platform) {
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'facebook':
      return `https://www.facebook.com/${handle}`;
    case 'instagram':
      return `https://www.instagram.com/${handle}`;
    case 'twitter':
      return `https://x.com/${handle}`;
    case 'youtube':
      return val.includes('/') ? `https://www.youtube.com/${val}` : `https://www.youtube.com/@${handle}`;
    case 'linkedin':
      return val.includes('/') ? `https://www.linkedin.com/${val}` : `https://www.linkedin.com/in/${handle}`;
    case 'github':
      return `https://github.com/${handle}`;
    case 'telegram':
      return `https://t.me/${handle}`;
    case 'website':
      return `https://${val}`;
    default:
      return val;
  }
}

export const WorkerProfilePage: React.FC<WorkerProfilePageProps> = ({
  workerUid,
  onNavigateToMessages,
  onOpenAuth,
}) => {
  const { currentUser, workerProfile: myWorkerProfile, updateWorkerProfileData } = useAuth();
  const isMyProfile = !workerUid || (currentUser && workerUid === currentUser.uid);

  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);

  // Upload states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState(50);
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'intermediate' | 'expert'>('expert');
  const [availability, setAvailability] = useState<'full_time' | 'part_time' | 'not_available'>('full_time');
  const [location, setLocation] = useState('Remote');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [newSkillInput, setNewSkillInput] = useState('');

  // Portfolio add form
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pImg, setPImg] = useState('');
  const [pUrl, setPUrl] = useState('');

  useEffect(() => {
    loadProfile();
  }, [workerUid, myWorkerProfile]);

  const loadProfile = async () => {
    setLoading(true);
    const targetUid = workerUid || currentUser?.uid;
    if (!targetUid) {
      setLoading(false);
      return;
    }

    try {
      if (isMyProfile && myWorkerProfile) {
        setProfile(myWorkerProfile);
        syncForm(myWorkerProfile);
      } else {
        const fetched = await getWorkerProfile(targetUid);
        setProfile(fetched);
        if (fetched) syncForm(fetched);
      }

      const revs = await getReviewsForUser(targetUid);
      setReviews(revs);
    } catch (err) {
      console.error('Error loading worker profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncForm = (p: WorkerProfile) => {
    setHeadline(p.headline || '');
    setBio(p.bio || '');
    setHourlyRate(p.hourlyRate || 50);
    setExperienceLevel(p.experienceLevel || 'expert');
    setAvailability(p.availability || 'full_time');
    setLocation(p.location || 'Remote');
    setSelectedCategories(p.categories || []);
    setSelectedSkills(p.skills || []);
    setSocialLinks(p.socialLinks || {});
  };

  // Handle Avatar file selection & upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setUploadingAvatar(true);
    try {
      const downloadUrl = await uploadUserImage(file, 'avatar', currentUser.uid, (p) =>
        setAvatarProgress(p)
      );

      await updateWorkerProfileData({ photoURL: downloadUrl });
      setProfile((prev) => (prev ? { ...prev, photoURL: downloadUrl } : null));
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploadingAvatar(false);
      setAvatarProgress(0);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // Handle Cover / Background file selection & upload
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setUploadingCover(true);
    try {
      const downloadUrl = await uploadUserImage(file, 'cover', currentUser.uid, (p) =>
        setCoverProgress(p)
      );

      await updateWorkerProfileData({ coverURL: downloadUrl });
      setProfile((prev) => (prev ? { ...prev, coverURL: downloadUrl } : null));
    } catch (err) {
      console.error('Cover upload failed:', err);
    } finally {
      setUploadingCover(false);
      setCoverProgress(0);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const updated: Partial<WorkerProfile> = {
        headline,
        bio,
        hourlyRate: Number(hourlyRate),
        experienceLevel,
        availability,
        location,
        categories: selectedCategories,
        skills: selectedSkills,
        socialLinks,
      };

      await updateWorkerProfileData(updated);
      setProfile((prev) => (prev ? { ...prev, ...updated } : null));
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleAddSkill = () => {
    const s = newSkillInput.trim();
    if (s && !selectedSkills.includes(s)) {
      setSelectedSkills([...selectedSkills, s]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter((sk) => sk !== skill));
  };

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const newItem: PortfolioItem = {
      id: `p_${Date.now()}`,
      title: pTitle.trim(),
      description: pDesc.trim(),
      imageUrl: pImg.trim() || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      projectUrl: pUrl.trim() || undefined,
      skills: selectedSkills.slice(0, 3),
    };

    const currentPortfolio = profile.portfolio || [];
    const updatedList = [...currentPortfolio, newItem];

    await updateWorkerProfileData({ portfolio: updatedList });
    setProfile((prev) => (prev ? { ...prev, portfolio: updatedList } : null));
    setIsAddingPortfolio(false);
    setPTitle('');
    setPDesc('');
    setPImg('');
    setPUrl('');
  };

  const handleMessage = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!profile) return;

    try {
      const convId = await getOrCreateConversation(
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Client',
          photoURL: currentUser.photoURL || undefined,
          role: 'client',
        },
        {
          uid: profile.uid,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          role: 'worker',
        }
      );
      onNavigateToMessages(convId);
    } catch (err) {
      console.error('Failed to open message conversation:', err);
    }
  };

  // WhatsApp click-to-chat encoded URL
  const formatWhatsappUrl = (phone?: string) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      'Hello! I found your profile on WorkNova and would like to discuss a project.'
    )}`;
  };

  if (loading) {
    return <div className="p-20 text-center text-xs text-slate-400">Loading worker profile...</div>;
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
        <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Profile Not Found</h2>
        <p className="text-xs text-slate-500">
          This user has not completed their freelancer profile yet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hidden File Inputs for Profile Photo & Background Cover Upload */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarChange}
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/jpg"
      />
      <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverChange}
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/jpg"
      />

      {/* Top Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Cover / Background Banner */}
        <div className="h-48 sm:h-64 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative group overflow-hidden">
          {profile.coverURL ? (
            <img
              src={profile.coverURL}
              alt="cover"
              className="w-full h-full object-cover opacity-75 group-hover:scale-102 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-30 text-white font-mono text-xs">
              WorkNova Freelance Portfolio
            </div>
          )}

          {/* Change Cover Photo Button for Owner */}
          {isMyProfile && (
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-md border border-white/10 transition-all cursor-pointer"
              >
                {uploadingCover ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading Cover...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Change Background Cover</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-6">
            <div className="flex items-end gap-4">
              {/* Profile Avatar with Direct Upload Button */}
              <div className="relative group/avatar">
                <img
                  src={
                    profile.photoURL ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                  }
                  alt={profile.displayName}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-white shadow-xl bg-white shrink-0"
                />

                {isMyProfile && (
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md ring-2 ring-white transition-all cursor-pointer"
                    title="Upload profile photo"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {profile.displayName}
                  </h1>
                  <span className="p-1 rounded-full bg-indigo-50 text-indigo-600" title="Verified Pro">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                </div>
                <p className="text-sm font-semibold text-indigo-600 mt-0.5">{profile.headline}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isMyProfile ? (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-slate-500" />
                  <span>{isEditing ? 'Close Editor' : 'Edit Profile & Socials'}</span>
                </button>
              ) : (
                <button
                  onClick={handleMessage}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Contact Freelancer</span>
                </button>
              )}
            </div>
          </div>

          {/* Sub-meta details bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100 text-xs text-slate-600">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Hourly Rate</span>
              <span className="text-base font-extrabold text-slate-900">${profile.hourlyRate}/hr</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rating</span>
              <span className="text-base font-extrabold text-amber-500 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {profile.rating?.toFixed(1) || '5.0'}
                <span className="text-xs text-slate-400 font-normal">({profile.reviewCount || 0} reviews)</span>
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Availability</span>
              <span className="text-sm font-bold text-slate-800 capitalize">
                {profile.availability === 'full_time' ? 'Full Time (40h/wk)' : 'Part Time (20h/wk)'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Location</span>
              <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {profile.location || 'Remote'}
              </span>
            </div>
          </div>

          {/* Social Media & Direct Contact Badges (TikTok, Facebook, Instagram, X.com, WhatsApp, etc.) */}
          {profile.socialLinks && Object.values(profile.socialLinks).some((v) => Boolean(v)) && (
            <div className="pt-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Social Media & Direct Connect
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {/* WhatsApp Click-to-chat */}
                {profile.socialLinks.whatsapp && profile.socialLinks.showWhatsappPublic && (
                  <a
                    href={formatWhatsappUrl(profile.socialLinks.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all shadow-2xs hover:scale-102"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}

                {/* TikTok */}
                {profile.socialLinks.tiktok && (
                  <a
                    href={formatSocialUrl('tiktok', profile.socialLinks.tiktok)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-black text-xs font-semibold transition-all shadow-2xs hover:scale-102"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.33 6.33 0 0 0 1.86-4.48V8.71a8.21 8.21 0 0 0 4.91 1.62v-3.46a4.83 4.83 0 0 1-1-.18Z" />
                    </svg>
                    <span>TikTok</span>
                  </a>
                )}

                {/* Facebook */}
                {profile.socialLinks.facebook && (
                  <a
                    href={formatSocialUrl('facebook', profile.socialLinks.facebook)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold transition-all shadow-2xs hover:scale-102"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                  </a>
                )}

                {/* Instagram */}
                {profile.socialLinks.instagram && (
                  <a
                    href={formatSocialUrl('instagram', profile.socialLinks.instagram)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white text-xs font-semibold transition-all shadow-2xs hover:scale-102"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    <span>Instagram</span>
                  </a>
                )}

                {/* X.com (Twitter) */}
                {profile.socialLinks.twitter && (
                  <a
                    href={formatSocialUrl('twitter', profile.socialLinks.twitter)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black text-white hover:bg-slate-800 text-xs font-semibold transition-all shadow-2xs hover:scale-102"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>X.com</span>
                  </a>
                )}

                {/* YouTube */}
                {profile.socialLinks.youtube && (
                  <a
                    href={formatSocialUrl('youtube', profile.socialLinks.youtube)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-semibold transition-all shadow-2xs hover:scale-102"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    <span>YouTube</span>
                  </a>
                )}

                {/* LinkedIn */}
                {profile.socialLinks.linkedin && (
                  <a
                    href={formatSocialUrl('linkedin', profile.socialLinks.linkedin)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-700 text-white hover:bg-blue-800 text-xs font-semibold transition-all shadow-2xs hover:scale-102"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </a>
                )}

                {/* GitHub */}
                {profile.socialLinks.github && (
                  <a
                    href={formatSocialUrl('github', profile.socialLinks.github)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-white hover:bg-slate-900 text-xs font-semibold transition-all shadow-2xs hover:scale-102"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                  </a>
                )}

                {/* Telegram */}
                {profile.socialLinks.telegram && (
                  <a
                    href={formatSocialUrl('telegram', profile.socialLinks.telegram)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 text-white hover:bg-sky-600 text-xs font-semibold transition-all shadow-2xs hover:scale-102"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Telegram</span>
                  </a>
                )}

                {/* Website */}
                {profile.socialLinks.website && (
                  <a
                    href={formatSocialUrl('website', profile.socialLinks.website)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold transition-all shadow-2xs hover:scale-102"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Portfolio</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Form (When Active) */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-indigo-200 p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Your Profile, Photos & Social Media</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your picture, background cover banner, and configure all your social channels.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          {/* Quick Photo Upload Buttons inside Form */}
          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={profile.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt=""
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-200"
              />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Profile & Background Photos</h4>
                <p className="text-[11px] text-slate-500">Pick any image file (JPG, PNG, WEBP) from your device.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload Profile Photo</span>
              </button>

              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Background Cover</span>
              </button>
            </div>
          </div>

          {/* Headline & Hourly Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Professional Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Full-Stack React & Node Engineer"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hourly Rate ($/hr)</label>
              <input
                type="number"
                min={5}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          {/* Experience, Availability, Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as any)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="entry">Entry Level</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as any)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="full_time">Full Time (40h/wk)</option>
                <option value="part_time">Part Time (20h/wk)</option>
                <option value="not_available">Not Available</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location / Country</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Kathmandu, Nepal / Remote"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          {/* Biography */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">About & Biography</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your background, years of experience, core specialties, and client successes..."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Skills Management */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Skills & Services</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Type skill name and press Enter..."
                className="flex-1 p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedSkills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium"
                >
                  {sk}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(sk)}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* All Social Media Links Configuration (Section 5 & User Request) */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Connect All Social Media & Messenger IDs
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enter your username, handle (e.g. @yourname), or profile link for each network.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* TikTok */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  TikTok ID / Profile
                </label>
                <input
                  type="text"
                  placeholder="@yourusername or https://tiktok.com/@..."
                  value={socialLinks.tiktok || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              {/* Facebook */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Facebook ID / Profile
                </label>
                <input
                  type="text"
                  placeholder="yourusername or https://facebook.com/..."
                  value={socialLinks.facebook || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              {/* Instagram */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Instagram ID / Handle
                </label>
                <input
                  type="text"
                  placeholder="@yourusername or https://instagram.com/..."
                  value={socialLinks.instagram || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              {/* X.com (Twitter) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  X.com (Twitter) ID / Handle
                </label>
                <input
                  type="text"
                  placeholder="@yourhandle or https://x.com/..."
                  value={socialLinks.twitter || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  WhatsApp Number (+CountryCode...)
                </label>
                <input
                  type="text"
                  placeholder="+9779812345678 or +15125550198"
                  value={socialLinks.whatsapp || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
                <label className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={socialLinks.showWhatsappPublic || false}
                    onChange={(e) =>
                      setSocialLinks({ ...socialLinks, showWhatsappPublic: e.target.checked })
                    }
                    className="rounded-sm text-indigo-600"
                  />
                  <span>Display "Chat on WhatsApp" button publicly</span>
                </label>
              </div>

              {/* YouTube */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  YouTube Channel ID / URL
                </label>
                <input
                  type="text"
                  placeholder="@channelname or https://youtube.com/@..."
                  value={socialLinks.youtube || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  LinkedIn Profile
                </label>
                <input
                  type="text"
                  placeholder="in/yourname or https://linkedin.com/in/..."
                  value={socialLinks.linkedin || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              {/* GitHub */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  GitHub Profile
                </label>
                <input
                  type="text"
                  placeholder="yourusername or https://github.com/..."
                  value={socialLinks.github || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              {/* Telegram */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Telegram Username
                </label>
                <input
                  type="text"
                  placeholder="@yourusername or https://t.me/..."
                  value={socialLinks.telegram || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, telegram: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              {/* Personal Website */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Personal Website / Portfolio URL
                </label>
                <input
                  type="text"
                  placeholder="https://yourdomain.com"
                  value={socialLinks.website || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile & Socials</span>
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Left Bio & Portfolio, Right Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* About Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">About Me</h3>
            <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
              {profile.bio}
            </p>

            {/* Skills */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 mb-2">Skills & Technologies</h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills?.map((sk) => (
                  <span
                    key={sk}
                    className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio Showcase */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Portfolio & Past Projects</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real work samples and client projects</p>
              </div>

              {isMyProfile && (
                <button
                  onClick={() => setIsAddingPortfolio(true)}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              )}
            </div>

            {/* Add Portfolio Modal/Drawer */}
            {isAddingPortfolio && (
              <form onSubmit={handleAddPortfolio} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Add New Portfolio Item</h4>
                <input
                  type="text"
                  required
                  placeholder="Project Title"
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <textarea
                  rows={2}
                  required
                  placeholder="Short description of what was built and results achieved..."
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="url"
                    placeholder="Image URL (optional)"
                    value={pImg}
                    onChange={(e) => setPImg(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  <input
                    type="url"
                    placeholder="Live Project URL (optional)"
                    value={pUrl}
                    onChange={(e) => setPUrl(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingPortfolio(false)}
                    className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Add Item
                  </button>
                </div>
              </form>
            )}

            {/* Portfolio Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(profile.portfolio || []).length === 0 ? (
                <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                  No portfolio projects added yet. Click "+ Add Project" to showcase your past work.
                </div>
              ) : (
                profile.portfolio?.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50 hover:shadow-md transition-all group"
                  >
                    {item.imageUrl && (
                      <div className="h-40 overflow-hidden bg-slate-200">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </h4>
                        {item.projectUrl && (
                          <a
                            href={item.projectUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Client Reviews */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Client Reviews</h3>
              <span className="text-xs text-slate-400 font-medium">({reviews.length})</span>
            </div>

            {reviews.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No client reviews yet. Reviews are posted upon completed contracts.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            rev.fromPhoto ||
                            'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80'
                          }
                          alt={rev.fromName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-slate-800">{rev.fromName}</span>
                      </div>
                      <div className="flex items-center text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="text-xs font-bold ml-1 text-slate-800">{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">"{rev.comment}"</p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
