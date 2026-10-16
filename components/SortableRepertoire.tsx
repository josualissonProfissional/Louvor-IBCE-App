'use client'

import {
  closestCenter, DndContext, DragEndEvent, KeyboardSensor, MouseSensor,
  TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ActionIcon, Box, Group, Paper, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core'
import { IconArrowDown, IconArrowUp, IconGripVertical, IconMusic } from '@tabler/icons-react'

export interface RepertoireSong {
  id: string
  title: string
  soloNames: string[]
}

interface SortableSongProps {
  song: RepertoireSong
  index: number
  total: number
  editable: boolean
  saving: boolean
  onOpen: () => void
  onMove: (direction: -1 | 1) => void
}

function SortableSong({ song, index, total, editable, saving, onOpen, onMove }: SortableSongProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: song.id,
    disabled: !editable || saving,
  })

  return (
    <Paper
      ref={setNodeRef}
      withBorder
      p={{ base: 'sm', sm: 'md' }}
      bg="var(--app-surface-muted)"
      onClick={onOpen}
      style={{
        cursor: 'pointer',
        borderInlineStart: '3px solid var(--mantine-color-ibce-6)',
        opacity: isDragging ? 0.72 : 1,
        position: 'relative',
        zIndex: isDragging ? 20 : 1,
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : 'transform 160ms ease-out, opacity 160ms ease-out',
      }}
    >
      <Group wrap="nowrap" align="center" gap="sm">
        {editable && (
          <Tooltip label="Segure e arraste" withArrow>
            <ActionIcon
              {...attributes}
              {...listeners}
              variant="subtle"
              color="gray"
              size={40}
              aria-label={`Arrastar ${song.title} para mudar sua posição`}
              onClick={(event) => event.stopPropagation()}
              style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none', flexShrink: 0 }}
            >
              <IconGripVertical size={20} />
            </ActionIcon>
          </Tooltip>
        )}

        <ThemeIcon color="ibce" variant="light" style={{ flexShrink: 0 }}><IconMusic size={18} /></ThemeIcon>
        <Box miw={0} style={{ flex: 1 }}>
          <Text fw={600} lineClamp={2}>{index + 1}. {song.title}</Text>
          {song.soloNames.map((name, soloIndex) => <Text key={`${song.id}-${soloIndex}`} size="sm" c="dimmed" truncate>Solo: {name}</Text>)}
        </Box>

        {editable && (
          <Group gap={4} wrap="nowrap" onClick={(event) => event.stopPropagation()}>
            <Tooltip label="Mover para cima" withArrow>
              <ActionIcon
                variant="light"
                color="ibce"
                size={40}
                disabled={index === 0 || saving}
                aria-label={`Mover ${song.title} para cima`}
                onClick={() => onMove(-1)}
              >
                <IconArrowUp size={19} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Mover para baixo" withArrow>
              <ActionIcon
                variant="light"
                color="ibce"
                size={40}
                disabled={index === total - 1 || saving}
                aria-label={`Mover ${song.title} para baixo`}
                onClick={() => onMove(1)}
              >
                <IconArrowDown size={19} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Group>
    </Paper>
  )
}

interface SortableRepertoireProps {
  songs: RepertoireSong[]
  editable: boolean
  saving: boolean
  onOpen: (songId: string) => void
  onReorder: (orderedIds: string[]) => void
}

export default function SortableRepertoire({ songs, editable, saving, onOpen, onReorder }: SortableRepertoireProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const ids = songs.map((song) => song.id)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex >= 0 && newIndex >= 0) onReorder(arrayMove(ids, oldIndex, newIndex))
  }

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= ids.length) return
    onReorder(arrayMove(ids, index, nextIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <Stack gap="xs">
          {songs.map((song, index) => (
            <SortableSong
              key={song.id}
              song={song}
              index={index}
              total={songs.length}
              editable={editable}
              saving={saving}
              onOpen={() => onOpen(song.id)}
              onMove={(direction) => move(index, direction)}
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  )
}
