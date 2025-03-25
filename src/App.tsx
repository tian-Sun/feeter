import React from 'react';
import { Container, Box, Typography, ThemeProvider, createTheme } from '@mui/material';
import QuadrantBoard from './components/QuadrantBoard';
import PomodoroTimer from './components/PomodoroTimer';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            FocusBoard
          </Typography>
          <QuadrantBoard />
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App; 