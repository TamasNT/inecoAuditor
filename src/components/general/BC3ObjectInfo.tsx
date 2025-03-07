"use client"

import * as React from "react"
import { useBC3 } from "../../classes/BC3Context"

export function BC3ObjectInfo() {
  const { bc3Data, selectedObjectId } = useBC3()
  const [activeTab, setActiveTab] = React.useState("measurements")

  // Add debug logging
  React.useEffect(() => {
    if (selectedObjectId) {
      console.log("Objeto seleccionado:", selectedObjectId)
      console.log("Datos BC3 disponibles:", bc3Data)
      if (bc3Data?.formattedMeasurements) {
        console.log("Mediciones para el objeto:", bc3Data.formattedMeasurements[selectedObjectId])
      }
    }
  }, [selectedObjectId, bc3Data])

  if (!bc3Data) {
    return (
      <div className="bc3-object-info">
        <h3>Información BC3</h3>
        <p className="bc3-empty-message">No hay datos BC3 cargados</p>
      </div>
    )
  }

  if (!selectedObjectId) {
    return (
      <div className="bc3-object-info">
        <h3>Información BC3</h3>
        <p className="bc3-empty-message">Seleccione un objeto para ver su información</p>
      </div>
    )
  }

  const measurements = bc3Data.formattedMeasurements[selectedObjectId] || []

  // Add debug message when no measurements are found
  if (measurements.length === 0) {
    console.log(`No se encontraron mediciones para el objeto ${selectedObjectId}`)
    return (
      <div className="bc3-object-info">
        <h3>Información BC3 - ID: {selectedObjectId}</h3>
        <p className="bc3-empty-message">No hay mediciones para este objeto</p>
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
    </div>
  )
}

