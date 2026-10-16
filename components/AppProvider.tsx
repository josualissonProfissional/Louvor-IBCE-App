'use client'

import { createTheme, MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'

const theme = createTheme({
  primaryColor: 'ibce',
  primaryShade: { light: 7, dark: 5 },
  defaultRadius: 'sm',
  fontFamily: 'var(--font-inter), Arial, sans-serif',
  headings: {
    fontFamily: 'var(--font-inter), Arial, sans-serif',
    fontWeight: '650',
  },
  colors: {
    ibce: [
      '#eff7f6', '#dceceb', '#bad9d7', '#94c4c1', '#75b2af',
      '#62a7a3', '#559f9b', '#3f8380', '#356c69', '#285957',
    ],
    olive: [
      '#f4f7e9', '#e7eed1', '#d1dfa6', '#b9cf78', '#a3c052',
      '#91b536', '#7fa62b', '#6b8e23', '#58751f', '#49601c',
    ],
  },
  components: {
    Button: { defaultProps: { radius: 'sm' } },
    Paper: { defaultProps: { radius: 'md' } },
  },
})

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" />
      <ModalsProvider>{children}</ModalsProvider>
    </MantineProvider>
  )
}
