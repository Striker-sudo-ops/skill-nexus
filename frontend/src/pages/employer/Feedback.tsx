import React, { useState, useEffect } from 'react';
import { getEmployerFeedbacks, submitCandidateFeedback } from '../../services/api';
import { Card, Badge, Spinner, Button, Input } from '../../components/ui';
import { Star, CheckCircle, XCircle, Plus } from 'lucide-react';

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    candidate_name: '',
    course_or_role: '',
    rating: 5,
    job_ready: true,
    missing_skills: '',
    suggested_skills: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchFeedbacks = () => {
    setLoading(true);
    getEmployerFeedbacks()
      .then(res => setFeedbacks(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitCandidateFeedback(formData);
      setFormData({
        candidate_name: '',
        course_or_role: '',
        rating: 5,
        job_ready: true,
        missing_skills: '',
        suggested_skills: ''
      });
      setShowForm(false);
      fetchFeedbacks();
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidate Performance & Training Feedback</h1>
          <p className="text-xs text-gray-500 mt-0.5">Rate hired graduates, report job readiness, identify missing skills, and propose curriculum additions</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          {showForm ? 'Cancel Feedback' : 'Submit Candidate Rating'}
        </button>
      </div>

      {/* Inline Feedback Form */}
      {showForm && (
        <Card className="p-5 border-2 border-blue-100 bg-blue-50/20">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Rate Candidate & Provide Training Insights</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Candidate Full Name"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.candidate_name}
                onChange={(e: any) => setFormData({ ...formData, candidate_name: e.target.value })}
              />
              <Input
                label="Hired Role or Course Completed"
                required
                placeholder="e.g. EV Powertrain Diagnostics / CRS-EV-101"
                value={formData.course_or_role}
                onChange={(e: any) => setFormData({ ...formData, course_or_role: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Performance Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={`w-6 h-6 ${star <= formData.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-700 ml-2">{formData.rating} of 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Was the candidate job-ready on day one?</label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-1.5 text-xs text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="job_ready"
                      checked={formData.job_ready === true}
                      onChange={() => setFormData({ ...formData, job_ready: true })}
                      className="text-blue-600"
                    />
                    <span>Yes, Job-Ready</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="job_ready"
                      checked={formData.job_ready === false}
                      onChange={() => setFormData({ ...formData, job_ready: false })}
                      className="text-blue-600"
                    />
                    <span>No, Required Additional Training</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Identified Missing Skills (Skill Gaps)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Lacked hands-on experience with live CAN bus telemetry diagnostics..."
                  value={formData.missing_skills}
                  onChange={e => setFormData({ ...formData, missing_skills: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Suggested Skills to Add to Government Courses</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Include high-voltage ISO safety protocols and battery fault simulation..."
                  value={formData.suggested_skills}
                  onChange={e => setFormData({ ...formData, suggested_skills: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5"
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting Feedback...' : 'Submit Candidate Evaluation'}
            </Button>
          </form>
        </Card>
      )}

      {/* Past Feedbacks List */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-900">Recorded Candidate Feedback & Recommendations</h2>
          {feedbacks.map(f => (
            <Card key={f.id} className="p-4 border border-gray-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-gray-900">{f.candidate_name}</span>
                  <span className="text-gray-500 ml-2">({f.course_or_role})</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= f.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded ${
                    f.job_ready ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {f.job_ready ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {f.job_ready ? 'Job Ready' : 'Needed Training'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                {f.missing_skills && (
                  <div className="text-gray-600">
                    <span className="font-semibold text-red-700">Missing Skills:</span> {f.missing_skills}
                  </div>
                )}
                {f.suggested_skills && (
                  <div className="text-gray-600">
                    <span className="font-semibold text-blue-700">Suggested for Course:</span> {f.suggested_skills}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
