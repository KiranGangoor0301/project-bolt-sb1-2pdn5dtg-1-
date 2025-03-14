import React from 'react';
import { supabase } from '../lib/supabase';
import { AppBar, Toolbar, Button, Box, Typography, Container } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

interface NavbarProps {
  showLogout?: boolean;
}

export default function Navbar({ showLogout = true }: NavbarProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const menuItems = ['HOME', 'ABOUT', 'PG DIPLOMA', 'NOTIFICATION', 'INDUSTRIAL VISIT', 'CONTACT US'];

  return (
    <AppBar position="fixed" sx={{ height: 64 }}>
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="https://www.cdac.in/img/cdac-logo.png" 
              alt="CDAC Logo" 
              style={{ 
                height: '32px', 
                filter: 'brightness(0) invert(1)' 
              }} 
            />
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            {menuItems.map((item) => (
              <Button
                key={item}
                color="inherit"
                sx={{ 
                  textTransform: 'none',
                  '&:hover': { color: 'rgba(255, 255, 255, 0.8)' }
                }}
              >
                {item}
              </Button>
            ))}
            {showLogout && (
              <Button
                color="inherit"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{ textTransform: 'none' }}
              >
                Logout
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
