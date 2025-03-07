export interface BC3FileInfo {
  propiedad: string
  version: string
  programa: string
}

export interface BC3Concept {
  codigo: string
  unidad: string
  resumen: string
  precio: string
  fecha: string
  tipo: string
}

export interface BC3Measurement {
  "Codigo padre": string
  "Codigo hijo": string
  "Medicion total": string
  "Descripcion padre"?: string
  "Descripcion hijo"?: string
  Unidad?: string
  Precio?: string
}

export interface BC3Data {
  fileInfo: BC3FileInfo
  concepts: BC3Concept[]
  measurements: Record<string, BC3Measurement[]>
  formattedMeasurements: Record<string, BC3Measurement[]>
}

export class BC3Parser {
  static parse(content: string): BC3Data {
    const lineas = content.split("\n")

    const fileInfo: BC3FileInfo = {
      propiedad: "",
      version: "",
      programa: "",
    }

    const concepts: BC3Concept[] = []
    const measurements: Record<string, BC3Measurement[]> = {}
    const conceptsDict: Record<string, BC3Concept> = {}

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i].trim()

      if (linea === "") continue

      if (linea.startsWith("~V")) {
        // Versión
        const campo = linea.substring(2).split("|")
        fileInfo.propiedad = campo[2] || ""
        fileInfo.version = campo[3] || ""
        fileInfo.programa = campo[5] || ""
      } else if (linea.startsWith("~C")) {
        // Concepto
        const campo = linea.substring(2).split("|")
        const codigo = campo[1] || ""
        const concepto: BC3Concept = {
          codigo: codigo,
          unidad: campo[2] || "",
          resumen: campo[3] || "",
          precio: campo[4] || "",
          fecha: campo[5] || "",
          tipo: campo[6] || "",
        }
        concepts.push(concepto)

        conceptsDict[codigo] = concepto
      } else if (linea.startsWith("~M")) {
        // Medición
        const campos = linea.substring(2).split("|")
        const patron = /#[A-Za-z0-9_$]+/g
        const lista = campos[4] ? campos[4].match(patron) : null

        if (lista && lista.length > 0) {
          for (let idIBM of lista) {
            idIBM = idIBM.substring(1)

            let padre = ""
            let hijo = ""

            if (campos[1]) {
              const partes = campos[1].split("\\")
              if (partes.length > 1) {
                padre = partes[0].trim()
                hijo = partes[1].trim()
              } else {
                padre = partes[0].trim()
              }
            }

            const datos: BC3Measurement = {
              "Codigo padre": padre,
              "Codigo hijo": hijo,
              "Medicion total": campos[3] || "",
            }

            if (measurements[idIBM]) {
              measurements[idIBM].push(datos)
            } else {
              measurements[idIBM] = [datos]
            }
          }
        }
      }
    }

    const formattedMeasurements = this.formatMeasurements(measurements, conceptsDict)

    return {
      fileInfo,
      concepts,
      measurements,
      formattedMeasurements,
    }
  }

  static formatMeasurements(
    measurements: Record<string, BC3Measurement[]>,
    conceptsDict: Record<string, BC3Concept>,
  ): Record<string, BC3Measurement[]> {
    const result = JSON.parse(JSON.stringify(measurements)) as Record<string, BC3Measurement[]>

    for (const key in result) {
      for (const dictionary of result[key]) {
        const padre = dictionary["Codigo padre"]
        const hijo = dictionary["Codigo hijo"]

        if (padre && conceptsDict[padre]) {
          dictionary["Descripcion padre"] = conceptsDict[padre].resumen
        }

        if (hijo && conceptsDict[hijo]) {
          dictionary["Descripcion hijo"] = conceptsDict[hijo].resumen
          dictionary["Unidad"] = conceptsDict[hijo].unidad
          dictionary["Precio"] = conceptsDict[hijo].precio
        }
      }
    }

    return result
  }
}

