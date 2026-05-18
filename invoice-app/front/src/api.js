import axios from 'axios';

// Invoice backend lives on port 8002 by default. Compose passes VITE_API_URL.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8002',
  withCredentials: true, // sends the invoice_token cookie on every request
});
