import React, { useState, useEffect } from 'react';
import { getEmployerJobs, postEmployerJob, updateEmployerJob, deleteEmployerJob, getSkills } from '../../services/api';
import { Button, Input, Select, Spinner, useToast, Card, Badge } from '../../components/ui';
import { Eye, Edit3, Trash2, Plus, X, Briefcase, MapPin, DollarSign, Clock, Users, CheckCircle2, Search, Sparkles } from 'lucide-react';

const jobTypes = [
  { label: 'Full Time', value: 'FULL_TIME' },
  { label: 'Part Time', value: 'PART_TIME' },
  { label: 'Internship', value: 'INTERNSHIP' },
  { label: 'Contract', value: 'CONTRACT' }
];

const proficiencies = [
  { label: 'Beginner', value: 'BEGINNER' },
  { label: 'Intermediate', value: 'INTERMEDIATE' },
  { label: 'Advanced', value: 'ADVANCED' }
];

export default function JobPostings() {
  const toast = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [viewJob, setViewJob] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const initForm = {
    title: '',
    sector: 'Automotive & EV',
    description: '',
    job_type: 'FULL_TIME',
    internship_duration: '3 Months',
    proficiency_required: 'INTERMEDIATE',
    experience_years: 1,
    salary_min: '',
    salary_max: '',
    openings_count: 1,
    city: 'Pune',
    state: 'Maharashtra'
  };

  const [form, setForm] = useState<any>(initForm);
  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [customSkillInput, setCustomSkillInput] = useState('');

  useEffect(() => {
    fetchJobs();
    getSkills().then(res => setSkillsList(res.data)).catch(() => {});
  }, []);

  const fetchJobs = () => {
    setLoading(true);
    getEmployerJobs().then(res => {
      setJobs(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const openNew = () => {
    setEditId(null);
    setForm(initForm);
    setSelectedSkills([]);
    setCustomSkillInput('');
    setSkillSearch('');
    setShowForm(true);
    setViewJob(null);
  };

  const handleAddCustomSkill = (nameOverride?: string) => {
    const raw = (nameOverride || customSkillInput).trim();
    if (!raw) return;

    if (selectedSkills.some(s => s.name.toLowerCase() === raw.toLowerCase())) {
      toast.error(`Skill "${raw}" is already selected`);
      setCustomSkillInput('');
      return;
    }

    const existing = skillsList.find(s => s.name.toLowerCase() === raw.toLowerCase());
    if (existing) {
      setSelectedSkills(prev => [...prev, { id: existing.id, name: existing.name, is_required: true }]);
    } else {
      setSelectedSkills(prev => [...prev, { id: `custom-${Date.now()}`, name: raw, is_required: true, is_custom: true }]);
      toast.success(`Custom skill "${raw}" added. It will be registered to the skills platform when this job is posted.`);
    }
    setCustomSkillInput('');
    setSkillSearch('');
  };

  const openEdit = (job: any) => {
    setEditId(job.id);
    setForm({
      title: job.title || '',
      sector: job.sector || 'Technology',
      description: job.description || '',
      job_type: job.job_type || 'FULL_TIME',
      internship_duration: job.internship_duration || '3 Months',
      proficiency_required: job.proficiency_required || 'INTERMEDIATE',
      experience_years: job.experience_years ?? 1,
      salary_min: job.salary_min || '',
      salary_max: job.salary_max || '',
      openings_count: job.openings_count || 1,
      city: job.city || '',
      state: job.state || ''
    });

    // Match skills
    const mapped = (job.skills || []).map((skName: string) => {
      const found = skillsList.find(s => s.name.toLowerCase() === skName.toLowerCase());
      return found ? { id: found.id, name: found.name, is_required: true } : { id: `custom-${Date.now()}`, name: skName, is_required: true, is_custom: true };
    }).filter(Boolean);
    setSelectedSkills(mapped);
    setCustomSkillInput('');
    setSkillSearch('');
    setShowForm(true);
    setViewJob(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this job posting?')) return;
    setDeletingId(id);
    try {
      await deleteEmployerJob(id.toString());
      toast.success('Job posting permanently deleted');
      setJobs(prev => prev.filter(j => j.id !== id));
      if (viewJob?.id === id) setViewJob(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete job posting');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        sector: form.sector,
        description: form.description,
        job_type: form.job_type,
        internship_duration: form.job_type === 'INTERNSHIP' ? form.internship_duration : null,
        proficiency_required: form.proficiency_required,
        experience_years: Number(form.experience_years) || 0,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        openings_count: Number(form.openings_count) || 1,
        city: form.city,
        state: form.state,
        skills: selectedSkills.map(s => ({
          skill_id: typeof s.id === 'number' ? s.id : null,
          skill_name: s.name,
          is_required: s.is_required !== false,
        }))
      };

      if (editId) {
        await updateEmployerJob(editId.toString(), payload);
        toast.success('Job posting updated successfully!');
      } else {
        await postEmployerJob(payload);
        toast.success('New job posted successfully!');
      }
      
      setShowForm(false);
      fetchJobs();
      getSkills().then(res => setSkillsList(res.data)).catch(() => {});
    } catch (e: any) {
      toast.error(e.message || 'Error saving job posting');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !jobs.length) {
    return <div className="flex justify-center p-12"><Spinner /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Postings & Requirements</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage job vacancies, specify required technical skills, experience, and view candidate responses</p>
        </div>
        <Button onClick={showForm && !editId ? () => setShowForm(false) : openNew} className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          {showForm && !editId ? 'Cancel' : 'Post New Job'}
        </Button>
      </div>

      {/* Inline Post/Edit Form */}
      {showForm && (
        <Card className="p-6 border-2 border-blue-100 bg-white shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Job Posting' : 'Post New Job Requirement'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Job Title"
                required
                placeholder="e.g. Senior EV Battery Integration Engineer"
                value={form.title}
                onChange={(e: any) => setForm({ ...form, title: e.target.value })}
              />
              <Input
                label="Sector / Domain"
                required
                placeholder="e.g. Electric Vehicles, Robotics, Cloud"
                value={form.sector}
                onChange={(e: any) => setForm({ ...form, sector: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Detailed Job Description</label>
              <textarea
                rows={3}
                required
                placeholder="Describe key responsibilities, daily workflows, technical competencies..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500"
                value={form.description}
                onChange={(e: any) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Job Type"
                options={jobTypes}
                required
                value={form.job_type}
                onChange={(e: any) => setForm({ ...form, job_type: e.target.value })}
              />
              {form.job_type === 'INTERNSHIP' ? (
                <Input
                  label="Internship Period / Duration *"
                  required
                  placeholder="e.g. 3 Months, 6 Months"
                  value={form.internship_duration}
                  onChange={(e: any) => setForm({ ...form, internship_duration: e.target.value })}
                />
              ) : (
                <Select
                  label="Required Proficiency"
                  options={proficiencies}
                  required
                  value={form.proficiency_required}
                  onChange={(e: any) => setForm({ ...form, proficiency_required: e.target.value })}
                />
              )}
              <Input
                label="Experience Required (Years)"
                type="number"
                min="0"
                required
                value={form.experience_years}
                onChange={(e: any) => setForm({ ...form, experience_years: e.target.value })}
              />
              <Input
                label="Vacancies / Openings"
                type="number"
                min="1"
                required
                value={form.openings_count}
                onChange={(e: any) => setForm({ ...form, openings_count: e.target.value })}
              />
            </div>


            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Salary Min (₹ / year)"
                type="number"
                placeholder="e.g. 800000"
                value={form.salary_min}
                onChange={(e: any) => setForm({ ...form, salary_min: e.target.value })}
              />
              <Input
                label="Salary Max (₹ / year)"
                type="number"
                placeholder="e.g. 1400000"
                value={form.salary_max}
                onChange={(e: any) => setForm({ ...form, salary_max: e.target.value })}
              />
              <Input
                label="City"
                required
                placeholder="e.g. Pune"
                value={form.city}
                onChange={(e: any) => setForm({ ...form, city: e.target.value })}
              />
              <Input
                label="State"
                required
                placeholder="e.g. Maharashtra"
                value={form.state}
                onChange={(e: any) => setForm({ ...form, state: e.target.value })}
              />
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-800">
                  Required Skills for this Role
                </label>
                <span className="text-[11px] text-gray-500 font-medium">
                  {selectedSkills.length} {selectedSkills.length === 1 ? 'skill' : 'skills'} selected
                </span>
              </div>

              {/* Selected Skills Chips */}
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2.5 bg-blue-50/40 border border-blue-100 rounded-lg">
                  {selectedSkills.map(skill => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-blue-200 text-blue-800 rounded-md text-xs font-medium shadow-2xs"
                    >
                      {skill.name}
                      {skill.is_custom && (
                        <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded text-[9px] font-bold uppercase">
                          New
                        </span>
                      )}
                      <label className="flex items-center gap-1 ml-1 text-[10px] text-gray-600 font-normal cursor-pointer border-l border-blue-100 pl-1.5">
                        <input
                          type="checkbox"
                          checked={skill.is_required !== false}
                          onChange={(e) => {
                            setSelectedSkills(selectedSkills.map(s => s.id === skill.id ? { ...s, is_required: e.target.checked } : s));
                          }}
                          className="rounded text-blue-600 w-3 h-3"
                        />
                        Req.
                      </label>
                      <button
                        type="button"
                        onClick={() => setSelectedSkills(selectedSkills.filter(s => s.id !== skill.id))}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Dedicated Search Bar with clear border and soft focus */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search existing skills (e.g. Python, Docker, CAD, Nursing)..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs transition-all placeholder:text-gray-400 shadow-2xs"
                />
              </div>

              {/* Add Custom / Extra Skill Bar */}
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="text-xs text-gray-700 font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Add Extra / Custom Skill:</span>
                </div>
                <input
                  type="text"
                  placeholder="Type any skill not listed (e.g. Kotlin, CAN Bus, Kubernetes)..."
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-md text-xs placeholder:text-gray-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleAddCustomSkill()}
                  disabled={!customSkillInput.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add to Job &amp; DB
                </button>
              </div>

              {/* Filtered Skills List */}
              <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50/70 divide-y divide-gray-100">
                {skillsList
                  .filter(s => s.name?.toLowerCase().includes(skillSearch.toLowerCase()))
                  .map(skill => {
                    const isSelected = selectedSkills.find(s => s.id === skill.id || s.name.toLowerCase() === skill.name.toLowerCase());
                    return (
                      <div key={skill.id} className="flex items-center justify-between p-1.5 hover:bg-white rounded transition-colors">
                        <label className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={!!isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSkills([...selectedSkills, { id: skill.id, name: skill.name, is_required: true }]);
                              } else {
                                setSelectedSkills(selectedSkills.filter(s => s.id !== skill.id && s.name.toLowerCase() !== skill.name.toLowerCase()));
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium">{skill.name}</span>
                          <span className="text-[10px] text-gray-400 font-normal">({skill.domain})</span>
                        </label>
                        {isSelected && (
                          <label className="flex items-center gap-1 text-[11px] text-gray-600 font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected.is_required !== false}
                              onChange={(e) => {
                                setSelectedSkills(selectedSkills.map(s => (s.id === skill.id || s.name.toLowerCase() === skill.name.toLowerCase()) ? { ...s, is_required: e.target.checked } : s));
                              }}
                              className="rounded text-blue-600 w-3 h-3"
                            />
                            Mandatory
                          </label>
                        )}
                      </div>
                    );
                  })}

                {skillSearch.trim() && !skillsList.some(s => s.name.toLowerCase().includes(skillSearch.toLowerCase())) && (
                  <div className="p-3 text-center space-y-2">
                    <p className="text-xs text-gray-500">No existing skill matches &ldquo;{skillSearch}&rdquo;.</p>
                    <button
                      type="button"
                      onClick={() => handleAddCustomSkill(skillSearch)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add &ldquo;{skillSearch}&rdquo; as new skill to database
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Publishing...' : editId ? 'Update Job Posting' : 'Publish Job Posting'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Jobs List */}
      <div className="grid gap-4">
        {jobs.map(job => (
          <Card key={job.id} className="p-6 border border-gray-200 hover:border-gray-300 transition-all space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {job.sector || 'Industry'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {job.city}, {job.state}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    {job.openings_count} Openings
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {job.experience_years} {job.experience_years === 1 ? 'Year' : 'Years'} Exp.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  job.is_active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                }`}>
                  {job.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>

            {/* Description Preview */}
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {job.description}
            </p>

            {/* Badges & Required Skills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-semibold">
                {job.job_type}
              </span>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-semibold">
                {job.proficiency_required || 'INTERMEDIATE'} LEVEL
              </span>
              {job.salary_min && (
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md text-xs font-semibold">
                  ₹{(job.salary_min / 100000).toFixed(1)} - {(job.salary_max / 100000).toFixed(1)} LPA
                </span>
              )}

              {job.skills?.map((sk: string, idx: number) => (
                <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-medium border border-blue-100">
                  {sk}
                </span>
              ))}
            </div>

            {/* Action Buttons: VIEW, EDIT, DELETE */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setViewJob(job)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                View Complete Posting
              </button>

              <button
                onClick={() => openEdit(job)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Posting
              </button>

              <button
                disabled={deletingId === job.id}
                onClick={() => handleDelete(job.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deletingId === job.id ? 'Deleting...' : 'Delete Posting'}
              </button>
            </div>
          </Card>
        ))}

        {!jobs.length && !showForm && (
          <div className="text-center p-12 text-gray-500 bg-white rounded-xl border border-gray-200">
            No job postings found. Click &ldquo;Post New Job&rdquo; to publish your first requirement!
          </div>
        )}
      </div>

      {/* COMPLETE VIEW MODAL */}
      {viewJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <Card className="w-full max-w-2xl p-6 bg-white max-h-[90vh] overflow-y-auto space-y-4 rounded-2xl shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 uppercase">
                  {viewJob.sector || 'Industry Role'}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-1">{viewJob.title}</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{viewJob.city}, {viewJob.state}</span>
                </div>
              </div>
              <button onClick={() => setViewJob(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl text-xs">
              <div>
                <div className="text-gray-400">Job Type:</div>
                <div className="font-semibold text-gray-800 mt-0.5">{viewJob.job_type}</div>
              </div>
              <div>
                <div className="text-gray-400">Proficiency:</div>
                <div className="font-semibold text-purple-700 mt-0.5">{viewJob.proficiency_required || 'INTERMEDIATE'}</div>
              </div>
              <div>
                <div className="text-gray-400">Experience:</div>
                <div className="font-semibold text-gray-800 mt-0.5">{viewJob.experience_years} Years</div>
              </div>
              <div>
                <div className="text-gray-400">Vacancies:</div>
                <div className="font-semibold text-blue-700 mt-0.5">{viewJob.openings_count} Openings</div>
              </div>
            </div>

            {viewJob.salary_min && (
              <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-900 font-medium">
                Annual Compensation: <strong>₹{(viewJob.salary_min / 100000).toFixed(1)} LPA - ₹{(viewJob.salary_max / 100000).toFixed(1)} LPA</strong>
              </div>
            )}

            {/* Full Description */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Job Overview & Responsibilities:</h4>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                {viewJob.description}
              </p>
            </div>

            {/* Required Skills */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Required Skills:</h4>
              <div className="flex flex-wrap gap-1.5">
                {viewJob.skills?.map((sk: string, idx: number) => (
                  <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-100 rounded-md text-xs font-semibold">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  const jobToEdit = viewJob;
                  setViewJob(null);
                  openEdit(jobToEdit);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Edit This Posting
              </button>

              <button
                onClick={() => setViewJob(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
