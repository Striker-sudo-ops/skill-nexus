import { useState, useEffect } from 'react';
import { checkFeedbackStatus, submitCourseFeedback } from '../../services/api';
import { Star, Briefcase, BookOpen, CheckCircle, X } from 'lucide-react';

interface CourseFeedbackFormProps {
  courseId: number;
  courseTitle: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function CourseFeedbackForm({ courseId, courseTitle, onClose, onSubmitted }: CourseFeedbackFormProps) {
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    got_employed: null as boolean | null,
    course_helped: null as boolean | null,
    satisfaction_score: 0,
    feedback_text: '',
  });

  useEffect(() => {
    const check = async () => {
      try {
        const res = await checkFeedbackStatus(courseId);
        setAlreadySubmitted(res.data?.submitted || false);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [courseId]);

  const handleSubmit = async () => {
    if (form.got_employed === null || form.course_helped === null || form.satisfaction_score === 0) return;
    setSubmitting(true);
    try {
      await submitCourseFeedback({
        course_id: courseId,
        got_employed: form.got_employed,
        course_helped: form.course_helped,
        satisfaction_score: form.satisfaction_score,
        feedback_text: form.feedback_text || null,
      });
      setSubmitted(true);
      if (onSubmitted) onSubmitted();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Course Feedback</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {alreadySubmitted ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
              <p className="font-semibold text-gray-900 dark:text-white">Feedback already submitted</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">You've already shared your feedback for <strong>{courseTitle}</strong>. Thank you!</p>
              <button onClick={onClose} className="mt-2 px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">Close</button>
            </div>
          ) : submitted ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
              <p className="font-bold text-gray-900 dark:text-white text-lg">Thank you for your feedback!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Your response helps improve course quality and placement ratings for future students.</p>
              <button onClick={onClose} className="mt-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold cursor-pointer hover:bg-blue-700">Done</button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{courseTitle}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Your honest feedback helps the government improve training programmes.</p>
              </div>

              {/* Got Employed */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  Did this course help you get employed?
                </label>
                <div className="flex gap-3">
                  {[{ val: true, label: 'Yes, I got employed!', color: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' }, { val: false, label: 'Not yet', color: 'border-gray-300 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400' }].map(opt => (
                    <button
                      key={String(opt.val)}
                      onClick={() => setForm(f => ({ ...f, got_employed: opt.val }))}
                      className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-medium cursor-pointer transition-all ${form.got_employed === opt.val ? opt.color + ' ring-2 ring-offset-1' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Course Helped */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Did this course contribute to your career development?</label>
                <div className="flex gap-3">
                  {[{ val: true, label: 'Yes, very helpful' }, { val: false, label: 'Not much' }].map(opt => (
                    <button
                      key={String(opt.val)}
                      onClick={() => setForm(f => ({ ...f, course_helped: opt.val }))}
                      className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-medium cursor-pointer transition-all ${form.course_helped === opt.val ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-2 ring-offset-1 ring-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400" />
                  Overall Satisfaction (1–5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setForm(f => ({ ...f, satisfaction_score: n }))}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all ${form.satisfaction_score >= n ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      <Star className={`w-4 h-4 mx-auto ${form.satisfaction_score >= n ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    </button>
                  ))}
                </div>
                <div className="text-center text-xs text-gray-400 mt-1">
                  {form.satisfaction_score === 0 ? 'Select a rating' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][form.satisfaction_score]}
                </div>
              </div>

              {/* Optional text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Additional Comments (optional)</label>
                <textarea
                  placeholder="Share anything else about your experience with this course..."
                  value={form.feedback_text}
                  onChange={e => setForm(f => ({ ...f, feedback_text: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || form.got_employed === null || form.course_helped === null || form.satisfaction_score === 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
