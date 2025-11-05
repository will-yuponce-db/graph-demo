import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Stack,
  Chip,
} from '@mui/material';
import { CheckCircle, Code, Palette, Speed, Security, Devices } from '@mui/icons-material';

const About: React.FC = () => {
  const technologies = [
    'React 18',
    'TypeScript',
    'Vite',
    'Material-UI (MUI)',
    'React Router',
    'Emotion',
  ];

  const features = [
    {
      icon: <Speed />,
      title: 'Fast Development',
      description: 'Vite provides instant HMR and lightning-fast build times',
    },
    {
      icon: <Palette />,
      title: 'Beautiful Design',
      description: 'Pre-configured Material-UI with light and dark themes',
    },
    {
      icon: <Code />,
      title: 'Type Safe',
      description: 'TypeScript for better code quality and developer experience',
    },
    {
      icon: <Devices />,
      title: 'Responsive',
      description: 'Mobile-first design that works on all screen sizes',
    },
    {
      icon: <Security />,
      title: 'Modern Stack',
      description: 'Built with the latest React patterns and best practices',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
        About This Project
      </Typography>

      <Stack spacing={4}>
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom color="primary">
              Overview
            </Typography>
            <Typography variant="body1" paragraph>
              This is a modern React boilerplate built with cutting-edge technologies to help you
              kickstart your next project. It includes a comprehensive set of features and examples
              to demonstrate best practices in React development.
            </Typography>
            <Typography variant="body1" paragraph>
              The boilerplate is designed to be flexible and easy to customize, allowing you to
              quickly build beautiful, responsive web applications with a great developer
              experience.
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom color="primary">
              Technologies Used
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {technologies.map((tech) => (
                  <Chip key={tech} label={tech} color="primary" variant="outlined" sx={{ mb: 1 }} />
                ))}
              </Stack>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom color="primary">
              Key Features
            </Typography>
            <List>
              {features.map((feature, index) => (
                <React.Fragment key={feature.title}>
                  {index > 0 && <Divider sx={{ my: 2 }} />}
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemIcon sx={{ mt: 1 }}>
                      <Box
                        sx={{
                          backgroundColor: 'primary.main',
                          borderRadius: 2,
                          p: 1,
                          display: 'flex',
                          color: 'white',
                        }}
                      >
                        {feature.icon}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="h6" gutterBottom>
                          {feature.title}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {feature.description}
                        </Typography>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>

        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom color="primary">
              What's Included
            </Typography>
            <List>
              {[
                'Responsive navigation with drawer for mobile',
                'Light and dark theme with easy toggle',
                'Multiple example pages showcasing different layouts',
                'Form components with various input types',
                'Dashboard with statistics and data visualization placeholders',
                'Beautiful typography and spacing system',
                'TypeScript for type safety',
                'Clean project structure',
              ].map((item) => (
                <ListItem key={item} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        <Card elevation={3} sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Ready to Build Something Amazing?
            </Typography>
            <Typography variant="body1">
              Start customizing this boilerplate to match your needs and bring your ideas to life!
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default About;
