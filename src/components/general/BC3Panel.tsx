"use client"

import * as React from "react"
import { BC3Provider, useBC3 } from "../../classes/BC3Context"
import { BC3Uploader } from "./BC3Uploader"
import { BC3ObjectInfo } from "./BC3ObjectInfo"

interface BC3PanelProps {
  selectedObjectId: string | null
  onObjectSelect?: (id: string | null) => void
}

// Componente interno que usa el contexto BC3
function BC3PanelContent({ selectedObjectId, onObjectSelect }: BC3PanelProps) {
  const { setSelectedObjectId } = useBC3()

  // Actualizar el ID del objeto seleccionado en el contexto BC3 cuando cambia
  React.useEffect(() => {
    setSelectedObjectId(selectedObjectId)
  }, [selectedObjectId, setSelectedObjectId])

  return (
    <div className="bc3-panel">
      <BC3Uploader />
      <BC3ObjectInfo />
      <style jsx>{`
        .bc3-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
          max-width: 350px;
          margin-left: 16px;
        }
        
        @media (max-width: 1200px) {
          .bc3-panel {
            max-width: 100%;
            margin-left: 0;
            margin-top: 16px;
          }
        }
      `}</style>
    </div>
  )
}

// Componente público que proporciona el contexto BC3
export function BC3Panel(props: BC3PanelProps) {
  return (
    <BC3Provider>
      <BC3PanelContent {...props} />
    </BC3Provider>
  )
}

