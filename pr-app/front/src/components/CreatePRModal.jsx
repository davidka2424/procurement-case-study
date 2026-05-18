import { useState } from 'react';
import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { api } from '../api.js';

const EMPTY = {
  request_name: '',
  supplier_name: '',
  supplier_email: '',
  request_details: '',
};

export default function CreatePRModal({ opened, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Capture the value synchronously before scheduling the state update.
  // React 19 + StrictMode invokes the functional updater twice, and the
  // synthetic event's `currentTarget` is nulled out after the handler
  // returns, so reading it inside the updater would explode on the second
  // pass.
  const set = (k) => (e) => {
    const value = e.currentTarget.value;
    setForm((f) => ({ ...f, [k]: value }));
  };

  const close = () => {
    setForm(EMPTY);
    setError(null);
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/purchase-request-new', form);
      onCreated?.();
      close();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not create request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={<Text fw={600} size="lg">Create New Purchase Request</Text>}
      size="lg"
      centered
    >
      <form onSubmit={submit}>
        <Stack gap="md">
          <TextInput
            label="Request name"
            placeholder="e.g. Annual SaaS subscription renewal"
            required
            value={form.request_name}
            onChange={set('request_name')}
          />
          <Group grow align="flex-start">
            <TextInput
              label="Supplier name"
              placeholder="Atlassian Pty Ltd"
              required
              value={form.supplier_name}
              onChange={set('supplier_name')}
            />
            <TextInput
              label="Supplier email"
              placeholder="billing@supplier.com"
              required
              type="email"
              value={form.supplier_email}
              onChange={set('supplier_email')}
            />
          </Group>
          <Textarea
            label="Request details"
            placeholder="Describe what you want to buy, why, expected cost, attachments..."
            required
            minRows={4}
            autosize
            value={form.request_details}
            onChange={set('request_details')}
          />
          <Stack bg="gray.0" p="sm" gap={2} style={{ borderRadius: 4 }}>
            <Text size="xs" fw={600} c="dimmed">
              Auto-filled on submit
            </Text>
            <Text size="xs" c="dimmed">
              • request_author = your username · request_code = PR-&#123;next&#125; · status = initiated
            </Text>
          </Stack>
          {error && (
            <Text c="red" size="sm">
              {error}
            </Text>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create request
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
