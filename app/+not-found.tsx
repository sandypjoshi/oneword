import { Redirect } from 'expo-router';

// Redirect to the index page for any not found routes
export default function NotFound() {
  return <Redirect href="/" />;
} 