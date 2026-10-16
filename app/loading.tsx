'use client'

import { Group, Paper, SimpleGrid, Skeleton, Stack } from '@mantine/core'

export default function Loading() {
  return (
    <Stack gap="lg" role="status" aria-live="polite" aria-label="Carregando conteúdo da página">
      <Stack gap="xs">
        <Skeleton h={32} w="min(310px, 72%)" radius="sm" />
        <Skeleton h={16} w="min(470px, 92%)" radius="sm" />
      </Stack>

      <Paper withBorder p="md" bg="var(--app-surface)">
        <Group grow align="flex-end">
          <Stack gap={7}><Skeleton h={12} w={94} /><Skeleton h={38} radius="sm" /></Stack>
          <Stack gap={7} visibleFrom="sm"><Skeleton h={12} w={78} /><Skeleton h={38} radius="sm" /></Stack>
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="md">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Paper key={item} withBorder p="lg" bg="var(--app-surface)">
            <Stack gap="md">
              <Group justify="space-between"><Skeleton circle h={40} /><Skeleton h={20} w={96} radius="xl" /></Group>
              <Stack gap={8}><Skeleton h={19} w="72%" /><Skeleton h={14} w="88%" /></Stack>
              <Group gap="xs"><Skeleton h={30} w={78} radius="sm" /><Skeleton h={30} w={78} radius="sm" /></Group>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  )
}
