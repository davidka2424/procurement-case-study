import React from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import { AuthProvider } from './auth.jsx';
import App from './App.jsx';

const theme = createTheme({
  primaryColor: 'teal',
  fontFamily: 'Roboto, sans-serif',
  headings: { fontFamily: 'Roboto, sans-serif' },
  defaultRadius: 'sm',
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MantineProvider>
  </React.StrictMode>
);
