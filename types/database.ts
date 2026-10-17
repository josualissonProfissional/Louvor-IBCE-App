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
          nome: string | null
          email: string
          senha: string
          data_nascimento: string
          cargo: 'cantor' | 'musico' | 'ambos'
          lider: boolean
          tesoureiro: boolean
          instrumento_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome?: string | null
          email: string
          senha: string
          data_nascimento: string
          cargo: 'cantor' | 'musico' | 'ambos'
          lider?: boolean
          tesoureiro?: boolean
          instrumento_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string | null
          email?: string
          senha?: string
          data_nascimento?: string
          cargo?: 'cantor' | 'musico' | 'ambos'
          lider?: boolean
          tesoureiro?: boolean
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
          musica_id: string | null
          usuario_id: string
          funcao: 'cantor' | 'musico' | 'solo'
          ordem: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          data: string
          musica_id?: string | null
          usuario_id: string
          funcao: 'cantor' | 'musico' | 'solo'
          ordem?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          data?: string
          musica_id?: string | null
          usuario_id?: string
          funcao?: 'cantor' | 'musico' | 'solo'
          ordem?: number | null
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
      configuracoes: {
        Row: {
          id: string
          modulo_mensalidade_ativo: boolean
          chave_pix: string
          tipo_chave_pix: string
          beneficiario_pix: string
          valor_mensalidade_padrao: number
          dia_vencimento_padrao: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          modulo_mensalidade_ativo?: boolean
          chave_pix?: string
          tipo_chave_pix?: string
          beneficiario_pix?: string
          valor_mensalidade_padrao?: number
          dia_vencimento_padrao?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          modulo_mensalidade_ativo?: boolean
          chave_pix?: string
          tipo_chave_pix?: string
          beneficiario_pix?: string
          valor_mensalidade_padrao?: number
          dia_vencimento_padrao?: number
          updated_at?: string
          updated_by?: string | null
        }
      }
      ciclos_mensalidade: {
        Row: {
          id: string
          mes_referencia: string
          ano: number
          mes: number
          valor: number
          data_vencimento: string
          criado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mes_referencia: string
          ano: number
          mes: number
          valor?: number
          data_vencimento: string
          criado_por?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mes_referencia?: string
          ano?: number
          mes?: number
          valor?: number
          data_vencimento?: string
          criado_por?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pagamentos_mensalidade: {
        Row: {
          id: string
          ciclo_id: string
          usuario_id: string
          valor: number
          status: 'pendente' | 'pago' | 'isento'
          data_pagamento: string | null
          confirmado_por: string | null
          observacao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ciclo_id: string
          usuario_id: string
          valor: number
          status?: 'pendente' | 'pago' | 'isento'
          data_pagamento?: string | null
          confirmado_por?: string | null
          observacao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ciclo_id?: string
          usuario_id?: string
          valor?: number
          status?: 'pendente' | 'pago' | 'isento'
          data_pagamento?: string | null
          confirmado_por?: string | null
          observacao?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notificacoes: {
        Row: {
          id: string
          usuario_id: string
          titulo: string
          mensagem: string
          tipo: 'escala' | 'mensalidade' | 'aviso' | 'sistema'
          link: string | null
          lida: boolean
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          titulo: string
          mensagem: string
          tipo: 'escala' | 'mensalidade' | 'aviso' | 'sistema'
          link?: string | null
          lida?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          titulo?: string
          mensagem?: string
          tipo?: 'escala' | 'mensalidade' | 'aviso' | 'sistema'
          link?: string | null
          lida?: boolean
          created_at?: string
        }
      }
    }
  }
}







