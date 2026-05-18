import { Badge } from '@mantine/core';

// Invoice statuses map to the same colours we used for PR statuses, so a
// finance user moving between the two apps gets a consistent visual cue.
const STATUS_COLOR = {
  created: 'gray',
  prepaid: 'yellow',
  paid: 'teal',
};

export default function StatusBadge({ status }) {
  return (
    <Badge color={STATUS_COLOR[status] || 'gray'} variant="filled" radius="xl">
      {status}
    </Badge>
  );
}
