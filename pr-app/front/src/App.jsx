import { Center, Loader } from '@mantine/core';
import { useAuth } from './auth.jsx';
import LoginPage from './components/LoginPage.jsx';
import PRList from './components/PRList.jsx';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }
  return user ? <PRList /> : <LoginPage />;
}
