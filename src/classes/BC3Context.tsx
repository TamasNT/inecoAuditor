"use client"

import * as React from "react"
import type { BC3Data } from "./BC3Parser"

interface BC3ContextType {
  bc3Data: BC3Data | null
  setBc3Data: (data: BC3Data) => void
  selectedObjectId: string | null
  setSelectedObjectId: (id: string | null) => void
}

export const BC3Context = React.createContext<BC3ContextType>({
  bc3Data: null,
  setBc3Data: () => {},
  selectedObjectId: null,
  setSelectedObjectId: () => {},
})

export function BC3Provider({ children }: { children: React.ReactNode }) {
  const [bc3Data, setBc3Data] = React.useState<BC3Data | null>(null)
  const [selectedObjectId, setSelectedObjectId] = React.useState<string | null>(null)

  return (
    <BC3Context.Provider value={{ bc3Data, setBc3Data, selectedObjectId, setSelectedObjectId }}>
      {children}
    </BC3Context.Provider>
  )
}

export function useBC3() {
  return React.useContext(BC3Context)
}

