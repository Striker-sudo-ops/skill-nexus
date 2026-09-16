
import { Button } from '../components/ui';
import { FileSearch, Target, MapPin, ClipboardCheck } from 'lucide-react';

export default function Landing({ openAuth }: { openAuth: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="px-8 py-6 flex justify-between items-center bg-white border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">SN</div>
          <span className="font-bold text-2xl text-gray-900">Skill Nexus</span>
        </div>
        <Button onClick={openAuth} variant="ghost" className="font-semibold">Sign In / Register</Button>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 max-w-4xl tracking-tight">
          Bridge the gap between <span className="text-blue-600">skills</span> and <span className="text-blue-600">opportunity</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl">
          The ultimate platform for students to find the right jobs and for employers to hire the best talent based on verified skills.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Button onClick={openAuth} className="px-8 py-4 text-lg">Find Jobs as a Student</Button>
          <Button onClick={openAuth} variant="secondary" className="px-8 py-4 text-lg border-2 border-gray-200">Hire Talent as an Employer</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl w-full">
          <FeatureCard icon={FileSearch} title="AI Resume Parser" desc="Upload your resume and we'll automatically extract your skills and experience." />
          <FeatureCard icon={Target} title="Skill Gap Analysis" desc="See exactly what skills you're missing for your dream job and learn them." />
          <FeatureCard icon={MapPin} title="Location-Based Jobs" desc="Find opportunities near you with smart distance-based ranking." />
          <FeatureCard icon={ClipboardCheck} title="Skill Testing" desc="Take tests to verify your skills and stand out to top employers." />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{desc}</p>
    </div>
  );
}
