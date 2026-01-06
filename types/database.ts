// Tipos do banco de dados Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          senha: string
          data_nascimento: string
          cargo: 'cantor' | 'musico' | 'ambos'
          lider: boolean
          instrumento_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          senha: string
          data_nascimento: string
          cargo: 'cantor' | 'musico' | 'ambos'
          lider: boolean
          instrumento_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          senha?: string
          data_nascimento?: string
          cargo?: 'cantor' | 'musico' | 'ambos'
          lider?: boolean
          instrumento_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      instrumentos: {
        Row: {
          id: string
          nome: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          created_at?: string
        }
      }
      musicas: {
        Row: {
          id: string
          titulo: string
          link_youtube: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titulo: string
          link_youtube?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          link_youtube?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cifras: {
        Row: {
          id: string
          texto: string
          musica_id: string
          titulo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          texto: string
          musica_id: string
          titulo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          texto?: string
          musica_id?: string
          titulo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      letras: {
        Row: {
          id: string
          texto: string
          musica_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          texto: string
          musica_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          texto?: string
          musica_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      dias_atuacao: {
        Row: {
          id: string
          data: string
          created_at: string
        }
        Insert: {
          id?: string
          data: string
          created_at?: string
        }
        Update: {
          id?: string
          data?: string
          created_at?: string
        }
      }
      escalas: {
        Row: {
          id: string
          data: string
          musica_id: string
          usuario_id: string
          funcao: 'cantor' | 'musico' | 'solo'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          data: string
          musica_id: string
          usuario_id: string
          funcao: 'cantor' | 'musico' | 'solo'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          data?: string
          musica_id?: string
          usuario_id?: string
          funcao?: 'cantor' | 'musico' | 'solo'
          created_at?: string
          updated_at?: string
        }
      }
      disponibilidade: {
        Row: {
          id: string
          usuario_id: string
          data: string
          status: 'disponivel' | 'indisponivel'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          data: string
          status: 'disponivel' | 'indisponivel'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          data?: string
          status?: 'disponivel' | 'indisponivel'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}







