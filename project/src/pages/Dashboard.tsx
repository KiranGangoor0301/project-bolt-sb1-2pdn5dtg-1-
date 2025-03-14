import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Home, BookOpen, MessageSquare, Bell, LogOut, ChevronDown, Settings, Book, User as UserIcon, HelpCircle } from 'lucide-react';
import FeedbackForm from './FeedbackForm';
import Navbar from '../components/Navbar';
import { Box, Container, Paper, Typography, Button, List, ListItem, 
         ListItemIcon, ListItemText, Collapse, CircularProgress,
         Chip, Divider, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';

interface Profile {
  full_name: string;
  student_id: string;
  centre: string;
  role: string; // Add role to Profile interface
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

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface DashboardProps {
  user: User;
}

const SidebarWrapper = styled(Box)(({ theme }) => ({
  width: 256,
  position: 'fixed',
  top: 64,
  height: 'calc(100vh - 64px)',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[2],
  overflowY: 'auto',
  zIndex: 10
}));

const MainContent = styled(Box)(({ theme }) => ({
  marginLeft: 256,
  marginRight: 320,
  padding: theme.spacing(4),
  backgroundColor: theme.palette.grey[50],
  minHeight: 'calc(100vh - 64px)'
}));

const RightPanel = styled(Box)(({ theme }) => ({
  width: 320,
  position: 'fixed',
  top: 64,
  right: 0,
  height: 'calc(100vh - 64px)',
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(3),
  overflowY: 'auto',
  zIndex: 10
}));

export default function Dashboard({ user }: DashboardProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('feedbacks');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Feedback Available',
      message: 'Core Java feedback is now available for submission',
      timestamp: new Date().toISOString(),
      isRead: false
    },
    {
      id: '2',
      title: 'Feedback Due',
      message: 'Operating Systems feedback due in 2 days',
      timestamp: new Date().toISOString(),
      isRead: true
    }
  ]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

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
            course: course,
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
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress />
      </Box>
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
    <Box>
      <Navbar />
      
      {/* Left Sidebar */}
      <SidebarWrapper>
        <List>
          <ListItem button onClick={() => setOpenMenu(openMenu === 'general' ? null : 'general')}>
            <ListItemIcon><Home /></ListItemIcon>
            <ListItemText primary="General" />
            <ChevronDown />
          </ListItem>
          <Collapse in={openMenu === 'general'}>
            <List component="div" disablePadding>
              <ListItem button sx={{ pl: 4 }}>
                <ListItemIcon><MessageSquare /></ListItemIcon>
                <ListItemText primary="Feedbacks" />
              </ListItem>
            </List>
          </Collapse>
        </List>
      </SidebarWrapper>

      {/* Main Content */}
      <MainContent>
        <Container maxWidth="lg">
          {activeSection === 'feedbacks' && !selectedFeedback && (
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>Feedbacks</Typography>
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
                            className={`pl-4 ${
                              feedback.status !== 'submitted' && feedback.status !== 'expired'
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
                              <span className={`ml-2 px-2 py-1 text-xs rounded ${
                                feedback.status === 'submitted' ? 'bg-green-100 text-green-800' :
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
            </Paper>
          )}

          {activeSection === 'feedbacks' && selectedFeedback && (
            <FeedbackForm
              feedbackSubmission={selectedFeedback}
              onBack={() => setSelectedFeedback(null)}
              onSubmit={handleFeedbackSubmitted}
            />
          )}
        </Container>
      </MainContent>

      {/* Right Panel */}
      <RightPanel>
        <Box textAlign="center" mb={4}>
          <Avatar
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name || ''}`}
            sx={{ width: 96, height: 96, mx: 'auto', mb: 2 }}
          />
          <Typography variant="h6">{profile?.full_name}</Typography>
          <Typography variant="body2" color="primary">{profile?.student_id}</Typography>
          <Typography variant="body2" color="text.secondary">{profile?.centre}</Typography>
          <Typography variant="body2" sx={{ mt: 1, textTransform: 'capitalize' }}>
            {profile?.role || 'Student'}
          </Typography>
        </Box>

        <Divider />

        <Box mt={3}>
          <Typography variant="h6" gutterBottom>Notifications</Typography>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg transition-colors cursor-pointer
                  ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50'}`}
              >
                <h4 className="font-medium text-gray-800">{notification.title}</h4>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </Box>
      </RightPanel>
    </Box>
  );
}