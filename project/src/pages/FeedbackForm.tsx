import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';

interface FeedbackFormProps {
  feedbackSubmission: {
    id: string;
    course: {
      name: string;
      id?: string;
      faculty?: {
        faculty_name: string;
      } | null;
    };
    feedback_type: string;
    start_date: string;
    end_date: string;
  };
  onBack: () => void;
  onSubmit: () => void;
}

interface Question {
  id: string;
  question_text: string;
  options: Array<{
    id: string;
    text: string;
    value: number;
  }>;
  is_required: boolean;
  order: number;
}

export default function FeedbackForm({ feedbackSubmission, onBack, onSubmit }: FeedbackFormProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState<any>({});

  useEffect(() => {
    fetchQuestions();
    logDebugInfo();
  }, []);

  // Function to log detailed debug information
  async function logDebugInfo() {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Auth error:", userError);
        setDebug((prev:any)=> ({ ...prev, authError: userError.message }));
      }
      
      if (user) {
        setDebug((prev: any) => ({ ...prev, userId: user.id }));
      }
      
      // Log submission details
      setDebug((prev: any) => ({ 
        ...prev, 
        submissionId: feedbackSubmission.id,
        feedbackType: feedbackSubmission.feedback_type,
        courseId: feedbackSubmission.course.id || feedbackSubmission.id.split('-')[0]
      }));
      
      // Test basic database access
      const { data: testData, error: testError } = await supabase
        .from('feedback_questions')
        .select('id')
        .limit(1);
        
      if (testError) {
        console.error("Database access error:", testError);
        setDebug((prev: any) => ({ ...prev, dbAccessError: testError.message }));
      } else {
        setDebug((prev: any) => ({ ...prev, dbAccessOk: true }));
      }
      
    } catch (err) {
      console.error("Debug info error:", err);
      setDebug((prev:any) => ({ ...prev, debugError: err instanceof Error ? err.message : String(err) }));
    }
  }

  async function fetchQuestions() {
    try {
      const { data, error } = await supabase
        .from('feedback_questions')
        .select('*')
        .order('order');

      if (error) throw error;
      
      if (data && Array.isArray(data)) {
        console.log('Fetched questions:', data);
        setQuestions(data);
      } else {
        throw new Error('Invalid question data format');
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw new Error(`Authentication error: ${userError.message}`);
      if (!user) throw new Error("No authenticated user found");
      
      // Extract course ID
      const courseId = feedbackSubmission.course.id || feedbackSubmission.id.split('-')[0];
      const feedbackType = feedbackSubmission.feedback_type;
      
      console.log("Submission attempt with:", { courseId, feedbackType, userId: user.id });
      
      // Check if submission already exists
      const { data: existingSubmission, error: checkError } = await supabase
        .from('feedback_submissions')
        .select('id, status')
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .eq('feedback_type', feedbackType)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing submission:", checkError);
        throw new Error(`Error checking existing submission: ${checkError.message}`);
      }
      
      let submissionId;
      if (existingSubmission) {
        submissionId = existingSubmission.id;
        console.log("Existing submission found:", submissionId);
      } else {
        // Create a new submission
        const submissionData = {
          course_id: courseId,
          student_id: user.id,
          feedback_type: feedbackType,
          status: 'pending',
          submitted_at: new Date().toISOString()
        };
        
        const { data: createdSubmission, error: createError } = await supabase
          .from('feedback_submissions')
          .insert([submissionData])
          .select();
        
        if (createError) {
          console.error("Error creating submission:", createError);
          throw new Error(`Submission creation failed: ${createError.message}`);
        }
        
        if (!createdSubmission || createdSubmission.length === 0) {
          throw new Error("No submission was created");
        }
        
        submissionId = createdSubmission[0].id;
        console.log("Created submission:", submissionId);
      }
      
      // Validate required questions
      const unansweredRequired = questions
        .filter(q => q.is_required && !answers[q.id])
        .map(q => q.question_text);

      if (unansweredRequired.length > 0) {
        throw new Error(`Please answer all required questions: ${unansweredRequired.join(', ')}`);
      }

      // Prepare responses
      const feedbackResponses = Object.entries(answers).map(([questionId, answer]) => ({
        submission_id: submissionId,
        question_id: questionId,
        answer: answer,
        student_id: user.id,
        email: user.email
      }));

      console.log('Submitting responses:', feedbackResponses);

      // Insert responses
      const { error: insertError } = await supabase
        .from('feedback_responses')
        .insert(feedbackResponses);

      if (insertError) {
        throw new Error(`Failed to save responses: ${insertError.message}`);
      }

      // Update submission status to 'completed'
      const { error: updateError } = await supabase
        .from('feedback_submissions')
        .update({ status: 'completed' })
        .eq('id', submissionId);

      if (updateError) {
        throw new Error(`Failed to update submission status: ${updateError.message}`);
      }

      console.log('Feedback submitted successfully');
      onSubmit();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h2 className="text-2xl font-semibold">{feedbackSubmission.course.name}</h2>
          <p className="text-gray-600">
            {feedbackSubmission.feedback_type === 'mid_module' ? 'Mid Module' : 'End Module'} Feedback
            {feedbackSubmission.course.faculty && ` - ${feedbackSubmission.course.faculty.faculty_name}`}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {/* Debug information - remove in production */}
      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 text-gray-700 rounded-md text-sm">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(debug, null, 2)}
        </pre>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.length > 0 ? (
          questions.map((question) => (
            <div key={question.id} className="border-b pb-6">
              <label className="block mb-4">
                <span className="text-gray-700 font-medium">
                  {question.order}. {question.question_text}
                  {question.is_required && <span className="text-red-500">*</span>}
                </span>
              </label>
              <div className="space-y-2">
                {question.options && Array.isArray(question.options) ? (
                  question.options.map((option) => (
                    <label key={option.id} className="flex items-center">
                      <input
                        type="radio"
                        name={question.id}
                        value={option.id}
                        checked={answers[question.id] === option.id}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700">{option.text}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-red-500">No options available for this question</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No questions available</p>
        )}

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={submitting || questions.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
}