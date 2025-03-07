"use client"

import * as React from "react"
import { useBC3 } from "../../classes/BC3Context"

function normalizeId(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function findRelatedMeasurements(bc3Data: any, objectId: string) {
  // Intentar coincidencia exacta primero
  if (bc3Data.formattedMeasurements[objectId]) {
    console.log("Coincidencia exacta encontrada para:", objectId)
    return {
      measurements: bc3Data.formattedMeasurements[objectId],
      matchType: "exact",
      matchId: objectId,
    }
  }

  // Normalizar el ID del objeto para búsqueda
  const normalizedObjectId = normalizeId(objectId)
  console.log("ID normalizado para búsqueda:", normalizedObjectId)

  // Buscar coincidencias parciales
  for (const [id, measurements] of Object.entries(bc3Data.formattedMeasurements)) {
    const normalizedId = normalizeId(id)

    // Verificar si el ID normalizado contiene o está contenido en el ID del objeto
    if (normalizedId.includes(normalizedObjectId) || normalizedObjectId.includes(normalizedId)) {
      console.log("Coincidencia parcial encontrada:", id)
      return {
        measurements: measurements as any[],
        matchType: "partial",
        matchId: id,
      }
    }

    // Buscar en los códigos de las mediciones
    for (const measurement of measurements as any[]) {
      const codigoPadre = measurement["Codigo padre"]
      const codigoHijo = measurement["Codigo hijo"]

      if (codigoPadre && normalizeId(codigoPadre).includes(normalizedObjectId)) {
        console.log("Coincidencia en código padre:", codigoPadre)
        return {
          measurements: measurements as any[],
          matchType: "code",
          matchId: id,
        }
      }

      if (codigoHijo && normalizeId(codigoHijo).includes(normalizedObjectId)) {
        console.log("Coincidencia en código hijo:", codigoHijo)
        return {
          measurements: measurements as any[],
          matchType: "code",
          matchId: id,
        }
      }
    }
  }

  // Buscar por similitud de caracteres (al menos 3 caracteres en común)
  if (normalizedObjectId.length >= 3) {
    for (const [id, measurements] of Object.entries(bc3Data.formattedMeasurements)) {
      const normalizedId = normalizeId(id)

      // Buscar subcadenas comunes de al menos 3 caracteres
      for (let i = 0; i <= normalizedObjectId.length - 3; i++) {
        const subStr = normalizedObjectId.substring(i, i + 3)
        if (normalizedId.includes(subStr)) {
          console.log("Coincidencia por subcadena:", subStr, "en ID:", id)
          return {
            measurements: measurements as any[],
            matchType: "substring",
            matchId: id,
          }
        }
      }
    }
  }

  console.log("No se encontraron coincidencias para:", objectId)
  return { measurements: [], matchType: "none", matchId: null }
}

export function BC3ObjectInfo() {
  const { bc3Data, selectedObjectId } = useBC3()
  const [activeTab, setActiveTab] = React.useState("all")

  if (!bc3Data) {
    return (
      <div className="bc3-object-info">
        <h3>Información BC3</h3>
        <p className="bc3-empty-message">No hay datos BC3 cargados</p>
      </div>
    )
  }

  // Mostrar todos los datos BC3 cuando no hay objeto seleccionado
  if (!selectedObjectId) {
    // Obtener todas las mediciones
    const allMeasurements = Object.values(bc3Data.formattedMeasurements).flat()

    return (
      <div className="bc3-object-info">
        <h3>Datos BC3 - Resumen</h3>

        <div className="bc3-tabs">
          <button className={`bc3-tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
            Mediciones
          </button>
          <button
            className={`bc3-tab ${activeTab === "concepts" ? "active" : ""}`}
            onClick={() => setActiveTab("concepts")}
          >
            Conceptos
          </button>
        </div>

        {activeTab === "all" && (
          <div className="bc3-table-container">
            <table className="bc3-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th>Medición</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(bc3Data.formattedMeasurements).map(([id, measurements]) =>
                  measurements.map((measurement, index) => (
                    <tr key={`${id}-${index}`}>
                      <td>{id}</td>
                      <td>{measurement["Codigo hijo"] || measurement["Codigo padre"]}</td>
                      <td>{measurement["Descripcion hijo"] || measurement["Descripcion padre"] || "-"}</td>
                      <td>{measurement["Medicion total"]}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "concepts" && (
          <div className="bc3-table-container">
            <table className="bc3-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th>Unidad</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {bc3Data.concepts.map((concept, index) => (
                  <tr key={index}>
                    <td>{concept.codigo}</td>
                    <td>{concept.resumen}</td>
                    <td>{concept.unidad}</td>
                    <td>{concept.precio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  const { measurements, matchType, matchId } = findRelatedMeasurements(bc3Data, selectedObjectId)

  if (measurements.length === 0) {
    return (
      <div className="bc3-object-info">
        <h3>Información BC3 - ID: {selectedObjectId}</h3>
        <p className="bc3-empty-message">No se encontraron mediciones para este objeto</p>
        <div className="bc3-search-info">
          <p>Sugerencias:</p>
          <ul>
            <li>Verifica que el ID del objeto coincida con algún identificador en el archivo BC3</li>
            <li>El archivo BC3 podría usar un sistema de identificación diferente</li>
            <li>Prueba seleccionando diferentes objetos</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="bc3-object-info">
      <h3>
        Información BC3 - ID: {selectedObjectId}
        {matchType !== "exact" && (
          <span className="bc3-match-info">
            {matchType === "partial" && " (coincidencia parcial)"}
            {matchType === "code" && " (coincidencia por código)"}
            {matchType === "substring" && " (coincidencia por similitud)"}
            {matchId && ` → ${matchId}`}
          </span>
        )}
      </h3>

      <div className="bc3-tabs">
        <button className={`bc3-tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
          Mediciones
        </button>
        <button
          className={`bc3-tab ${activeTab === "concepts" ? "active" : ""}`}
          onClick={() => setActiveTab("concepts")}
        >
          Conceptos
        </button>
      </div>

      {activeTab === "all" && (
        <div className="bc3-table-container">
          <table className="bc3-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Unidad</th>
                <th>Precio</th>
                <th>Medición</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((measurement, index) => (
                <tr key={index}>
                  <td>{measurement["Codigo hijo"] || measurement["Codigo padre"]}</td>
                  <td>{measurement["Descripcion hijo"] || measurement["Descripcion padre"] || "-"}</td>
                  <td>{measurement["Unidad"] || "-"}</td>
                  <td>{measurement["Precio"] || "-"}</td>
                  <td>{measurement["Medicion total"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "concepts" && (
        <div className="bc3-table-container">
          <table className="bc3-table">
            <thead>
              <tr>
                <th>Código Padre</th>
                <th>Descripción Padre</th>
                <th>Código Hijo</th>
                <th>Descripción Hijo</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((measurement, index) => (
                <tr key={index}>
                  <td>{measurement["Codigo padre"]}</td>
                  <td>{measurement["Descripcion padre"] || "-"}</td>
                  <td>{measurement["Codigo hijo"]}</td>
                  <td>{measurement["Descripcion hijo"] || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .bc3-object-info {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          padding: 12px;
          font-size: 12px;
        }
        
        .bc3-object-info h3 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .bc3-empty-message {
          color: #666;
          text-align: center;
          padding: 12px 0;
          font-size: 12px;
        }
        
        .bc3-tabs {
          display: flex;
          border-bottom: 1px solid #eee;
          margin-bottom: 8px;
        }
        
        .bc3-tab {
          padding: 4px 8px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          color: #666;
          border-bottom: 2px solid transparent;
        }
        
        .bc3-tab.active {
          color: #0066cc;
          border-bottom-color: #0066cc;
        }
        
        .bc3-table-container {
          overflow-x: auto;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .bc3-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        
        .bc3-table th,
        .bc3-table td {
          padding: 4px 6px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .bc3-table th {
          background-color: #f9f9f9;
          font-weight: 500;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        
        .bc3-match-info {
          font-size: 11px;
          font-weight: normal;
          color: #666;
          margin-left: 5px;
        }
        
        .bc3-search-info {
          margin-top: 10px;
          font-size: 11px;
          color: #666;
        }
        
        .bc3-search-info ul {
          padding-left: 20px;
          margin-top: 5px;
        }
        
        .bc3-search-info li {
          margin-bottom: 3px;
        }
      `}</style>
    </div>
  )
}

