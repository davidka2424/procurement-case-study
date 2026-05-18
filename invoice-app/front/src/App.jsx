import { Center, Loader } from '@mantine/core';
import { useAuth } from './auth.jsx';
import LoginPage from './components/LoginPage.jsx';
import InvoiceList from './components/InvoiceList.jsx';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }
  return user ? <InvoiceList /> : <LoginPage />;
}
