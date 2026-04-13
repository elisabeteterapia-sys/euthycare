'use client'

import { createContext, useContext } from 'react'

export interface TerapeutaInfo {
  id: string
  nome: string
  email: string
}

export const TerapeutaCtx = createContext<TerapeutaInfo | null>(null)
export function useTerapeuta() { return useContext(TerapeutaCtx) }
