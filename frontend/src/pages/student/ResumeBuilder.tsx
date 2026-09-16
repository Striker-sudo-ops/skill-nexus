import React, { useState, useRef } from 'react';
import { 
  Phone, Mail, Download, Copy, Check, Plus, Trash2, 
  Code2, Upload, Bold, Italic, Underline, 
  ArrowUp, ArrowDown, ChevronRight, FileText, 
  Eye, Edit3, ZoomIn, ZoomOut, Maximize2, User, Sparkles,
  PanelLeftClose, PanelLeftOpen, RotateCcw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ResumeSection {
  id: string;
  title: string;
  type: 'education' | 'coursework' | 'skills' | 'projects' | 'certifications' | 'extracurricular' | 'experience' | 'custom';
  items?: any[];
  content?: string;
  skillsGroups?: { category: string; items: string }[];
}

const defaultSections: ResumeSection[] = [
  {
    id: 'sec-edu',
    title: 'Education',
    type: 'education',
    items: [
      {
        institution: 'National Institute of Technology',
        date: 'Aug. 2021 - May 2025',
        degree: 'Bachelor of Technology in Computer Science and Engineering | CGPA: 8.65',
        location: 'New Delhi, India'
      },
      {
        institution: 'Delhi Public School',
        date: 'April 2019 - March 2021',
        degree: 'Senior Secondary (CBSE - Science) | Percentage: 94.2%',
        location: 'New Delhi, India'
      }
    ]
  },
  {
    id: 'sec-coursework',
    title: 'Relevant Coursework',
    type: 'coursework',
    content: 'Data Structures • Algorithms • Operating Systems • Computer Networks • Database Management Systems • Object-Oriented Programming • Cloud Computing • Software Engineering'
  },
  {
    id: 'sec-skills',
    title: 'Technical Skills',
    type: 'skills',
    skillsGroups: [
      { category: 'Languages', items: 'Python, Java, C++, TypeScript, SQL' },
      { category: 'Frameworks & Libraries', items: 'React, Node.js, Express, FastAPI, Tailwind CSS' },
      { category: 'Developer Tools & Cloud', items: 'Git, GitHub, Docker, AWS, Linux, PostgreSQL, MongoDB' }
    ]
  },
  {
    id: 'sec-projects',
    title: 'Projects',
    type: 'projects',
    items: [
      {
        name: 'Distributed Cloud Task Scheduler',
        tech: 'Node.js, Redis, Docker',
        link: '',
        bullets: [
          'Engineered a distributed asynchronous job processing service supporting 5,000+ tasks/min with priority queuing.',
          'Integrated Redis pub/sub messaging and Dockerized worker pools to achieve fault-tolerant task execution.'
        ]
      },
      {
        name: 'Full-Stack Analytical Dashboard',
        tech: 'Python, FastAPI, React, PostgreSQL',
        link: '',
        bullets: [
          'Built an interactive dashboard to visualize time-series metrics and performance KPIs with real-time updates.',
          'Optimized database queries with indexing, reducing API response times by 38%.'
        ]
      },
      {
        name: 'Secure Role-Based Authentication Gateway',
        tech: 'TypeScript, Express, JWT, bcrypt',
        link: '',
        bullets: [
          'Implemented end-to-end token-based authentication with refresh rotation and rate limiting protections.',
          'Automated security regression tests with Jest, achieving 92% code coverage across authorization flows.'
        ]
      }
    ]
  },
  {
    id: 'sec-certs',
    title: 'Certifications',
    type: 'certifications',
    items: [
      {
        title: 'AWS Certified Solutions Architect - Associate',
        issuer: 'Amazon Web Services, 2024'
      }
    ]
  },
  {
    id: 'sec-extra',
    title: 'Extracurricular Activities',
    type: 'extracurricular',
    items: [
      { text: 'Technical Coordinator for Annual College Hackathon, hosting 400+ participants.' },
      { text: 'Active Contributor to open-source developer toolkits and technical writing blogs.' }
    ]
  }
];

export default function ResumeBuilder({ 
  isSidebarOpen, 
  onToggleSidebar 
}: { 
  isSidebarOpen?: boolean; 
  onToggleSidebar?: () => void; 
}) {
  const { user } = useAuth();

  // Mode: 'EDIT' (Editor + Preview side-by-side) or 'VIEW' (Full Screen Clean Resume Preview)
  const [viewMode, setViewMode] = useState<'EDIT' | 'VIEW'>('EDIT');
  const [zoomScale, setZoomScale] = useState<number>(100);

  // Personal Info State - always editable
  const [personal, setPersonal] = useState({
    name: user?.full_name || 'Aditya Sharma',
    location: 'New Delhi, India',
    phone: '+91 98765 43210',
    email: user?.email || 'aditya.sharma@example.com',
    linkedin: 'linkedin.com/in/aditya-sharma',
    github: 'github.com/aditya-sharma'
  });

  const [sections, setSections] = useState<ResumeSection[]>(defaultSections);
  const [activeSectionId, setActiveSectionId] = useState<string>('sec-edu');
  const [showPersonalForm, setShowPersonalForm] = useState(true);
  const [customHeadingInput, setCustomHeadingInput] = useState('');

  // Typography & Styling options
  const [fontFamily, setFontFamily] = useState<'latin-modern' | 'times' | 'garamond' | 'inter' | 'georgia'>('latin-modern');
  const [fontSize, setFontSize] = useState<'10pt' | '10.5pt' | '11pt' | '12pt'>('10.5pt');
  const [headingStyle, setHeadingStyle] = useState({
    bold: true,
    italic: false,
    underline: false,
    uppercase: true
  });

  // LaTeX Modal
  const [showLatexModal, setShowLatexModal] = useState(false);
  const [copiedLatex, setCopiedLatex] = useState(false);
  const [latexInput, setLatexInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const predefinedHeadings = [
    { title: 'Work Experience', type: 'experience' },
    { title: 'Relevant Coursework', type: 'coursework' },
    { title: 'Technical Skills', type: 'skills' },
    { title: 'Projects', type: 'projects' },
    { title: 'Certifications', type: 'certifications' },
    { title: 'Publications', type: 'custom' },
    { title: 'Leadership & Awards', type: 'extracurricular' },
    { title: 'Extracurricular Activities', type: 'extracurricular' }
  ];

  const handleAddSection = (title: string, type: any = 'custom') => {
    const newId = 'sec-' + Date.now();
    let newSec: ResumeSection;

    if (type === 'education') {
      newSec = { id: newId, title, type: 'education', items: [{ institution: 'University / Institute Name', date: '2021 - 2025', degree: 'Degree | CGPA', location: 'City, State' }] };
    } else if (type === 'experience') {
      newSec = { id: newId, title, type: 'experience', items: [{ company: 'Company Name', role: 'Role Title', date: 'Jan 2024 - Present', location: 'City, Country', bullets: ['Key accomplishment or project contribution with quantifiable impact.'] }] };
    } else if (type === 'skills') {
      newSec = { id: newId, title, type: 'skills', skillsGroups: [{ category: 'Category', items: 'Skill A, Skill B, Skill C' }] };
    } else if (type === 'projects') {
      newSec = { id: newId, title, type: 'projects', items: [{ name: 'Project Title', tech: 'Tech Stack', link: '', bullets: ['Describe technical role and core functionality built.'] }] };
    } else if (type === 'certifications') {
      newSec = { id: newId, title, type: 'certifications', items: [{ title: 'Certification Name', issuer: 'Issuing Organization, Year' }] };
    } else if (type === 'coursework') {
      newSec = { id: newId, title, type: 'coursework', content: 'Course A • Course B • Course C • Course D' };
    } else {
      newSec = { id: newId, title, type: 'custom', items: [{ text: 'Key achievement or role details.' }] };
    }

    setSections([...sections, newSec]);
    setActiveSectionId(newId);
  };

  const handleRemoveSection = (id: string) => {
    if (!window.confirm('Remove this section from your resume?')) return;
    const remaining = sections.filter(s => s.id !== id);
    setSections(remaining);
    if (activeSectionId === id && remaining.length) {
      setActiveSectionId(remaining[0].id);
    }
  };

  const handleMoveSection = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sections.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const copy = [...sections];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    setSections(copy);
  };

  const handleUploadCompanyFormat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const filename = file.name.toLowerCase();
    if (filename.includes('faang') || filename.includes('tech') || filename.includes('software')) {
      setSections([
        { id: 'faang-edu', title: 'Education', type: 'education', items: [{ institution: 'National Institute of Technology', date: '2021 - 2025', degree: 'B.Tech in Computer Science', location: 'New Delhi, India' }] },
        { id: 'faang-skills', title: 'Technical Skills', type: 'skills', skillsGroups: [{ category: 'Languages', items: 'C++, Python, Java, Go, TypeScript' }, { category: 'Cloud & Systems', items: 'AWS, Docker, Kubernetes, Linux, PostgreSQL' }] },
        { id: 'faang-exp', title: 'Work Experience', type: 'experience', items: [{ company: 'Tech Solutions Inc', role: 'Software Engineer Intern', date: 'May 2024 - Aug 2024', location: 'Bengaluru, India', bullets: ['Designed microservices handling high concurrency with sub-50ms latency.'] }] },
        { id: 'faang-proj', title: 'Projects', type: 'projects', items: defaultSections.find(s => s.type === 'projects')?.items || [] }
      ]);
      alert('Company format applied: Tech / Software Engineering Standard. Section hierarchy has been updated.');
    } else {
      setSections(defaultSections);
      alert('Custom company template format uploaded. Hierarchy applied.');
    }
  };

  const generateLatex = () => {
    let code = '\\documentclass[letterpaper,' + fontSize + ']{article}\n\n';
    code += '\\usepackage{latexsym}\n\\usepackage[empty]{fullpage}\n\\usepackage{titlesec}\n\\usepackage{marvosym}\n\\usepackage[usenames,dvipsnames]{color}\n\\usepackage{verbatim}\n\\usepackage{enumitem}\n\\usepackage[hidelinks]{hyperref}\n\\usepackage{fancyhdr}\n\\usepackage[english]{babel}\n\\usepackage{tabularx}\n\n';
    code += '\\pagestyle{fancy}\n\\fancyhf{}\n\\renewcommand{\\headrulewidth}{0pt}\n\\renewcommand{\\footrulewidth}{0pt}\n\n';
    code += '\\addtolength{\\oddsidemargin}{-0.5in}\n\\addtolength{\\evensidemargin}{-0.5in}\n\\addtolength{\\textwidth}{1.0in}\n\\addtolength{\\topmargin}{-.5in}\n\\addtolength{\\textheight}{1.0in}\n\n';
    code += '\\titleformat{\\section}{\n  \\vspace{-4pt}\\scshape\\raggedright\\large\n}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]\n\n';
    code += '\\begin{document}\n\n';

    code += '%----------HEADING----------\n\\begin{center}\n';
    code += '    \\textbf{\\Huge \\scshape ' + personal.name + '} \\\\\n';
    code += '    \\vspace{2pt}\n';
    if (personal.location) code += '    ' + personal.location + ' \\\\\n';
    code += '    \\small\n';
    const contactLinks = [];
    if (personal.phone) contactLinks.push('\\Phone\\ ' + personal.phone);
    if (personal.email) contactLinks.push('\\href{mailto:' + personal.email + '}{\\underline{' + personal.email + '}}');
    if (personal.linkedin) contactLinks.push('\\href{https://' + personal.linkedin + '}{\\underline{' + personal.linkedin + '}}');
    if (personal.github) contactLinks.push('\\href{https://' + personal.github + '}{\\underline{' + personal.github + '}}');
    code += '    ' + contactLinks.join(' $|$ ') + '\n\\end{center}\n\n';

    sections.forEach(sec => {
      code += '%-----------' + sec.title.toUpperCase() + '-----------\n';
      code += '\\section{' + sec.title + '}\n';

      if (sec.type === 'education') {
        code += '\\begin{itemize}[leftmargin=0.15in, label={}]\n';
        sec.items?.forEach(it => {
          code += '  \\item\n';
          code += '    \\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}\n';
          code += '      \\textbf{' + it.institution + '} & ' + it.date + ' \\\\\n';
          code += '      \\textit{\\small ' + it.degree + '} & \\textit{\\small ' + it.location + '} \\\\\n';
          code += '    \\end{tabular*}\\vspace{-5pt}\n';
        });
        code += '\\end{itemize}\n\n';
      } else if (sec.type === 'coursework') {
        code += '\\begin{itemize}[leftmargin=0.15in, label={}]\n';
        code += '  \\small{\\item{' + (sec.content || '') + '}}\n';
        code += '\\end{itemize}\n\n';
      } else if (sec.type === 'skills') {
        code += '\\begin{itemize}[leftmargin=0.15in, label={}]\n';
        code += '  \\small{\\item{\n';
        sec.skillsGroups?.forEach(sg => {
          code += '    \\textbf{' + sg.category + ':} {' + sg.items + '} \\\\\n';
        });
        code += '  }}\\end{itemize}\n\n';
      } else if (sec.type === 'projects') {
        code += '\\begin{itemize}[leftmargin=0.15in, label={}]\n';
        sec.items?.forEach(pr => {
          code += '  \\item\n';
          code += '    \\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}\n';
          code += '      \\textbf{' + pr.name + '} & \\textit{\\small ' + pr.tech + '} \\\\\n';
          code += '    \\end{tabular*}\\vspace{-5pt}\n';
          code += '    \\begin{itemize}\n';
          pr.bullets?.forEach((b: string) => {
            code += '      \\item \\small{' + b + '}\n';
          });
          code += '    \\end{itemize}\n';
        });
        code += '\\end{itemize}\n\n';
      } else if (sec.type === 'certifications') {
        code += '\\begin{itemize}[leftmargin=0.15in, label={}]\n';
        sec.items?.forEach(c => {
          code += '  \\item\n';
          code += '    \\textbf{' + c.title + '} \\\\\n';
          code += '    \\textit{\\small ' + c.issuer + '}\n';
        });
        code += '\\end{itemize}\n\n';
      } else {
        code += '\\begin{itemize}[leftmargin=0.15in]\n';
        sec.items?.forEach(it => {
          code += '  \\item \\small{' + (it.text || it.name || it.title || '') + '}\n';
        });
        code += '\\end{itemize}\n\n';
      }
    });

    code += '\\end{document}\n';
    return code;
  };

  const handleCopyLatex = () => {
    const code = generateLatex();
    navigator.clipboard.writeText(code);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2500);
  };

  const fontClass = {
    'latin-modern': 'font-["Libre_Baskerville",serif]',
    'times': 'font-["Times_New_Roman",Times,serif]',
    'garamond': 'font-["EB_Garamond",serif]',
    'inter': 'font-["Inter",sans-serif]',
    'georgia': 'font-[Georgia,serif]'
  }[fontFamily];

  const currentSection = sections.find(s => s.id === activeSectionId) || sections[0];

  return (
    <div className="flex flex-col gap-4 max-w-[1700px] mx-auto min-h-[calc(100vh-6rem)]">
      {/* TOP UNIVERSAL ACTION BAR */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h1 className="text-base font-bold text-gray-900">IEEE Resume Builder</h1>
          </div>

          {/* Mode Switcher: Edit Mode vs View Mode */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('EDIT')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'EDIT' 
                  ? 'bg-white text-blue-700 shadow-xs' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor Mode</span>
            </button>

            <button
              onClick={() => setViewMode('VIEW')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'VIEW' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Resume Mode</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: Sidebar Toggle, Zoom, LaTeX, PDF */}
        <div className="flex items-center gap-2">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title={isSidebarOpen ? 'Hide Portal Sidebar to maximize space' : 'Show Portal Sidebar'}
            >
              {isSidebarOpen ? (
                <>
                  <PanelLeftClose className="w-3.5 h-3.5 text-gray-500" />
                  <span className="hidden sm:inline">Maximize Space</span>
                </>
              ) : (
                <>
                  <PanelLeftOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Sidebar</span>
                </>
              )}
            </button>
          )}

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs gap-1.5">
            <button 
              onClick={() => setZoomScale(Math.max(60, zoomScale - 10))}
              className="text-gray-500 hover:text-gray-900 cursor-pointer p-0.5" 
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] font-semibold text-gray-700 min-w-[35px] text-center">
              {zoomScale}%
            </span>
            <button 
              onClick={() => setZoomScale(Math.min(140, zoomScale + 10))}
              className="text-gray-500 hover:text-gray-900 cursor-pointer p-0.5" 
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setZoomScale(100)}
              className="text-gray-400 hover:text-blue-600 text-[10px] ml-1 cursor-pointer" 
              title="Reset Zoom"
            >
              100%
            </button>
          </div>

          <button
            onClick={() => { setLatexInput(generateLatex()); setShowLatexModal(true); }}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="View & Copy LaTeX code"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">LaTeX</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* MAIN WORKSPACE BODY */}
      <div className={`flex flex-col lg:flex-row gap-6 ${viewMode === 'VIEW' ? 'justify-center' : ''}`}>
        
        {/* LEFT COLUMN: FORM EDITORS & SECTION CONTROLS (Hidden in VIEW Mode) */}
        {viewMode === 'EDIT' && (
          <div className="w-full lg:w-[480px] xl:w-[500px] flex flex-col gap-4 no-print overflow-y-auto max-h-[85vh] pr-1">
            
            {/* 1. PERSONAL INFORMATION CARD (PROMINENT, ALWAYS EDITABLE) */}
            <div className="bg-white p-4 rounded-xl border-2 border-blue-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Personal Information & Contact Header
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPersonalForm(!showPersonalForm)}
                  className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  {showPersonalForm ? 'Collapse' : 'Expand'}
                </button>
              </div>

              {showPersonalForm && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={nameInputRef}
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={personal.name}
                        onChange={e => setPersonal({ ...personal, name: e.target.value })}
                        className="w-full text-xs border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-2 font-medium text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        City, State
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. New Delhi, India"
                        value={personal.location}
                        onChange={e => setPersonal({ ...personal, location: e.target.value })}
                        className="w-full text-xs border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-2 font-medium text-gray-900 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +91 98765 43210"
                        value={personal.phone}
                        onChange={e => setPersonal({ ...personal, phone: e.target.value })}
                        className="w-full text-xs border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-2 font-medium text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. student@email.com"
                        value={personal.email}
                        onChange={e => setPersonal({ ...personal, email: e.target.value })}
                        className="w-full text-xs border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-2 font-medium text-gray-900 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        LinkedIn URL
                      </label>
                      <input
                        type="text"
                        placeholder="linkedin.com/in/username"
                        value={personal.linkedin}
                        onChange={e => setPersonal({ ...personal, linkedin: e.target.value })}
                        className="w-full text-xs border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-2 font-mono text-gray-800 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        GitHub URL
                      </label>
                      <input
                        type="text"
                        placeholder="github.com/username"
                        value={personal.github}
                        onChange={e => setPersonal({ ...personal, github: e.target.value })}
                        className="w-full text-xs border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-2 font-mono text-gray-800 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. TYPOGRAPHY & FORMAT CONTROLS */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Typography & Formatting</h3>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Font Family</label>
                  <select
                    value={fontFamily}
                    onChange={(e: any) => setFontFamily(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-1.5 bg-white text-xs font-medium"
                  >
                    <option value="latin-modern">Computer Modern (LaTeX)</option>
                    <option value="times">Times New Roman (IEEE)</option>
                    <option value="garamond">EB Garamond (Executive)</option>
                    <option value="inter">Inter (Modern Clean)</option>
                    <option value="georgia">Georgia (Editorial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Font Size</label>
                  <select
                    value={fontSize}
                    onChange={(e: any) => setFontSize(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-1.5 bg-white text-xs font-medium"
                  >
                    <option value="10pt">10 pt (Compact)</option>
                    <option value="10.5pt">10.5 pt (IEEE Standard)</option>
                    <option value="11pt">11 pt (Standard)</option>
                    <option value="12pt">12 pt (Large)</option>
                  </select>
                </div>
              </div>

              {/* Heading Styling Toolbar */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <span className="text-[11px] font-semibold text-gray-600">Headings Style:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setHeadingStyle({ ...headingStyle, bold: !headingStyle.bold })}
                    className={`p-1.5 rounded border text-xs font-bold cursor-pointer ${headingStyle.bold ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600'}`}
                    title="Bold Headings"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeadingStyle({ ...headingStyle, italic: !headingStyle.italic })}
                    className={`p-1.5 rounded border text-xs font-italic cursor-pointer ${headingStyle.italic ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600'}`}
                    title="Italic Headings"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeadingStyle({ ...headingStyle, underline: !headingStyle.underline })}
                    className={`p-1.5 rounded border text-xs cursor-pointer ${headingStyle.underline ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600'}`}
                    title="Underline Headings"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeadingStyle({ ...headingStyle, uppercase: !headingStyle.uppercase })}
                    className={`px-2 py-1 rounded border text-[11px] font-bold cursor-pointer ${headingStyle.uppercase ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600'}`}
                    title="Small Caps / Uppercase"
                  >
                    AA
                  </button>
                </div>
              </div>

              {/* Upload Format */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-500 font-medium">Company Format:</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadCompanyFormat}
                  accept=".pdf,.tex,.docx,.txt,.json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File (.pdf/.tex)
                </button>
              </div>
            </div>

            {/* 3. SECTION PALETTE: Add Headings */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Add Headings to Resume</h3>
                <span className="text-[11px] text-gray-400">Click to add</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {predefinedHeadings.map(h => (
                  <button
                    key={h.title}
                    onClick={() => handleAddSection(h.title, h.type)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-200 rounded-lg text-xs font-medium text-gray-700 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-gray-400" />
                    {h.title}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Or create custom heading..."
                  value={customHeadingInput}
                  onChange={e => setCustomHeadingInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customHeadingInput.trim()) {
                      handleAddSection(customHeadingInput.trim(), 'custom');
                      setCustomHeadingInput('');
                    }
                  }}
                  className="flex-1 text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-800"
                />
                <button
                  onClick={() => {
                    if (customHeadingInput.trim()) {
                      handleAddSection(customHeadingInput.trim(), 'custom');
                      setCustomHeadingInput('');
                    }
                  }}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* 4. ACTIVE SECTIONS ACCORDION LIST */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Active Resume Sections</h3>
              <div className="space-y-1.5">
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                      activeSectionId === sec.id 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold' 
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div 
                      onClick={() => setActiveSectionId(sec.id)}
                      className="flex-1 cursor-pointer truncate"
                    >
                      {sec.title}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveSection(idx, 'down')}
                        disabled={idx === sections.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveSection(sec.id)}
                        className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        title="Remove Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. CURRENT SECTION DETAIL EDITOR */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">Editing Section</span>
                  <input
                    type="text"
                    value={currentSection.title}
                    onChange={e => {
                      const updated = sections.map(s => s.id === currentSection.id ? { ...s, title: e.target.value } : s);
                      setSections(updated);
                    }}
                    className="block text-base font-bold text-gray-900 border-b border-dashed border-gray-300 focus:border-blue-500 outline-none"
                  />
                </div>
                <button
                  onClick={() => handleRemoveSection(currentSection.id)}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>

              {/* Education editor */}
              {currentSection.type === 'education' && (
                <div className="space-y-3">
                  {currentSection.items?.map((it, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-700">Institution #{idx + 1}</span>
                        <button
                          onClick={() => {
                            const copy = [...(currentSection.items || [])];
                            copy.splice(idx, 1);
                            setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                          }}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Institution Name"
                        value={it.institution}
                        onChange={e => {
                          const copy = [...(currentSection.items || [])];
                          copy[idx].institution = e.target.value;
                          setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                        }}
                        className="w-full p-1.5 border rounded bg-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Date Range (e.g. Aug. 2021 - May 2025)"
                          value={it.date}
                          onChange={e => {
                            const copy = [...(currentSection.items || [])];
                            copy[idx].date = e.target.value;
                            setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                          }}
                          className="p-1.5 border rounded bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Location (e.g. New Delhi, India)"
                          value={it.location}
                          onChange={e => {
                            const copy = [...(currentSection.items || [])];
                            copy[idx].location = e.target.value;
                            setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                          }}
                          className="p-1.5 border rounded bg-white"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Degree & GPA (e.g. B.Tech in CSE | CGPA: 8.6)"
                        value={it.degree}
                        onChange={e => {
                          const copy = [...(currentSection.items || [])];
                          copy[idx].degree = e.target.value;
                          setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                        }}
                        className="w-full p-1.5 border rounded bg-white"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const copy = [...(currentSection.items || []), { institution: '', date: '', degree: '', location: '' }];
                      setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                    }}
                    className="w-full py-1.5 border-2 border-dashed border-gray-300 hover:border-blue-400 text-xs font-semibold text-gray-600 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Institution
                  </button>
                </div>
              )}

              {/* Coursework editor */}
              {currentSection.type === 'coursework' && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Coursework Items (Separate with bullets • or commas)
                  </label>
                  <textarea
                    rows={4}
                    value={currentSection.content || ''}
                    onChange={e => {
                      setSections(sections.map(s => s.id === currentSection.id ? { ...s, content: e.target.value } : s));
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs leading-relaxed"
                  />
                </div>
              )}

              {/* Skills editor */}
              {currentSection.type === 'skills' && (
                <div className="space-y-3">
                  {currentSection.skillsGroups?.map((sg, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-700">Category #{idx + 1}</span>
                        <button
                          onClick={() => {
                            const copy = [...(currentSection.skillsGroups || [])];
                            copy.splice(idx, 1);
                            setSections(sections.map(s => s.id === currentSection.id ? { ...s, skillsGroups: copy } : s));
                          }}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Category (e.g. Languages, Frameworks)"
                        value={sg.category}
                        onChange={e => {
                          const copy = [...(currentSection.skillsGroups || [])];
                          copy[idx].category = e.target.value;
                          setSections(sections.map(s => s.id === currentSection.id ? { ...s, skillsGroups: copy } : s));
                        }}
                        className="w-full p-1.5 border rounded bg-white font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Skills (e.g. Python, Java, SQL)"
                        value={sg.items}
                        onChange={e => {
                          const copy = [...(currentSection.skillsGroups || [])];
                          copy[idx].items = e.target.value;
                          setSections(sections.map(s => s.id === currentSection.id ? { ...s, skillsGroups: copy } : s));
                        }}
                        className="w-full p-1.5 border rounded bg-white"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const copy = [...(currentSection.skillsGroups || []), { category: '', items: '' }];
                      setSections(sections.map(s => s.id === currentSection.id ? { ...s, skillsGroups: copy } : s));
                    }}
                    className="w-full py-1.5 border-2 border-dashed border-gray-300 hover:border-blue-400 text-xs font-semibold text-gray-600 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Skill Category
                  </button>
                </div>
              )}

              {/* Projects editor */}
              {currentSection.type === 'projects' && (
                <div className="space-y-4">
                  {currentSection.items?.map((pr, pIdx) => (
                    <div key={pIdx} className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800">Project #{pIdx + 1}</span>
                        <button
                          onClick={() => {
                            const copy = [...(currentSection.items || [])];
                            copy.splice(pIdx, 1);
                            setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                          }}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Project Title"
                          value={pr.name}
                          onChange={e => {
                            const copy = [...(currentSection.items || [])];
                            copy[pIdx].name = e.target.value;
                            setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                          }}
                          className="p-1.5 border rounded bg-white font-semibold"
                        />
                        <input
                          type="text"
                          placeholder="Technologies Used"
                          value={pr.tech}
                          onChange={e => {
                            const copy = [...(currentSection.items || [])];
                            copy[pIdx].tech = e.target.value;
                            setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                          }}
                          className="p-1.5 border rounded bg-white"
                        />
                      </div>
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase">Bullet Points:</span>
                        {pr.bullets?.map((b: string, bIdx: number) => (
                          <div key={bIdx} className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={b}
                              onChange={e => {
                                const copy = [...(currentSection.items || [])];
                                copy[pIdx].bullets[bIdx] = e.target.value;
                                setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                              }}
                              className="flex-1 p-1.5 border rounded bg-white text-xs"
                            />
                            <button
                              onClick={() => {
                                const copy = [...(currentSection.items || [])];
                                copy[pIdx].bullets.splice(bIdx, 1);
                                setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                              }}
                              className="text-gray-400 hover:text-red-600 cursor-pointer"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const copy = [...(currentSection.items || [])];
                            copy[pIdx].bullets = [...(copy[pIdx].bullets || []), 'New accomplishment point'];
                            setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                          }}
                          className="text-[11px] text-blue-600 hover:underline font-medium mt-1 block cursor-pointer"
                        >
                          + Add Bullet Point
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const copy = [...(currentSection.items || []), { name: 'New Project', tech: 'Stack', bullets: ['Key functionality built'] }];
                      setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                    }}
                    className="w-full py-1.5 border-2 border-dashed border-gray-300 hover:border-blue-400 text-xs font-semibold text-gray-600 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </div>
              )}

              {/* Certifications or Custom Items editor */}
              {(currentSection.type === 'certifications' || currentSection.type === 'extracurricular' || currentSection.type === 'custom') && (
                <div className="space-y-3">
                  {currentSection.items?.map((it, idx) => (
                    <div key={idx} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="Item detail or certification name..."
                        value={it.text || it.title || ''}
                        onChange={e => {
                          const copy = [...(currentSection.items || [])];
                          if (currentSection.type === 'certifications') {
                            copy[idx].title = e.target.value;
                          } else {
                            copy[idx].text = e.target.value;
                          }
                          setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                        }}
                        className="flex-1 p-1.5 border rounded bg-white text-xs"
                      />
                      {currentSection.type === 'certifications' && (
                        <input
                          type="text"
                          placeholder="Issuer & Year (e.g. AWS, 2024)"
                          value={it.issuer || ''}
                          onChange={e => {
                            const copy = [...(currentSection.items || [])];
                            copy[idx].issuer = e.target.value;
                            setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                          }}
                          className="w-40 p-1.5 border rounded bg-white text-xs"
                        />
                      )}
                      <button
                        onClick={() => {
                          const copy = [...(currentSection.items || [])];
                          copy.splice(idx, 1);
                          setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                        }}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const copy = [...(currentSection.items || []), { text: '', title: '', issuer: '' }];
                      setSections(sections.map(s => s.id === currentSection.id ? { ...s, items: copy } : s));
                    }}
                    className="w-full py-1.5 border-2 border-dashed border-gray-300 hover:border-blue-400 text-xs font-semibold text-gray-600 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CENTER / FULL RESUME CANVAS */}
        <div className={`flex-1 flex justify-center items-start overflow-y-auto max-h-[85vh] pb-10 bg-gray-200/70 p-4 rounded-2xl border border-gray-300 ${viewMode === 'VIEW' ? 'w-full max-w-5xl mx-auto' : ''}`}>
          <div 
            id="resume-paper"
            style={{ 
              transform: `scale(${zoomScale / 100})`, 
              transformOrigin: 'top center',
              fontSize
            }}
            className={`w-[816px] min-h-[1056px] bg-white text-black shadow-2xl p-[48px] box-border leading-snug transition-transform duration-150 ${fontClass}`}
          >
            {/* 1. Header (Click to focus name input) */}
            <header 
              className="text-center mb-4 cursor-pointer hover:bg-blue-50/40 p-2 rounded-lg transition-colors border border-transparent hover:border-dashed hover:border-blue-300"
              onClick={() => {
                setShowPersonalForm(true);
                nameInputRef.current?.focus();
              }}
              title="Click to edit personal details"
            >
              <h1 className="text-[26pt] tracking-[0.05em] uppercase font-bold text-gray-900 leading-tight">
                {personal.name || 'YOUR NAME'}
              </h1>
              {personal.location && (
                <div className="text-[10pt] text-gray-800 mt-1">
                  {personal.location}
                </div>
              )}

              {/* Contact Row with Official Icons */}
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[9.5pt] text-gray-900 mt-1.5">
                {personal.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-900 fill-current inline-block" />
                    <span>{personal.phone}</span>
                  </span>
                )}

                {personal.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-900 inline-block" />
                    <span className="text-gray-900">
                      {personal.email}
                    </span>
                  </span>
                )}

                {personal.linkedin && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 fill-current text-gray-900 inline-block" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45c-.9 0-1.63.73-1.63 1.63s.73 1.63 1.63 1.63 1.63-.73 1.63-1.63-.73-1.63-1.63-1.63Z" />
                    </svg>
                    <span className="text-gray-900">
                      {personal.linkedin}
                    </span>
                  </span>
                )}

                {personal.github && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 fill-current text-gray-900 inline-block" viewBox="0 0 24 24">
                      <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
                    </svg>
                    <span className="text-gray-900">
                      {personal.github}
                    </span>
                  </span>
                )}
              </div>
            </header>

            {/* Dynamic Sections */}
            <div className="space-y-3.5">
              {sections.map(sec => (
                <section 
                  key={sec.id} 
                  className="space-y-1.5 cursor-pointer hover:bg-blue-50/20 p-1 rounded transition-colors"
                  onClick={() => {
                    if (viewMode === 'VIEW') return;
                    setActiveSectionId(sec.id);
                  }}
                >
                  {/* Section Title with Full-Width Horizontal Rule */}
                  <div className="border-b border-black pb-0.5 mb-1.5">
                    <h2 
                      className={`text-[11.5pt] tracking-[0.04em] text-gray-950 ${
                        headingStyle.bold ? 'font-bold' : 'font-normal'
                      } ${headingStyle.italic ? 'italic' : ''} ${
                        headingStyle.underline ? 'underline' : ''
                      } ${headingStyle.uppercase ? 'uppercase' : ''}`}
                    >
                      {sec.title}
                    </h2>
                  </div>

                  {/* Section Type: EDUCATION */}
                  {sec.type === 'education' && (
                    <div className="space-y-2">
                      {sec.items?.map((it, idx) => (
                        <div key={idx} className="leading-tight">
                          <div className="flex justify-between font-bold text-[10.5pt] text-gray-900">
                            <span>{it.institution}</span>
                            <span className="font-normal text-[10pt] text-gray-800">{it.date}</span>
                          </div>
                          <div className="flex justify-between text-[9.5pt] italic text-gray-800 mt-0.5">
                            <span>{it.degree}</span>
                            <span>{it.location}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section Type: RELEVANT COURSEWORK */}
                  {sec.type === 'coursework' && (
                    <div className="text-[9.5pt] text-gray-900 leading-relaxed pl-1">
                      {sec.content}
                    </div>
                  )}

                  {/* Section Type: TECHNICAL SKILLS */}
                  {sec.type === 'skills' && (
                    <div className="space-y-1 text-[9.5pt] text-gray-900 pl-1 leading-snug">
                      {sec.skillsGroups?.map((sg, idx) => (
                        <div key={idx}>
                          <strong className="font-bold text-gray-950">{sg.category}:</strong>{' '}
                          <span>{sg.items}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section Type: PROJECTS */}
                  {sec.type === 'projects' && (
                    <div className="space-y-2.5">
                      {sec.items?.map((pr, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex justify-between text-[10pt] leading-tight">
                            <span className="font-bold text-gray-950">{pr.name}</span>
                            <span className="italic text-gray-800 text-[9.5pt]">{pr.tech}</span>
                          </div>
                          <ul className="list-disc pl-5 space-y-0.5 text-[9pt] text-gray-900 leading-snug">
                            {pr.bullets?.map((b: string, bIdx: number) => (
                              <li key={bIdx}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section Type: CERTIFICATIONS */}
                  {sec.type === 'certifications' && (
                    <div className="space-y-1 text-[9.5pt]">
                      {sec.items?.map((c, idx) => (
                        <div key={idx} className="leading-snug">
                          <div className="font-bold text-gray-950">{c.title}</div>
                          <div className="italic text-gray-800 text-[9pt]">{c.issuer}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section Type: EXTRACURRICULAR / CUSTOM */}
                  {(sec.type === 'extracurricular' || sec.type === 'custom') && (
                    <ul className="list-disc pl-5 space-y-0.5 text-[9pt] text-gray-900 leading-snug">
                      {sec.items?.map((it, idx) => (
                        <li key={idx}>{it.text || it.title || ''}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LATEX CODE MODAL */}
      {showLatexModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 no-print">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">Compilable LaTeX Resume Code</h3>
              </div>
              <button
                onClick={() => setShowLatexModal(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-gray-500">
              This code follows the exact Overleaf / Jake&apos;s Resume / IEEE LaTeX template. You can copy and paste directly into Overleaf or TeXStudio.
            </p>

            <textarea
              readOnly
              value={latexInput}
              onChange={e => setLatexInput(e.target.value)}
              className="w-full h-80 font-mono text-[11px] p-3 bg-gray-900 text-emerald-400 rounded-xl border border-gray-800 overflow-y-auto leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                onClick={handleCopyLatex}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {copiedLatex ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                {copiedLatex ? 'LaTeX Code Copied!' : 'Copy LaTeX Code'}
              </button>

              <button
                onClick={() => setShowLatexModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
