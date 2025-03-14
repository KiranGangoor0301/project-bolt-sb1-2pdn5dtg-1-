import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Box, Container, Paper, Typography, TextField, Button, Tab, Tabs, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[4]
}));

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [centre, setCentre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // After successful login, verify role
        if (data.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profileError) throw profileError;
          if (profileData.role !== role) {
            await supabase.auth.signOut();
            throw new Error('Invalid role selected for this account');
          }
        }
      } else {
        // First, sign up the user
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role
            }
          }
        });

        if (signUpError) throw signUpError;

        if (!user) throw new Error('Failed to create user');

        // Then, create their profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: email,
            full_name: fullName,
            student_id: studentId,
            centre: centre,
            role: role
          })
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // If profile creation fails, log out the user
          await supabase.auth.signOut();
          throw new Error('Failed to create profile. Please try again.');
        }

        console.log('Profile created successfully');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', flexDirection: 'column' }}>
      <Navbar showLogout={false} />

      <Container sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 6 }}>
        <Box sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          width: '100%',
          maxWidth: 'lg',
          overflow: 'hidden',
          borderRadius: 1,
          boxShadow: 4
        }}>
          {/* Left Section */}
          <Box sx={{ flex: { xs: '1', md: '2' }, bgcolor: 'white', p: 4 }}>
            <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
              <Typography variant="h4" fontWeight="bold" mb={4}>
                C-DAC Registration
              </Typography>

              <Tabs value={isLogin ? 0 : 1} onChange={(_, v) => setIsLogin(!isLogin)} sx={{ mb: 4 }}>
                <Tab label="Login" icon={<LogIn />} iconPosition="start" />
                <Tab label="Register" icon={<UserPlus />} iconPosition="start" />
              </Tabs>

              <form onSubmit={handleAuth}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      label="Role"
                    >
                      <MenuItem value="student">Student</MenuItem>
                      <MenuItem value="faculty">Faculty</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>

                  {!isLogin && (
                    <>
                      <TextField
                        label="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Student ID"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="Enter your student ID"
                        required
                        fullWidth
                      />
                      <TextField
                        label="Centre"
                        value={centre}
                        onChange={(e) => setCentre(e.target.value)}
                        placeholder="Enter your CDAC centre"
                        required
                        fullWidth
                      />
                    </>
                  )}

                  <TextField
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                  />

                  <TextField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <Button onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </Button>
                      )
                    }}
                  />

                  {isLogin && (
                    <Box sx={{ textAlign: 'right' }}>
                      <Button href="#" sx={{ textTransform: 'none' }}>
                        Forgot your password?
                      </Button>
                    </Box>
                  )}

                  {error && (
                    <Typography color="error" variant="body2">
                      {error}
                    </Typography>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    variant="contained"
                    color="primary"
                    fullWidth
                  >
                    {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
                  </Button>
                </Box>
              </form>
            </Box>
          </Box>

          {/* Right Section */}
          <Box sx={{ 
            flex: { xs: '1', md: '1' }, 
            bgcolor: 'primary.main',
            p: 4,
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold" mb={2}>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </Typography>
              <Typography mb={4}>
                {isLogin
                  ? 'Join us to access all features and resources.'
                  : 'Sign in to continue your journey.'}
              </Typography>
              <Button
                onClick={() => setIsLogin(!isLogin)}
                variant="outlined"
                color="inherit"
                sx={{ textTransform: 'none' }}
              >
                {isLogin ? 'Create New Account' : 'Sign In'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}