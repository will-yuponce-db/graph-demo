import React from 'react';
import { ThemeContextProvider } from './contexts/ThemeContext';
import { Box } from '@mui/material';
import GraphVisualization from './pages/GraphVisualization';
import ThemeToggle from './components/ThemeToggle';

const App: React.FC = () => {
  return (
    <ThemeContextProvider>
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        {/* Theme toggle in top right corner */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            backgroundColor: 'background.paper',
            borderRadius: 1,
            boxShadow: 3,
            padding: 0.5,
          }}
        >
          <ThemeToggle />
        </Box>
        <GraphVisualization />
      </Box>
    </ThemeContextProvider>
  );
};

export default App;
