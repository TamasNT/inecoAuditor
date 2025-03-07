"use client"

import * as React from "react"
import { useBC3 } from "../../classes/BC3Context"

export function BC3ObjectInfo() {
  const { bc3Data, selectedObjectId } = useBC3()
  const [activeTab, setActiveTab] = React.useState("measurements")

  if (!bc3Data) {
    return (
      <div className="bc3-object-info">
        <h3>Información BC3</h3>
        <p className="bc3-empty-message">No hay datos BC3 cargados</p>
        <style jsx>{`
          .bc3-object-info {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 16px;
          }
          
          .bc3-empty-message {
            color: #666;
            text-align: center;
            padding: 24px 0;
          }
        `}</style>
      </div>
    )
  }

  if (!selectedObjectId) {
    return (
      <div className="bc3-object-info">
        <h3>Información BC3</h3>
        <p className="bc3-empty-message">Seleccione un objeto para ver su información</p>
        <style jsx>{`
          .bc3-object-info {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 16px;
          }
          
          .bc3-empty-message {
            color: #666;
            text-align: center;
            padding: 24px 0;
          }
        `}</style>
      </div>
    )
  }

  const measurements = bc3Data.formattedMeasurements[selectedObjectId] || []

  if (measurements.length === 0) {
    return (
      <div className="bc3-object-info">
        <h3>Información BC3 - ID: {selectedObjectId}</h3>
        <p className="bc3-empty-message">No hay mediciones para este objeto</p>
        <style jsx>{`
          .bc3-object-info {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 16px;
          }
          
          .bc3-empty-message {
            color: #666;
            text-align: center;
            padding: 24px 0;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="bc3-object-info">
      <h3>Información BC3 - ID: {selectedObjectId}</h3>

      <div className="bc3-tabs">
        <button
          className={`bc3-tab ${activeTab === "measurements" ? "active" : ""}`}
          onClick={() => setActiveTab("measurements")}
        >
          Mediciones
        </button>
        <button
          className={`bc3-tab ${activeTab === "concepts" ? "active" : ""}`}
          onClick={() => setActiveTab("concepts")}
        >
          Conceptos
        </button>
      </div>

      {activeTab === "measurements" && (
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
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 16px;
        }
        
        .bc3-tabs {
          display: flex;
          border-bottom: 1px solid #eee;
          margin-bottom: 16px;
        }
        
        .bc3-tab {
          padding: 8px 16px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          border-bottom: 2px solid transparent;
        }
        
        .bc3-tab.active {
          color: #0066cc;
          border-bottom-color: #0066cc;
        }
        
        .bc3-table-container {
          overflow-x: auto;
        }
        
        .bc3-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .bc3-table th,
        .bc3-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .bc3-table th {
          background-color: #f9f9f9;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}

