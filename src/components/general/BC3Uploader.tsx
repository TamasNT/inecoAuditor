"use client"

import * as React from "react"
import { BC3Parser } from "../../classes/BC3Parser"
import { useBC3 } from "../../classes/BC3Context"

export function BC3Uploader() {
  const { setBc3Data } = useBC3()
  const [isLoading, setIsLoading] = React.useState(false)
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [isUploaded, setIsUploaded] = React.useState(false)
  const [showUploader, setShowUploader] = React.useState(true)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setFileName(file.name)

    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        try {
          console.log("Procesando archivo BC3:", file.name)
          const data = BC3Parser.parse(content)
          console.log("Datos BC3 procesados:", data)
          setBc3Data(data)
          setIsUploaded(true)
          setShowUploader(false) // Ocultar el uploader después de cargar
        } catch (error) {
          console.error("Error al procesar el archivo BC3:", error)
        }
      }
      setIsLoading(false)
    }

    reader.onerror = (error) => {
      console.error("Error al leer el archivo:", error)
      setIsLoading(false)
    }

    reader.readAsText(file)
  }

  if (!showUploader && isUploaded) {
    return (
      <div className="bc3-uploader-mini">
        <div className="bc3-file-info">
          <span className="bc3-file-icon-mini">📄</span>
          <span className="bc3-file-name">{fileName}</span>
          <button className="bc3-toggle-btn" onClick={() => setShowUploader(true)} title="Mostrar panel de carga">
            ⚙️
          </button>
        </div>
        <style jsx>{`
          .bc3-uploader-mini {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            padding: 8px;
            margin-bottom: 8px;
          }
          
          .bc3-file-info {
            display: flex;
            align-items: center;
            font-size: 12px;
          }
          
          .bc3-file-icon-mini {
            margin-right: 8px;
          }
          
          .bc3-file-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .bc3-toggle-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 2px;
            font-size: 12px;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="bc3-uploader">
      <div className="bc3-uploader-header">
        <h3>Cargar archivo BC3</h3>
        {isUploaded && (
          <button className="bc3-toggle-btn" onClick={() => setShowUploader(false)} title="Ocultar panel de carga">
            ▲
          </button>
        )}
      </div>
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
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          padding: 12px;
          margin-bottom: 8px;
        }
        
        .bc3-uploader-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .bc3-uploader h3 {
          margin: 0;
          font-size: 14px;
        }
        
        .bc3-toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 5px;
          font-size: 12px;
        }
        
        .bc3-uploader-content {
          display: flex;
          flex-direction: column;
        }
        
        .bc3-file-label {
          cursor: pointer;
          width: 100%;
        }
        
        .bc3-file-drop-area {
          border: 1px dashed #ccc;
          border-radius: 4px;
          padding: 10px;
          text-align: center;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .bc3-file-drop-area:hover {
          background-color: #f9f9f9;
        }
        
        .bc3-file-icon {
          font-size: 16px;
          margin-right: 8px;
        }
        
        .bc3-file-text {
          color: #666;
          font-size: 12px;
        }
        
        .bc3-file-input {
          display: none;
        }
        
        .bc3-loading {
          margin-top: 4px;
          color: #666;
          font-size: 12px;
          text-align: center;
        }
      `}</style>
    </div>
  )
}

