import { useState, useEffect } from 'react';
import { getQuizQuestions, submitQuiz } from '../../services/api';
import { Button, Spinner, Card } from '../../components/ui';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export default function Quiz({ skillId, onNavigate }: { skillId: number, onNavigate: (page: string, params?: any) => void }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (!skillId) return;
    getQuizQuestions(skillId.toString()).then(res => {
      setQuestions(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [skillId]);

  const handleSelect = (opt: string) => {
    const newAnswers = [...answers];
    newAnswers[currentIdx] = { question_id: questions[currentIdx].id, chosen_option: opt };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setLoading(true);
      submitQuiz(skillId.toString(), { answers }).then(res => {
        setResults(res.data);
        setLoading(false);
      });
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;
  if (!questions.length) return <div className="text-center p-12">No quiz available for this skill.</div>;

  if (results) {
    const passed = results.score >= 60;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-8 text-center bg-white border-2 border-indigo-100">
          <h1 className="text-4xl font-black mb-2">{results.score} / {questions.length * 10}</h1>
          <div className={`text-2xl font-bold mb-4 flex items-center justify-center gap-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
            {passed ? <CheckCircle2 className="w-7 h-7 text-green-600" /> : <XCircle className="w-7 h-7 text-red-600" />}
            <span>{passed ? 'Passed!' : 'Not Passed'}</span>
          </div>
          {passed && (
            <p className="text-indigo-600 font-medium bg-indigo-50 p-3 rounded-lg mb-6 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Skill Verified! This skill is now marked as verified on your profile.</span>
            </p>
          )}
          <div className="flex justify-center gap-4">
            <Button onClick={() => window.location.reload()} variant="secondary">Retake Quiz</Button>
            <Button onClick={() => onNavigate('student/skill-detail', { skillId })}>Back to Skill</Button>
          </div>
        </Card>
        
        <div className="space-y-4">
          {results.breakdown?.map((b:any, i:number) => (
            <Card key={i} className={`p-4 border-l-4 ${b.is_correct ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <div className="flex gap-3 items-start">
                <span className="shrink-0 mt-0.5">
                  {b.is_correct ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </span>
                <div>
                  <p className="font-medium text-gray-900 mb-2">{b.question_text}</p>
                  <p className="text-sm text-gray-600 mb-1">Your answer: {b.chosen}</p>
                  {!b.is_correct && <p className="text-sm text-green-700 font-medium mb-1">Correct: {b.correct_answer}</p>}
                  {b.explanation && <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded">{b.explanation}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const selected = answers[currentIdx]?.chosen_option;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between text-sm font-medium text-gray-500">
        <span>Question {currentIdx + 1} of {questions.length}</span>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded-full">
        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${((currentIdx+1)/questions.length)*100}%` }}></div>
      </div>

      <Card className="p-8">
        <h2 className="text-xl font-bold mb-6 text-gray-900">{q.text}</h2>
        <div className="space-y-3">
          {['A', 'B', 'C', 'D'].map(opt => (
             <button
               key={opt}
               onClick={() => handleSelect(opt)}
               className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selected === opt ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
             >
               <span className="font-bold text-gray-400 mr-3">{opt}</span>
               {q[`option_${opt.toLowerCase()}`]}
             </button>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={!selected} className="px-8 py-3 bg-indigo-600">
          {currentIdx === questions.length - 1 ? 'Submit' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
