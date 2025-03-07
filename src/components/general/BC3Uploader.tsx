"use client"

import * as React from "react"
import { BC3Parser } from "../../classes/BC3Parser"
import { useBC3 } from "../../classes/BC3Context"

export function BC3Uploader() {
  const { setBc3Data } = useBC3()
  const [isLoading, setIsLoading] = React.useState(false)
  const [fileName, setFileName] = React.useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setFileName(file.name)

    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        const data = BC3Parser.parse(content)
        setBc3Data(data)
      }
      setIsLoading(false)
    }

    reader.onerror = () => {
      console.error("Error al leer el archivo")
      setIsLoading(false)
    }

    reader.readAsText(file)
  }

  return (
    <div className="bc3-uploader">
      <h3>Cargar archivo BC3</h3>
      <div className="bc3-uploader-content">
        <label htmlFor="bc3-file-input" className="bc3-file-label">
          <div className="bc3-file-drop-area">
            <span className="bc3-file-icon">📁</span>
            <span className="bc3-file-text">{fileName ? fileName : "Seleccionar archivo BC3"}</span>
          </div>
          <input id="bc3-file-input" type="file" accept=".bc3" onChange={handleFileChange} className="bc3-file-input" />
        </label>
        {isLoading && <p className="bc3-loading">Cargando...</p>}
      </div>
      <style jsx>{`
        .bc3-uploader {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .bc3-uploader h3 {
          margin-top: 0;
          margin-bottom: 16px;
        }
        
        .bc3-uploader-content {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .bc3-file-label {
          cursor: pointer;
          width: 100%;
        }
        
        .bc3-file-drop-area {
          border: 2px dashed #ccc;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          transition: all 0.2s;
        }
        
        .bc3-file-drop-area:hover {
          background-color: #f9f9f9;
        }
        
        .bc3-file-icon {
          font-size: 24px;
          display: block;
          margin-bottom: 8px;
        }
        
        .bc3-file-text {
          color: #666;
        }
        
        .bc3-file-input {
          display: none;
        }
        
        .bc3-loading {
          margin-top: 8px;
          color: #666;
        }
      `}</style>
    </div>
  )
}

