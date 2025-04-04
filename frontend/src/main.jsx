import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './buttonOverrides.css';
import './index.css';

// Configure Amplify with your AWS settings

import './auth/cognito-config.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
