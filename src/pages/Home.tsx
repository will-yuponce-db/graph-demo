import React from 'react';
import { Box, Button, Container, Typography, Stack, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowForward } from '@mui/icons-material';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Welcome to React + MUI
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph sx={{ maxWidth: '800px', mb: 4 }}>
          A modern boilerplate built with Vite, React, TypeScript, and Material-UI. Features
          responsive navigation, dark mode, and beautiful components.
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 6 }}>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            onClick={() => navigate('/dashboard')}
          >
            Get Started
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate('/about')}>
            Learn More
          </Button>
        </Stack>

        <Box sx={{ width: '100%', mt: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
            Key Features
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="center">
            <Paper
              elevation={3}
              sx={{
                p: 3,
                flex: 1,
                maxWidth: { md: '300px' },
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" gutterBottom color="primary">
                ⚡ Fast Development
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Built with Vite for lightning-fast HMR and optimized builds
              </Typography>
            </Paper>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                flex: 1,
                maxWidth: { md: '300px' },
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" gutterBottom color="primary">
                🎨 Beautiful UI
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Material-UI components with customizable themes and dark mode
              </Typography>
            </Paper>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                flex: 1,
                maxWidth: { md: '300px' },
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" gutterBottom color="primary">
                📱 Responsive
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fully responsive design that works on all devices
              </Typography>
            </Paper>
          </Stack>
        </Box>
      </Box>
    </Container>
  );
};

export default Home;
