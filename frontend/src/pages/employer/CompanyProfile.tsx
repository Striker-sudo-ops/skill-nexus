import { useState, useEffect } from 'react';
import { getEmployerProfile, updateEmployerProfile } from '../../services/api';
import { Button, Input, Select, Spinner, useToast } from '../../components/ui';

export default function CompanyProfile() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    company_name: '', industry: '', website: '', city: '', state: '', description: ''
  });

  const industries = ['IT', 'Mechanical', 'Electrical', 'Civil', 'Healthcare', 'Data Science', 'Design', 'Marketing', 'Automotive', 'Aerospace', 'Manufacturing', 'Energy', 'Ecommerce'].map(i => ({label: i, value: i}));

  useEffect(() => {
    getEmployerProfile().then(res => {
      if(res.data) setProfile({...profile, ...res.data});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: any) => {
    e.preventDefault();
    try {
      await updateEmployerProfile(profile);
      toast.success('Company Profile Saved');
    } catch (err) {
      toast.error('Error saving profile');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Company Profile</h1>
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <Input label="Company Name" required value={profile.company_name} onChange={(e:any) => setProfile({...profile, company_name: e.target.value})} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Industry" options={industries} value={profile.industry} onChange={(e:any) => setProfile({...profile, industry: e.target.value})} />
          <Input label="Website URL" type="url" value={profile.website} onChange={(e:any) => setProfile({...profile, website: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="City" required value={profile.city} onChange={(e:any) => setProfile({...profile, city: e.target.value})} />
          <Input label="State" required value={profile.state} onChange={(e:any) => setProfile({...profile, state: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
          <textarea rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={profile.description} onChange={(e:any) => setProfile({...profile, description: e.target.value})} />
        </div>
        <div className="pt-4 border-t">
          <Button type="submit" className="w-full">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
