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
            top: 24,
            right: 24,
            zIndex: 1400,
            backgroundColor: 'background.paper',
            borderRadius: 1,
            boxShadow: 2,
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
