import React from 'react';
import { ThemeContextProvider } from './contexts/ThemeContext';
import { Box } from '@mui/material';
import GraphVisualization from './pages/GraphVisualization';

const App: React.FC = () => {
  return (
    <ThemeContextProvider>
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <GraphVisualization />
      </Box>
    </ThemeContextProvider>
  );
};

export default App;
