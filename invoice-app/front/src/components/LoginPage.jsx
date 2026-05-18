import { useState } from 'react';
import {
  Button,
  Card,
  Center,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useAuth } from '../auth.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        setError('This app is finance-only. Sign in with a finance account.');
      } else {
        setError(err?.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center h="100vh" bg="white">
      <Card withBorder radius="md" padding="xl" w={420}>
        <form onSubmit={onSubmit}>
          <Stack gap="md">
            <Group gap="xs" align="center">
              <Text size="xl">💸</Text>
              <Title order={3} c="dark.7">Invoice Payments</Title>
            </Group>
            <Text c="dimmed" size="sm">
              Finance team only
            </Text>
            <TextInput
              label="Username"
              placeholder="e.g. fin.admin"
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              required
              autoFocus
            />
            <PasswordInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
            />
            {error && (
              <Text c="red" size="sm">
                {error}
              </Text>
            )}
            <Button type="submit" loading={loading} fullWidth>
              Log in
            </Button>
            <Stack bg="gray.0" p="sm" gap={2} style={{ borderRadius: 4 }}>
              <Text size="xs" fw={600} c="dimmed">Access restricted</Text>
              <Text size="xs" c="dimmed">
                Only users with role <Text span fw={500}>finance</Text> can sign in here.
                Employees use the Purchase Request app.
              </Text>
            </Stack>
          </Stack>
        </form>
      </Card>
    </Center>
  );
}
