import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import StatusBadge from './StatusBadge.jsx';
import CreatePRModal from './CreatePRModal.jsx';
import ViewPRModal from './ViewPRModal.jsx';

export default function PRList() {
  const { logout } = useAuth();
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/purchase-request');
      setPrs(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prs;
    return prs.filter((pr) =>
      [pr.request_code, pr.request_name, pr.supplier_name, pr.request_author]
        .some((s) => (s || '').toLowerCase().includes(q))
    );
  }, [prs, query]);

  return (
    <Box bg="white" p={10} mih="100vh">
      {/* Header */}
      <Group
        justify="space-between"
        align="center"
        bg="rgba(34, 139, 230, 0.1)"
        p="md"
      >
        <Title order={3} c="dimmed">
          Purchase requests
        </Title>
        <Group gap="sm">
          <Button color="teal" variant="light" onClick={() => setCreateOpen(true)}>
            Create New Purchase
          </Button>
          <Button color="red" variant="outline" onClick={logout}>
            Logout
          </Button>
        </Group>
      </Group>

      {/* List body */}
      <Box bg="gray.0" px="xl" py="lg" mih="calc(100vh - 96px)">
        <Stack gap="md">
          <TextInput
            placeholder="Search by code, name, supplier..."
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            w={360}
          />
          <Card withBorder p={0} radius="md" style={{ overflow: 'hidden' }}>
            <Table verticalSpacing="md" horizontalSpacing="md" striped="even">
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th c="dimmed" style={{ width: 100 }}>Code</Table.Th>
                  <Table.Th c="dimmed">Name</Table.Th>
                  <Table.Th c="dimmed" style={{ width: 140 }}>Author</Table.Th>
                  <Table.Th c="dimmed" style={{ width: 260 }}>Supplier</Table.Th>
                  <Table.Th c="dimmed" style={{ width: 180 }}>Status</Table.Th>
                  <Table.Th c="dimmed" style={{ width: 140 }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loading && (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Center p="xl">
                        <Loader size="sm" />
                      </Center>
                    </Table.Td>
                  </Table.Tr>
                )}
                {!loading && filtered.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Center p="xl">
                        <Text c="dimmed">No purchase requests yet.</Text>
                      </Center>
                    </Table.Td>
                  </Table.Tr>
                )}
                {!loading &&
                  filtered.map((pr) => (
                    <Table.Tr key={pr.id}>
                      <Table.Td fw={500}>{pr.request_code}</Table.Td>
                      <Table.Td>{pr.request_name}</Table.Td>
                      <Table.Td>{pr.request_author}</Table.Td>
                      <Table.Td>{pr.supplier_name}</Table.Td>
                      <Table.Td>
                        <StatusBadge status={pr.request_approval_status} />
                      </Table.Td>
                      <Table.Td>
                        <Button
                          variant="light"
                          color="gray"
                          size="xs"
                          onClick={() => setViewing(pr)}
                        >
                          View
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Stack>
      </Box>

      <CreatePRModal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
      />
      <ViewPRModal
        pr={viewing}
        onClose={() => setViewing(null)}
        onUpdated={load}
      />
    </Box>
  );
}
