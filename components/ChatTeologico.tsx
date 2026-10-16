'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ActionIcon, Alert, Badge, Box, Button, Group, Loader, Paper, ScrollArea, Stack, Text, Textarea, ThemeIcon } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconBook2, IconBrain, IconMusic, IconSend, IconTrash } from '@tabler/icons-react'
import MusicaModal from './MusicaModal'

interface Message { role: 'user' | 'assistant'; content: string; timestamp: Date; musicas?: Array<{ id: string; titulo: string; temLetras: boolean; temCifras: boolean }>; agent?: string; queryType?: string }

export default function ChatTeologico({ initialTimestamp }: { initialTimestamp: string }) {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Olá! Posso analisar letras, sugerir músicas por tema bíblico e consultar informações do repertório. Como posso ajudar?', timestamp: new Date(initialTimestamp) }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ isConfigured: boolean; message: string } | null>(null)
  const [selectedMusic, setSelectedMusic] = useState<any>(null)
  const viewport = useRef<HTMLDivElement>(null)

  useEffect(() => { fetch('/api/ia/chat').then((r) => r.json()).then((data) => setStatus(data)).catch(console.error) }, [])
  useEffect(() => { viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' }) }, [messages, loading])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); const content = input.trim(); if (!content || loading) return
    const userMessage: Message = { role: 'user', content, timestamp: new Date() }
    setMessages((current) => [...current, userMessage]); setInput(''); setLoading(true)
    try {
      const history = messages.slice(-10).map(({ role, content }) => ({ role, content }))
      const response = await fetch('/api/ia/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: content, conversationHistory: history }) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Erro ao processar a mensagem')
      setMessages((current) => [...current, { role: 'assistant', content: data.response, timestamp: new Date(), musicas: data.musicas, agent: data.agent, queryType: data.queryType }])
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', content: `Não foi possível concluir a análise. ${error instanceof Error ? error.message : 'Tente novamente.'}`, timestamp: new Date() }])
    } finally { setLoading(false) }
  }

  const openMusic = async (id: string) => {
    const response = await fetch(`/api/musicas/${id}`); if (!response.ok) return
    const music = await response.json(); setSelectedMusic({ id: music.id, titulo: music.titulo, link_youtube: music.link_youtube, temLetras: Boolean(music.letras?.length), temCifras: Boolean(music.cifras?.length) })
  }

  const clear = () => modals.openConfirmModal({ title: 'Limpar a conversa?', children: <Text size="sm">As mensagens desta sessão serão removidas.</Text>, labels: { confirm: 'Limpar', cancel: 'Cancelar' }, confirmProps: { color: 'red' }, onConfirm: () => setMessages([{ role: 'assistant', content: 'Conversa reiniciada. Como posso ajudar?', timestamp: new Date() }]) })

  return <Paper withBorder bg="var(--app-surface)" style={{ overflow: 'hidden' }}>
    <Group justify="space-between" align="flex-start" wrap="nowrap" p="md" style={{ borderBottom: '1px solid var(--app-border)' }}>
      <Group align="flex-start" wrap="nowrap" miw={0}><ThemeIcon color="ibce" variant="light" size="lg" style={{ flexShrink: 0 }}><IconBrain size={21} /></ThemeIcon><Box miw={0}><Text fw={700}>Assistente IBCE</Text><Group gap={6} wrap="nowrap"><Box w={7} h={7} bg={status ? (status.isConfigured ? 'green.6' : 'yellow.6') : 'gray.5'} style={{ borderRadius: '50%', flexShrink: 0 }} /><Text size="xs" c="dimmed" lineClamp={2}>{status ? status.message : 'Verificando conexão...'}</Text></Group></Box></Group>
      <ActionIcon color="red" variant="subtle" aria-label="Limpar conversa" onClick={clear}><IconTrash size={18} /></ActionIcon>
    </Group>

    <ScrollArea h="min(62dvh, 680px)" viewportRef={viewport} p={{ base: 'sm', sm: 'lg' }} bg="var(--app-background)">
      <Stack gap="md">
        {messages.map((message, index) => <Group key={index} justify={message.role === 'user' ? 'flex-end' : 'flex-start'} align="flex-start">
          {message.role === 'assistant' && <ThemeIcon color="olive" variant="light" radius="xl"><IconBook2 size={17} /></ThemeIcon>}
          <Paper withBorder={message.role === 'assistant'} p="md" bg={message.role === 'user' ? 'ibce.8' : 'var(--app-surface)'} c={message.role === 'user' ? 'white' : undefined} maw={{ base: '88%', sm: '75%' }}>
            {message.agent && <Group gap="xs" mb="xs"><Badge color="ibce" variant="light">{message.agent}</Badge>{message.queryType && <Text size="xs" c="dimmed">{message.queryType}</Text>}</Group>}
            {message.role === 'assistant' ? <Box className="text-pretty"><ReactMarkdown>{message.content}</ReactMarkdown></Box> : <Text style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text>}
            {message.musicas && message.musicas.length > 0 && <Stack gap="xs" mt="md">{message.musicas.map((music) => <Button key={music.id} variant="light" color="olive" justify="space-between" leftSection={<IconMusic size={17} />} onClick={() => openMusic(music.id)}>{music.titulo}</Button>)}</Stack>}
            <Text size="xs" mt="xs" c={message.role === 'user' ? 'ibce.1' : 'dimmed'}>{message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
          </Paper>
        </Group>)}
        {loading && <Group><ThemeIcon color="olive" variant="light" radius="xl"><IconBook2 size={17} /></ThemeIcon><Paper withBorder p="md"><Group gap="sm"><Loader size="xs" /><Text size="sm" c="dimmed">Analisando...</Text></Group></Paper></Group>}
      </Stack>
    </ScrollArea>

    <Box p="md" style={{ borderTop: '1px solid var(--app-border)' }}>
      <form onSubmit={submit}><Group align="flex-end" wrap="nowrap"><Textarea autosize minRows={2} maxRows={5} value={input} onChange={(e) => setInput(e.currentTarget.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }} placeholder="Pergunte sobre uma música, tema bíblico ou doutrina..." disabled={loading} style={{ flex: 1 }} /><Button type="submit" loading={loading} disabled={!input.trim()} leftSection={<IconSend size={18} />} visibleFrom="xs">Enviar</Button><ActionIcon type="submit" loading={loading} disabled={!input.trim()} size={42} hiddenFrom="xs" aria-label="Enviar mensagem"><IconSend size={19} /></ActionIcon></Group></form>
      <Text size="xs" c="dimmed" mt="xs">Enter envia · Shift + Enter cria uma nova linha</Text>
    </Box>
    {selectedMusic && <MusicaModal musica={selectedMusic} isOpen onClose={() => setSelectedMusic(null)} />}
  </Paper>
}
