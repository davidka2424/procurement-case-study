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
      setError(err?.response?.data?.detail || 'Login failed');
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
              <Text size="xl">🛒</Text>
              <Title order={3} c="dark.7">Purchase Requests</Title>
            </Group>
            <Text c="dimmed" size="sm">
              Sign in to continue
            </Text>
            <TextInput
              label="Username"
              placeholder="e.g. alice"
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
            <Text c="dimmed" size="xs">
              Need an account? Ask your finance admin to create one via
              <Text span fw={500}> /create-user</Text>.
            </Text>
          </Stack>
        </form>
      </Card>
    </Center>
  );
}
