import React, { useState, useEffect } from 'react';
import { getConsultations, submitConsultation } from '../../services/api';
import { Card, Badge, Spinner, Button, Input } from '../../components/ui';
import { MessageSquare, Plus, Send } from 'lucide-react';

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ sector: '', topic: '', feedback_text: '', priority: 'MEDIUM' });
  const [submitting, setSubmitting] = useState(false);

  const fetchConsultations = () => {
    setLoading(true);
    getConsultations()
      .then(res => setConsultations(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitConsultation(formData);
      setFormData({ sector: '', topic: '', feedback_text: '', priority: 'MEDIUM' });
      setShowForm(false);
      fetchConsultations();
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Industry Consultations & Emerging Demands</h1>
          <p className="text-xs text-gray-500 mt-0.5">Submit industry recommendations to government skill councils to align vocational training programs</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          {showForm ? 'Cancel' : 'Submit Consultation'}
        </button>
      </div>

      {showForm && (
        <Card className="p-5 border-2 border-blue-100 bg-blue-50/20">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Propose Industry Requirement to Skill Councils</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Sector"
                required
                placeholder="e.g. Electric Vehicles"
                value={formData.sector}
                onChange={(e: any) => setFormData({ ...formData, sector: e.target.value })}
              />
              <Input
                label="Topic / Subject"
                required
                placeholder="e.g. High-Voltage Battery Diagnostic Standards"
                value={formData.topic}
                onChange={(e: any) => setFormData({ ...formData, topic: e.target.value })}
              />
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white"
                >
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Feedback & Requirement Specification</label>
              <textarea
                rows={3}
                required
                placeholder="Describe emerging workplace requirements, specialized machinery or software training needed in colleges/ITIs..."
                value={formData.feedback_text}
                onChange={e => setFormData({ ...formData, feedback_text: e.target.value })}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5"
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting...' : 'Submit to Government Skill Council'}
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map(c => (
            <Card key={c.id} className="p-4 border border-gray-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">{c.topic}</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-medium">{c.sector}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  c.priority === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-200' :
                  c.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {c.priority} PRIORITY
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">{c.feedback_text}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
