import React, { useState, useEffect, useRef } from 'react';
import { 
  getStudentProfile, updateStudentProfile, addStudentLocations, 
  addStudentEducation, addStudentSkills, addStudentInterests, 
  parseResume, getSkills, getSkillDomains, completeCourse, 
  addCertificate, syncSkills 
} from '../../services/api';
import { Button, Input, Select, Spinner, useToast } from '../../components/ui';
import { 
  BookOpen, Award, Sparkles, Plus, ExternalLink, CheckCircle2, 
  User, UploadCloud, FileText, ArrowRight, Camera, Edit3, MapPin, 
  GraduationCap, Mail, Phone, Calendar, Save
} from 'lucide-react';

interface ProfileProps {
  navigate?: (page: string, params?: any) => void;
}

export default function Profile({ navigate }: ProfileProps) {
  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States for sub-forms
  const [personal, setPersonal] = useState({ full_name: '', dob: '', gender: '', phone: '' });
  const [locations, setLocations] = useState<any[]>([{ city: '', state: '', pincode: '', is_primary: true, display_order: 1 }]);
  const [education, setEducation] = useState({ degree: '', field_of_study: '', institution: '', graduation_year: '' });
  
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  
  const [resumeLoading, setResumeLoading] = useState(false);
  const [uploadedResumeName, setUploadedResumeName] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // New item modal/form states
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [newCourse, setNewCourse] = useState({ course_code: '', grade: 'Certified (A)', completion_date: '' });
  
  const [showCertForm, setShowCertForm] = useState(false);
  const [newCert, setNewCert] = useState({ title: '', issuer: '', issue_date: '', credential_id: '', credential_url: '', gained_skills: '' });

  const loadProfile = () => {
    Promise.all([
      getStudentProfile(),
      getSkills(),
      getSkillDomains()
    ]).then(([profRes, skillsRes, domainsRes]) => {
      const p = profRes.data;
      
      if (p.profile?.full_name) {
        setPersonal({
          full_name: p.profile.full_name,
          dob: p.profile.dob || '',
          gender: p.profile.gender || '',
          phone: p.profile.phone || ''
        });
      }
      if (p.locations?.length) setLocations(p.locations);
      if (p.education?.length) setEducation(p.education[0]);
      if (p.skills) setSelectedSkills(p.skills.map((s: any) => ({ skill_id: s.skill_id || s.id, proficiency: s.proficiency || 'BEGINNER' })));
      if (p.interests) setSelectedDomains(p.interests);
      if (p.completed_courses) setCompletedCourses(p.completed_courses);
      if (p.certificates) setCertificates(p.certificates);
      
      setAvailableSkills(skillsRes.data);
      setDomains(domainsRes.data);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load profile');
      setLoading(false);
    });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handlePersonalSave = async () => {
    setSavingPersonal(true);
    try { 
      await updateStudentProfile(personal); 
      await addStudentLocations(locations);
      toast.success('Personal details and locations saved successfully!');
      setIsEditingPersonal(false);
    } catch (e) { 
      toast.error('Error saving personal info'); 
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleLocationsSave = async () => {
    try { 
      await addStudentLocations(locations); 
      toast.success('Locations saved successfully!'); 
    } catch (e) { 
      toast.error('Error saving locations'); 
    }
  };

  const handleEduSave = async () => {
    try { 
      await addStudentEducation(education); 
      toast.success('Education saved successfully!'); 
    } catch (e) { 
      toast.error('Error saving education'); 
    }
  };

  const handleSkillsSave = async () => {
    try { 
      await addStudentSkills(selectedSkills); 
      toast.success('Skills saved successfully!'); 
    } catch (e) { 
      toast.error('Error saving skills'); 
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await completeCourse(newCourse);
      toast.success('Course completed and skills auto-synchronized!');
      setNewCourse({ course_code: '', grade: 'Certified (A)', completion_date: '' });
      setShowCourseForm(false);
      loadProfile();
    } catch (err: any) {
      toast.error(err.message || 'Error adding course');
    }
  };

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCertificate(newCert);
      toast.success('Certification saved and skills updated!');
      setNewCert({ title: '', issuer: '', issue_date: '', credential_id: '', credential_url: '', gained_skills: '' });
      setShowCertForm(false);
      loadProfile();
    } catch (err: any) {
      toast.error(err.message || 'Error adding certificate');
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await syncSkills();
      toast.success(`AI Skill Engine: Synchronized! (${res.data.total_skills_count} total skills active)`);
      loadProfile();
    } catch (err: any) {
      toast.error('Skill sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedResumeName(file.name);
    setResumeLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await parseResume(formData);
      toast.success('Resume parsed successfully! Skills and profile updated.');
      if (res.data?.name && !personal.full_name) {
        setPersonal(p => ({ ...p, full_name: res.data.name }));
      }
      loadProfile();
    } catch (e) {
      toast.error('Error parsing resume');
    } finally {
      setResumeLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;

  const sectionsFilled = [personal.full_name, locations[0]?.city, education.degree, selectedSkills.length, completedCourses.length].filter(Boolean).length;
  const progress = Math.round((sectionsFilled / 5) * 100);

  // Derive initials from full name or default
  const getInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* 1. HERO IDENTITY & PROFILE PICTURE BANNER */}
      <section className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="h-28 bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 relative">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>
        </div>

        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar row - sits just below the gradient strip */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-0 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Profile Picture Avatar - floated up via negative margin on avatar only */}
              <div className="relative group -mt-12 shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg border-2 border-white">
                  <div className="w-full h-full rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-inner tracking-wider select-none">
                    {getInitials(personal.full_name)}
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingPersonal(true)}
                  className="absolute bottom-1 right-1 p-1.5 bg-white text-gray-700 rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Edit Profile"
                >
                  <Camera className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>

              {/* Name & Quick Info — sits at normal flow, NO negative margin */}
              <div className="pt-2 sm:pt-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900 leading-tight">
                    {personal.full_name || 'Student Candidate'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                    Student / Candidate
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap mt-0.5">
                  {locations[0]?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {locations[0].city}{locations[0].state ? `, ${locations[0].state}` : ''}
                    </span>
                  )}
                  {education.degree && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                      {education.degree} {education.field_of_study ? `in ${education.field_of_study}` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Strength & Actions */}
            <div className="flex flex-col sm:items-end w-full sm:w-auto gap-3">
              <div className="w-full sm:w-48 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-500">Profile Completion:</span>
                  <span className="text-blue-600 font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isEditingPersonal 
                      ? 'bg-gray-200 text-gray-800' 
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditingPersonal ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                {isEditingPersonal && (
                  <button
                    onClick={handlePersonalSave}
                    disabled={savingPersonal}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingPersonal ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PERSONAL DETAILS & CONTACT INFORMATION */}
      <section className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Personal Details</h2>
          </div>
          {!isEditingPersonal && (
            <button
              onClick={() => setIsEditingPersonal(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Edit Info
            </button>
          )}
        </div>

        {isEditingPersonal ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Input 
                label="Full Name" 
                value={personal.full_name} 
                onChange={(e: any) => setPersonal({ ...personal, full_name: e.target.value })} 
                placeholder="e.g. Aditya Sharma"
              />
              <Input 
                label="Date of Birth" 
                type="date" 
                value={personal.dob} 
                onChange={(e: any) => setPersonal({ ...personal, dob: e.target.value })} 
              />
              <Select 
                label="Gender" 
                options={[
                  { label: 'Select Gender', value: '' },
                  { label: 'Male', value: 'Male' }, 
                  { label: 'Female', value: 'Female' }, 
                  { label: 'Other', value: 'Other' }
                ]} 
                value={personal.gender} 
                onChange={(e: any) => setPersonal({ ...personal, gender: e.target.value })} 
              />
              <Input 
                label="Contact Phone" 
                value={personal.phone} 
                onChange={(e: any) => setPersonal({ ...personal, phone: e.target.value })} 
                placeholder="+91 9876543210"
              />
            </div>

            {/* Locations in Edit Mode */}
            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
                Preferred Locations (Up to 3, ranked by priority)
              </h3>
              {locations.map((loc, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 items-end">
                  <Input 
                    label={`Location ${idx + 1} City`} 
                    value={loc.city} 
                    placeholder="e.g. Pune"
                    onChange={(e: any) => { 
                      const l = [...locations]; 
                      l[idx].city = e.target.value; 
                      setLocations(l); 
                    }} 
                  />
                  <Input 
                    label="State" 
                    value={loc.state} 
                    placeholder="e.g. Maharashtra"
                    onChange={(e: any) => { 
                      const l = [...locations]; 
                      l[idx].state = e.target.value; 
                      setLocations(l); 
                    }} 
                  />
                  <Input 
                    label="Pincode" 
                    value={loc.pincode} 
                    placeholder="e.g. 411001"
                    onChange={(e: any) => { 
                      const l = [...locations]; 
                      l[idx].pincode = e.target.value; 
                      setLocations(l); 
                    }} 
                  />
                </div>
              ))}
              {locations.length < 3 && (
                <button
                  type="button"
                  onClick={() => setLocations([...locations, { city: '', state: '', pincode: '', is_primary: false, display_order: locations.length + 1 }])}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Location
                </button>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button variant="secondary" onClick={() => setIsEditingPersonal(false)}>Cancel</Button>
              <Button onClick={handlePersonalSave} disabled={savingPersonal}>
                {savingPersonal ? 'Saving...' : 'Save Personal Details'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-400 block mb-0.5">Full Name</span>
              <span className="font-semibold text-gray-800">{personal.full_name || 'Not provided'}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-400 block mb-0.5">Date of Birth</span>
              <span className="font-semibold text-gray-800">{personal.dob || 'Not provided'}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-400 block mb-0.5">Gender</span>
              <span className="font-semibold text-gray-800">{personal.gender || 'Not specified'}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-400 block mb-0.5">Contact Phone</span>
              <span className="font-semibold text-gray-800">{personal.phone || 'Not provided'}</span>
            </div>

            {/* Locations display */}
            <div className="sm:col-span-2 md:col-span-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs text-gray-400 block mb-0.5">Preferred Locations</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {locations.filter(l => l.city).length === 0 ? (
                    <span className="text-gray-400 text-xs italic">No preferred locations added yet</span>
                  ) : (
                    locations.filter(l => l.city).map((l, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        {l.city}, {l.state} {l.pincode ? `(${l.pincode})` : ''}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. FORMAL EDUCATION */}
      <section className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Formal Education</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Select 
            label="Degree" 
            options={[
              { label: 'Select Degree', value: '' },
              { label: 'B.Tech / B.E.', value: 'B.Tech' }, 
              { label: 'Diploma', value: 'Diploma' }, 
              { label: 'BSc / BCA', value: 'BSc' }, 
              { label: 'M.Tech / ME', value: 'M.Tech' }, 
              { label: 'Other', value: 'Other' }
            ]} 
            value={education.degree} 
            onChange={(e: any) => setEducation({ ...education, degree: e.target.value })} 
          />
          <Input 
            label="Field of Study" 
            placeholder="e.g. Computer Engineering"
            value={education.field_of_study} 
            onChange={(e: any) => setEducation({ ...education, field_of_study: e.target.value })} 
          />
          <Input 
            label="Institution / University" 
            placeholder="e.g. Pune Institute of Technology"
            value={education.institution} 
            onChange={(e: any) => setEducation({ ...education, institution: e.target.value })} 
          />
          <Input 
            label="Graduation Year" 
            type="number" 
            placeholder="e.g. 2025"
            value={education.graduation_year} 
            onChange={(e: any) => setEducation({ ...education, graduation_year: e.target.value })} 
          />
        </div>
        <div className="flex justify-end pt-1">
          <Button onClick={handleEduSave}>Save Education</Button>
        </div>
      </section>

      {/* 4. RESUME SECTION (MODERN DUAL-CARD: PARSE & BUILD) */}
      <section className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-5">
        <div className="border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Resume</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Upload your existing resume to parse your skills with AI, or build an IEEE-standard professional resume in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card A: Upload Existing Resume */}
          <div className="border border-gray-200 hover:border-blue-300 rounded-2xl p-5 bg-gradient-to-br from-gray-50/70 to-white flex flex-col justify-between transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Upload Existing Resume</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Support for PDF and DOCX files. Our AI engine scans your resume and extracts relevant technical skills, education, and credentials into your profile.
                </p>
              </div>

              {uploadedResumeName && (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-medium">{uploadedResumeName}</span>
                </div>
              )}
            </div>

            <div className="pt-4">
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".pdf,.doc,.docx" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={resumeLoading}
                className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-blue-600 font-semibold text-xs rounded-xl border border-blue-200 shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {resumeLoading ? (
                  <>
                    <Spinner />
                    <span>Parsing Resume with AI...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Select & Upload Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card B: Build Resume */}
          <div className="border border-blue-100 hover:border-blue-400 rounded-2xl p-5 bg-linear-to-br from-blue-50/50 to-indigo-50/30 flex flex-col justify-between transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">Interactive Resume Builder</h3>
                  <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                    IEEE Standard
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Design a professional ATS-friendly resume formatted to industry standards. Customize headings, edit content in real-time, preview changes live, and export to PDF.
                </p>
              </div>

              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Real-time IEEE template styling</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Interactive headings & live preview mode</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => navigate ? navigate('student/resume') : null}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Build Resume Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. UNIFIED SKILLS PORTFOLIO (AI-SYNCHRONIZED) */}
      <section className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Unified Skills Portfolio</h2>
          </div>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {syncing ? 'Synchronizing Skills...' : 'AI Sync All Skills'}
          </button>
        </div>

        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            The AI engine continuously harmonizes skills from your completed government courses, verified certifications, and self-reported competencies into one verified skill profile.
          </div>
        </div>

        <Input 
          placeholder="Filter or search available industry skills..." 
          value={skillSearch} 
          onChange={(e: any) => setSkillSearch(e.target.value)} 
        />
        
        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-2 divide-y divide-gray-100">
          {availableSkills.filter((s: any) => s.name?.toLowerCase().includes(skillSearch.toLowerCase())).map((skill: any) => {
            const isSelected = selectedSkills.find(s => s.skill_id === skill.id);
            return (
              <div key={skill.id} className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg">
                <label className="flex items-center gap-2.5 text-xs text-gray-800 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!isSelected}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedSkills([...selectedSkills, { skill_id: skill.id, proficiency: 'BEGINNER' }]);
                      else setSelectedSkills(selectedSkills.filter(s => s.skill_id !== skill.id));
                    }}
                    className="rounded text-blue-600"
                  />
                  <span>{skill.name}</span>
                  <span className="text-[10px] text-gray-400 font-normal">({skill.domain})</span>
                </label>
                {isSelected && (
                  <select
                    className="border border-gray-300 rounded-lg px-2.5 py-1 text-xs bg-white text-gray-800 font-medium"
                    value={isSelected.proficiency}
                    onChange={(e) => {
                      setSelectedSkills(selectedSkills.map(s => s.skill_id === skill.id ? { ...s, proficiency: e.target.value } : s));
                    }}
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end pt-1">
          <Button onClick={handleSkillsSave}>Save Skills</Button>
        </div>
      </section>

      {/* 6. COMPLETED GOVERNMENT COURSES */}
      <section className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Completed Government Courses</h2>
          </div>
          <button
            onClick={() => setShowCourseForm(!showCourseForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {showCourseForm ? 'Cancel' : 'Add Completed Course'}
          </button>
        </div>

        {/* Add Course Form */}
        {showCourseForm && (
          <form onSubmit={handleAddCourse} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Record Accredited Course Completion</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Course ID / Code"
                required
                placeholder="e.g. CRS-EV-101"
                value={newCourse.course_code}
                onChange={(e: any) => setNewCourse({ ...newCourse, course_code: e.target.value })}
              />
              <Input
                label="Grade Awarded"
                placeholder="e.g. Distinction (A+)"
                value={newCourse.grade}
                onChange={(e: any) => setNewCourse({ ...newCourse, grade: e.target.value })}
              />
              <Input
                label="Completion Date"
                type="date"
                value={newCourse.completion_date}
                onChange={(e: any) => setNewCourse({ ...newCourse, completion_date: e.target.value })}
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button type="submit">Verify & Record Course</Button>
            </div>
          </form>
        )}

        {/* Courses list */}
        <div className="space-y-3">
          {completedCourses.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">No completed government courses recorded yet.</p>
          ) : (
            completedCourses.map(c => (
              <div key={c.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white border border-gray-300 rounded text-gray-800">
                      {c.course_code}
                    </span>
                    <span className="font-bold text-sm text-gray-900">{c.title}</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    {c.grade}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                  <span>Domain: <strong>{c.domain}</strong></span>
                  <span>Depth: <strong>{c.depth_level}</strong></span>
                  {c.completion_date && <span>Completed: <strong>{c.completion_date}</strong></span>}
                </div>

                <div className="pt-1 text-xs">
                  <span className="font-semibold text-gray-700">Gained Skills:</span>{' '}
                  <span className="text-emerald-700 font-medium">{c.gained_skills}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 7. VERIFIED CERTIFICATIONS */}
      <section className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Verified Certifications</h2>
          </div>
          <button
            onClick={() => setShowCertForm(!showCertForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {showCertForm ? 'Cancel' : 'Add Certification'}
          </button>
        </div>

        {/* Add Certificate Form */}
        {showCertForm && (
          <form onSubmit={handleAddCert} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Add Professional Certificate</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Certificate Title"
                required
                placeholder="e.g. Certified SolidWorks Professional"
                value={newCert.title}
                onChange={(e: any) => setNewCert({ ...newCert, title: e.target.value })}
              />
              <Input
                label="Issuing Authority"
                required
                placeholder="e.g. Dassault Systèmes / MSDE"
                value={newCert.issuer}
                onChange={(e: any) => setNewCert({ ...newCert, issuer: e.target.value })}
              />
              <Input
                label="Credential ID"
                required
                placeholder="e.g. CSWP-IND-2024-9921"
                value={newCert.credential_id}
                onChange={(e: any) => setNewCert({ ...newCert, credential_id: e.target.value })}
              />
              <Input
                label="Verification URL"
                placeholder="https://verify.issuer.com/..."
                value={newCert.credential_url}
                onChange={(e: any) => setNewCert({ ...newCert, credential_url: e.target.value })}
              />
            </div>
            <Input
              label="Skills Gained (comma-separated)"
              required
              placeholder="e.g. SolidWorks, CAD Modeling, Simulation"
              value={newCert.gained_skills}
              onChange={(e: any) => setNewCert({ ...newCert, gained_skills: e.target.value })}
            />
            <div className="flex justify-end pt-1">
              <Button type="submit">Save Certification</Button>
            </div>
          </form>
        )}

        {/* Certs List */}
        <div className="space-y-3">
          {certificates.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">No verified certifications recorded yet.</p>
          ) : (
            certificates.map(cert => (
              <div key={cert.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{cert.title}</h4>
                    <div className="text-xs text-gray-500">{cert.issuer} • Issued {cert.issue_date}</div>
                  </div>
                  {cert.credential_url && (
                    <a
                      href={cert.credential_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Verify <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="text-xs text-gray-600">
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-800">
                    ID: {cert.credential_id}
                  </span>
                </div>

                <div className="text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Verified Skills:</span>{' '}
                  <span className="text-purple-700 font-medium">{cert.gained_skills}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  );
}
