import React, { useState } from 'react';
import {
  Briefcase,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  ArrowRight,
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '../data/categories';
import { useAuth } from '../contexts/AuthContext';
import { createJob } from '../firebase/marketplaceService';

interface PostJobPageProps {
  onJobCreated: (jobId: string) => void;
  onOpenAuth: () => void;
}

export const PostJobPage: React.FC<PostJobPageProps> = ({ onJobCreated, onOpenAuth }) => {
  const { currentUser, clientProfile } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(SERVICE_CATEGORIES[1].name); // Website Development default
  const [description, setDescription] = useState('');
  const [budgetType, setBudgetType] = useState<'fixed' | 'hourly'>('fixed');
  const [budgetMin, setBudgetMin] = useState(1500);
  const [budgetMax, setBudgetMax] = useState(3000);
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'intermediate' | 'expert'>('expert');
  const [deliveryTime, setDeliveryTime] = useState('2-3 weeks');
  const [deadline, setDeadline] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(['React Development', 'TypeScript', 'UI/UX Design']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (!title.trim()) throw new Error('Please enter a job title');
      if (!description.trim()) throw new Error('Please enter a detailed job description');
      if (skills.length === 0) throw new Error('Please add at least one required skill');
      if (budgetMin > budgetMax) throw new Error('Minimum budget cannot exceed maximum budget');

      const jobId = await createJob({
        clientUid: currentUser.uid,
        clientName: clientProfile?.companyName || clientProfile?.displayName || currentUser.displayName || 'Client',
        clientPhoto: clientProfile?.photoURL || currentUser.photoURL || undefined,
        title: title.trim(),
        description: description.trim(),
        category,
        skills,
        budgetType,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        experienceLevel,
        deliveryTime,
        deadline: deadline || undefined,
        status: 'open',
      });

      onJobCreated(jobId);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to publish job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="p-8 bg-slate-900 text-white relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> For Hiring Clients & Companies
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Post a New Project</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
            Specify your technical requirements, deliverables, and budget. Receive proposals from vetted talent within hours.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Job Title */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Project Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., I need a Senior React & Node Developer for our SaaS platform"
              className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Category & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Service Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white"
              >
                {SERVICE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Required Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as any)}
                className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white"
              >
                <option value="entry">Entry Level (Junior)</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert / Senior</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Detailed Description & Objectives <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what needs to be built, preferred tech stack, milestones, wireframes/specifications, and key success metrics..."
              className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Skills Required */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Required Skills & Technologies <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Type a skill and press Enter or Add (e.g. Next.js, Python, Tailwind)..."
                className="flex-1 p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Budget Model */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Budget & Payment Structure
            </h4>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="radio"
                  name="budgetType"
                  checked={budgetType === 'fixed'}
                  onChange={() => setBudgetType('fixed')}
                  className="w-4 h-4 text-indigo-600"
                />
                Fixed-Price Project
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="radio"
                  name="budgetType"
                  checked={budgetType === 'hourly'}
                  onChange={() => setBudgetType('hourly')}
                  className="w-4 h-4 text-indigo-600"
                />
                Hourly Rate
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {budgetType === 'fixed' ? 'Minimum Budget ($)' : 'Min Hourly ($/hr)'}
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    required
                    min={5}
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {budgetType === 'fixed' ? 'Maximum Budget ($)' : 'Max Hourly ($/hr)'}
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    required
                    min={5}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Expected Delivery Timeline
              </label>
              <input
                type="text"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                placeholder="e.g. 2-3 weeks, or 1 month"
                className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Application Deadline (Optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>{loading ? 'Publishing Job...' : 'Publish Job Listing'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
