'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Alert, Anchor, Box, Button, Container, Divider, Group, Paper,
  PasswordInput, SimpleGrid, Stack, Text, TextInput, Title,
} from '@mantine/core'
import {
  IconAlertCircle, IconArrowRight, IconBook2, IconLock,
  IconMail,
} from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await createClient().auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      if (data.user) window.location.assign('/')
    } catch (loginError: unknown) {
      console.error('Erro ao fazer login:', loginError)
      setError(loginError instanceof Error ? loginError.message : 'Não foi possível fazer login')
      setLoading(false)
    }
  }

  return (
    <Box mih="100dvh" bg="var(--mantine-color-body)" py={{ base: 32, sm: 64 }}>
      <Container size="lg">
        <Paper withBorder shadow="xs" style={{ overflow: 'hidden' }}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={0}>
            <Box bg="ibce.9" c="white" p={{ base: 32, sm: 52 }} visibleFrom="md">
              <Stack justify="space-between" h="100%" mih={500}>
                <Group gap="sm">
                  <Image src="/icon.svg" alt="Logo da IBCE" width={44} height={44} priority />
                  <Box>
                    <Text fw={700}>Louvor IBCE</Text>
                    <Text size="sm" c="ibce.1">Semeando a Verdade</Text>
                  </Box>
                </Group>

                <Box maw={410}>
                  <Title order={1} size="2.25rem" lh={1.15} mb="md">
                    Organização simples para servir melhor.
                  </Title>
                  <Text c="ibce.1" size="lg" lh={1.55}>
                    Repertório, escalas e disponibilidade do ministério em um só lugar.
                  </Text>
                </Box>

                <Group gap="xs">
                  <IconBook2 size={18} />
                  <Text size="sm" c="ibce.1">Igreja Batista Central em Estância</Text>
                </Group>
              </Stack>
            </Box>

            <Box p={{ base: 28, sm: 52 }}>
              <Stack gap="lg" maw={420} mx="auto" justify="center" mih={{ base: 480, md: 500 }}>
                <Box>
                  <Group gap="sm" mb="xl" hiddenFrom="md">
                    <Image src="/icon.svg" alt="Logo da IBCE" width={40} height={40} priority />
                    <Box>
                      <Text fw={700}>Louvor IBCE</Text>
                      <Text size="xs" c="dimmed">Semeando a Verdade</Text>
                    </Box>
                  </Group>
                  <Title order={2} mb={6}>Acesse sua conta</Title>
                  <Text c="dimmed">Entre com o e-mail cadastrado no ministério.</Text>
                </Box>

                {error && (
                  <Alert color="red" icon={<IconAlertCircle size={18} />} title="Não foi possível entrar">
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleLogin}>
                  <Stack gap="md">
                    <TextInput
                      id="email" label="E-mail" type="email" value={email}
                      onChange={(event) => setEmail(event.currentTarget.value)}
                      leftSection={<IconMail size={18} />} placeholder="seu@email.com"
                      autoComplete="email" required size="md"
                    />
                    <PasswordInput
                      id="password" label="Senha" value={password}
                      onChange={(event) => setPassword(event.currentTarget.value)}
                      visible={passwordVisible}
                      onVisibilityChange={setPasswordVisible}
                      visibilityToggleButtonProps={{
                        'aria-label': passwordVisible ? 'Ocultar senha' : 'Mostrar senha',
                      }}
                      leftSection={<IconLock size={18} />} placeholder="Digite sua senha"
                      autoComplete="current-password" required size="md"
                    />
                    <Button
                      type="submit" loading={loading}
                      rightSection={!loading && <IconArrowRight size={18} />}
                      size="md" fullWidth mt="xs"
                    >
                      Entrar
                    </Button>
                  </Stack>
                </form>

                <Divider />
                <Text ta="center" size="sm" c="dimmed">
                  Quer apenas consultar o repertório?{' '}
                  <Anchor component={Link} href="/musicas" fw={600}>Ver músicas</Anchor>
                </Text>
              </Stack>
            </Box>
          </SimpleGrid>
        </Paper>
      </Container>
    </Box>
  )
}
