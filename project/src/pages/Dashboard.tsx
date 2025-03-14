import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Home, MessageSquare, LogOut, ChevronDown } from 'lucide-react';
import FeedbackForm from './FeedbackForm';

interface Profile {
  full_name: string;
  student_id: string;
  centre: string;
}

interface Course {
  id: string;
  name: string;
  faculty: {
    faculty_name: string;
  } | null;
  start_date: string;
  end_date: string;
}

interface FeedbackSubmission {
  id: string;
  course: Course;
  feedback_type: 'mid_module' | 'end_module';
  status: 'submitted' | 'pending' | 'expired' | 'not_started';
  submitted_at: string | null;
  start_date: string;
  end_date: string;
}

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('feedbacks');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);

  useEffect(() => {
    getProfile();
    getCourses();
  }, [user]);

  async function getProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, student_id, centre')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function getCourses() {
    try {
      // First get all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          name,
          start_date,
          end_date,
          faculty:faculty_id (
            faculty_name
          )
        `)
        .eq('is_active', true);

      if (coursesError) throw coursesError;

      // Then get feedback submissions for these courses
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback_submissions')
        .select(`
          id,
          course_id,
          feedback_type,
          status,
          submitted_at
        `)
        .eq('student_id', user.id);

      if (feedbackError) throw feedbackError;

      // Combine the data
      const feedbackSubmissions = coursesData.flatMap(course => {
        const courseFeedbacks = ['mid_module', 'end_module'].map(type => {
          const existingFeedback = feedbackData?.find(
            f => f.course_id === course.id && f.feedback_type === type
          );

          return {
            id: existingFeedback?.id || `${course.id}-${type}`,
            course: {
              ...course,
              faculty: course.faculty ? course.faculty : null
            },
            feedback_type: type,
            status: existingFeedback?.status || 'not_started',
            submitted_at: existingFeedback?.submitted_at || null,
            start_date: course.start_date,
            end_date: course.end_date
          };
        });

        return courseFeedbacks;
      });

      setCourses(coursesData);
      setFeedbacks(feedbackSubmissions);
    } catch (error) {
      console.error('Error fetching courses and feedbacks:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleFeedbackClick = (feedback: FeedbackSubmission) => {
    if (feedback.status !== 'submitted' && feedback.status !== 'expired') {
      setSelectedFeedback(feedback);
    }
  };

  const handleFeedbackSubmitted = () => {
    setSelectedFeedback(null);
    getCourses(); // Refresh the feedback list
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img src="https://www.cdac.in/img/cdac-logo.png" alt="CDAC Logo" className="h-8 brightness-0 invert" />
              <span className="ml-2 text-xl font-semibold text-white">Student Dashboard</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="flex items-center text-white hover:text-gray-200"
              >
                <LogOut className="h-5 w-5 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md min-h-[calc(100vh-4rem)]">
          <div className="p-4">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-2 flex items-center justify-center">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name || ''}`}
                  alt="Profile"
                  className="w-full h-full rounded-full"
                />
              </div>
              <h2 className="text-lg font-semibold">{profile?.full_name}</h2>
              <p className="text-sm text-gray-600">{profile?.student_id}</p>
              <p className="text-sm text-gray-600">{profile?.centre}</p>
            </div>

            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveSection('general')}
                  className={`w-full flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded ${activeSection === 'general' ? 'bg-gray-100' : ''}`}
                >
                  <Home className="h-5 w-5 mr-2" />
                  <span className="flex-1 text-left">General</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection('feedbacks')}
                  className={`w-full flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded ${activeSection === 'feedbacks' ? 'bg-gray-100' : ''}`}
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  <span className="flex-1 text-left">Feedbacks</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {activeSection === 'feedbacks' && (
                  <ul className="ml-8 mt-1 space-y-1">
                    <li>
                      <a href="#" className="block p-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                        Feedbacks
                      </a>
                    </li>
                  </ul>
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeSection === 'feedbacks' && !selectedFeedback && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-6">Feedbacks</h2>
              <div className="space-y-6">
                {courses.map((course, courseIndex) => (
                  <div key={course.id} className="border-b pb-4 last:border-b-0">
                    <h3 className="text-lg font-medium mb-2">
                      {courseIndex + 1}. {course.name}
                    </h3>
                    <div className="space-y-4">
                      {feedbacks
                        .filter(feedback => feedback.course.id === course.id)
                        .map(feedback => (
                          <div
                            key={`${feedback.course.id}-${feedback.feedback_type}`}
                            className={`pl-4 ${feedback.status !== 'submitted' && feedback.status !== 'expired'
                                ? 'cursor-pointer hover:bg-gray-50'
                                : ''
                              }`}
                            onClick={() => handleFeedbackClick(feedback)}
                          >
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div>
                                <span className="font-medium">
                                  {feedback.feedback_type === 'mid_module' ? 'Mid Module' : 'End Module'} Feedback
                                </span>
                                {feedback.course.faculty && (
                                  <>
                                    <span className="mx-2">-</span>
                                    <span>Faculty: {feedback.course.faculty.faculty_name}</span>
                                  </>
                                )}
                              </div>
                              <span className={`ml-2 px-2 py-1 text-xs rounded ${feedback.status === 'submitted' ? 'bg-green-100 text-green-800' :
                                  feedback.status === 'pending' ? 'bg-red-100 text-red-800' :
                                    feedback.status === 'expired' ? 'bg-orange-100 text-orange-800' :
                                      'bg-blue-100 text-blue-800'
                                }`}>
                                {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Start: {formatDate(feedback.start_date)} | End: {formatDate(feedback.end_date)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'feedbacks' && selectedFeedback && (
            <FeedbackForm
              feedbackSubmission={selectedFeedback}
              onBack={() => setSelectedFeedback(null)}
              onSubmit={handleFeedbackSubmitted}
            />
          )}
        </div>
      </div>
    </div>
  );
}