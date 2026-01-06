// Tipos auxiliares para a aplicação
import { Database } from './database'

export type Usuario = Database['public']['Tables']['usuarios']['Row']
export type Instrumento = Database['public']['Tables']['instrumentos']['Row']
export type Musica = Database['public']['Tables']['musicas']['Row']
export type Cifra = Database['public']['Tables']['cifras']['Row']
export type Letra = Database['public']['Tables']['letras']['Row']
export type DiaAtuacao = Database['public']['Tables']['dias_atuacao']['Row']
export type Escala = Database['public']['Tables']['escalas']['Row']
export type Disponibilidade = Database['public']['Tables']['disponibilidade']['Row']

export type Cargo = 'cantor' | 'musico' | 'ambos'
export type FuncaoEscala = 'cantor' | 'musico' | 'solo'
export type StatusDisponibilidade = 'disponivel' | 'indisponivel'

// Tipos para inserção
export type NovoUsuario = Database['public']['Tables']['usuarios']['Insert']
export type NovaMusica = Database['public']['Tables']['musicas']['Insert']
export type NovaCifra = Database['public']['Tables']['cifras']['Insert']
export type NovaLetra = Database['public']['Tables']['letras']['Insert']
export type NovaEscala = Database['public']['Tables']['escalas']['Insert']
export type NovaDisponibilidade = Database['public']['Tables']['disponibilidade']['Insert']
export type NovoInstrumento = Database['public']['Tables']['instrumentos']['Insert']
export type NovoDiaAtuacao = Database['public']['Tables']['dias_atuacao']['Insert']

// Tipos para atualização
export type AtualizarUsuario = Database['public']['Tables']['usuarios']['Update']
export type AtualizarMusica = Database['public']['Tables']['musicas']['Update']
export type AtualizarCifra = Database['public']['Tables']['cifras']['Update']
export type AtualizarLetra = Database['public']['Tables']['letras']['Update']
export type AtualizarEscala = Database['public']['Tables']['escalas']['Update']
export type AtualizarDisponibilidade = Database['public']['Tables']['disponibilidade']['Update']
export type AtualizarInstrumento = Database['public']['Tables']['instrumentos']['Update']
export type AtualizarDiaAtuacao = Database['public']['Tables']['dias_atuacao']['Update']

// Tipos com relacionamentos
export interface MusicaCompleta extends Musica {
  cifras: Cifra[]
  letras: Letra[]
}

export interface EscalaCompleta extends Escala {
  musica: Musica
  usuario: Usuario & { instrumento?: Instrumento }
}

export interface DisponibilidadeCompleta extends Disponibilidade {
  usuario: Usuario
}







