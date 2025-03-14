import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Box, Paper, Typography, Button, Grid, Radio, FormControl,
         FormControlLabel, RadioGroup, Alert, CircularProgress,
         IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(`Authentication error: ${userError.message}`);
      if (!user) throw new Error("No authenticated user found");
      
      const courseId = feedbackSubmission.course.id || feedbackSubmission.id.split('-')[0];
      const feedbackType = feedbackSubmission.feedback_type;

      // First check if submission already exists
      const { data: existingSubmission, error: checkError } = await supabase
        .from('feedback_submissions')
        .select('id')
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .eq('feedback_type', feedbackType)
        .single();

      let submissionId;

      if (existingSubmission) {
        // Use existing submission
        submissionId = existingSubmission.id;
      } else {
        // Create new submission if none exists
        const { data: newSubmission, error: createError } = await supabase
          .from('feedback_submissions')
          .insert([{
            course_id: courseId,
            student_id: user.id,
            feedback_type: feedbackType,
            status: 'pending',
            submitted_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) throw new Error(`Failed to create submission: ${createError.message}`);
        if (!newSubmission) throw new Error("No submission was created");
        
        submissionId = newSubmission.id;
      }

      // Delete any existing responses for this submission
      await supabase
        .from('feedback_responses')
        .delete()
        .eq('submission_id', submissionId);

      // Insert new responses
      const { error: responsesError } = await supabase
        .from('feedback_responses')
        .insert(
          Object.entries(answers).map(([questionId, answer]) => ({
            submission_id: submissionId,
            question_id: questionId,
            answer: answer,
            student_id: user.id,
            email: user.email
          }))
        );

      if (responsesError) throw new Error(`Failed to save responses: ${responsesError.message}`);

      // Update submission status to submitted
      const { error: updateError } = await supabase
        .from('feedback_submissions')
        .update({ 
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (updateError) throw new Error(`Failed to update status: ${updateError.message}`);

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
      <Box display="flex" justifyContent="center" alignItems="center" height="64px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Navbar />
      <Box sx={{ mt: 10 }}> {/* Added margin top */}
        <Paper elevation={3}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 3 }}>
            <Box display="flex" alignItems="center">
              <IconButton onClick={onBack} sx={{ mr: 2 }}>
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant="h5" color="primary">
                  {feedbackSubmission.course.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feedbackSubmission.feedback_type === 'mid_module' ? 'Mid Module' : 'End Module'} Feedback
                  {feedbackSubmission.course.faculty && ` - ${feedbackSubmission.course.faculty.faculty_name}`}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box p={3}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box display="flex" flexDirection="column" gap={4}>
                {questions.length > 0 ? (
                  questions.map((question) => (
                    <Box key={question.id} p={3} bgcolor="grey.100" borderRadius={2}>
                      <Typography variant="h6" gutterBottom>
                        {question.order}. {question.question_text}
                        {question.is_required && <Typography component="span" color="error">*</Typography>}
                      </Typography>
                      <FormControl component="fieldset">
                        <RadioGroup
                          name={question.id}
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        >
                          {question.options && Array.isArray(question.options) ? (
                            question.options.map((option) => (
                              <FormControlLabel
                                key={option.id}
                                value={option.id}
                                control={<Radio />}
                                label={option.text}
                              />
                            ))
                          ) : (
                            <Typography color="error">No options available for this question</Typography>
                          )}
                        </RadioGroup>
                      </FormControl>
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary" textAlign="center" py={8}>No questions available</Typography>
                )}

                <Box position="sticky" bottom={0} bgcolor="white" borderTop={1} borderColor="divider" p={3} mt={8}>
                  <Box display="flex" justifyContent="flex-end">
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={submitting || questions.length === 0}
                    >
                      {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </form>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}