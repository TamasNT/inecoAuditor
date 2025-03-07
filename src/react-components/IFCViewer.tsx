"use client"

// Importar los componentes y clases BC3
import { BC3Provider } from "../classes/BC3Context"
import * as React from "react"
import * as OBC from "@thatopen/components"
import * as OBCF from "@thatopen/components-front"
import * as BUI from "@thatopen/ui"
import * as THREE from "three"
import type { FragmentsGroup } from "@thatopen/fragments"
import { createWorld } from "../components/functions/worlds-factory"

//TODOCREATOR
import { TodoCreator } from "../bim-components/TodoCreator"
import { ViewerPanel } from "../bim-components/ViewerPanel"

import { AppManager } from "../bim-components"
import ViewerToolbar from "../components/Toolbars/ViewerToolbar"
import ProcessModel from "../components/general/ProcessModel"
import EPP from "../components/Panels/ElementPropertyPanel"
import WP from "../components/Panels/WorldPanel"
import TP from "../components/Panels/TreePanel"
import SV from "../components/Viewer/SplitView"
import { BC3Uploader } from "../components/general/BC3Uploader"
import { BC3ObjectInfo } from "../components/general/BC3ObjectInfo"

interface Props {
  components: OBC.Components
}

// Modificar la función IFCViewer para envolver con BC3Provider
export function IFCViewer(props: Props) {
  const components: OBC.Components = props.components
  const viewerPanelRef = React.useRef<ViewerPanel | null>(null)

  const [mainWorld, setMainWorld] = React.useState<OBC.World>()
  const [compareWorld, setCompareWorld] = React.useState<OBC.World>()
  const [viewportA, setViewportA] = React.useState<HTMLElement>()
  const [viewportB, setViewportB] = React.useState<HTMLElement>()
  const [showSecondWorld, setShowSecondWorld] = React.useState(false)
  const [uiInitialized, setUIInitialized] = React.useState(false)
  const setupUIRef = React.useRef<(() => void) | null>(null)

  // Añadir estado para el ID del objeto seleccionado
  const [selectedObjectId, setSelectedObjectId] = React.useState<string | null>(null)

  let fragmentModel: FragmentsGroup | undefined
  const appManager = components.get(AppManager)

  React.useEffect(() => {
    components.init()

    const { world: worldA, viewport: viewportA } = createWorld(components, { name: "Main" })
    setMainWorld(worldA)
    setViewportA(viewportA)

    const setupWorld = (world: OBC.World) => {
      const ifcLoader = components.get(OBC.IfcLoader)
      ifcLoader.setup()

      const fragmentsManager = components.get(OBC.FragmentsManager)

      fragmentsManager.onFragmentsLoaded.add(async (model) => {
        world.scene.three.add(model)
        if (model.hasProperties) await ProcessModel(model, components)

        const cullers = components.get(OBC.Cullers)
        const culler = cullers.list.get(world.uuid)
        model.items.forEach((fragment) => culler?.add(fragment.mesh))
        culler && (culler.needsUpdate = true)

        appManager.fragmentModel = model
        fragmentModel = model
      })

      const highlighter = components.get(OBCF.Highlighter)
      if (!highlighter) {
        console.error("No se pudo obtener el highlighter")
        return
      }

      highlighter.setup({
        selectName: "selectEvent",
        selectEnabled: true,
        hoverName: "hoverEvent",
        hoverEnabled: true,
        selectionColor: new THREE.Color(0xff0000),
        hoverColor: new THREE.Color("#6B96CF"),
        autoHighlightOnClick: true,
        world,
      })

      // Asegurarse de que los eventos estén configurados correctamente
      try {
        if (highlighter.events?.select) {
          // Eliminar cualquier listener anterior para evitar duplicados
          highlighter.events.select.onHighlight.clear()

          // Añadir el nuevo listener
          highlighter.events.select.onHighlight.add((selection) => {
            console.log("Objeto seleccionado:", selection)
            if (selection.length > 0) {
              const objectId = selection[0].id
              console.log("ID del objeto seleccionado:", objectId)

              // Extraer información adicional si está disponible
              let fragmentID = null
              let modelID = null

              try {
                if (selection[0].fragment) {
                  fragmentID = selection[0].fragment.id
                }
                if (selection[0].model) {
                  modelID = selection[0].model.id
                }

                console.log("Información adicional:", {
                  fragmentID,
                  modelID,
                  rawSelection: selection[0],
                })
              } catch (error) {
                console.warn("No se pudo extraer información adicional:", error)
              }

              setSelectedObjectId(objectId)
            } else {
              console.log("Selección vacía")
              setSelectedObjectId(null)
            }
          })
        } else {
          console.warn("No se pudo acceder a highlighter.events.select")
        }
      } catch (error) {
        console.error("Error al configurar el evento de selección:", error)
      }

      const todoCreator = components.get(TodoCreator)
      todoCreator.world = world
      todoCreator.setup()

      const viewerPanel = components.get(ViewerPanel)
      viewerPanel.world = worldA
      viewerPanelRef.current = viewerPanel
      appManager.viewerPanelRef = viewerPanel

      return { fragmentsManager, highlighter }
    }

    setupWorld(worldA)

    return () => {
      components.dispose()
      fragmentModel?.dispose()
    }
  }, [])

  const initializeUI = React.useCallback(() => {
    const viewerContainer = document.getElementById("viewer-container")

    if (!viewerContainer) {
      console.log("No hay viewerContainer")
      return
    }

    const floatingGrid = BUI.Component.create<BUI.Grid>(
      () => BUI.html`
      <bim-grid floating style="padding: 20px" id="floating-grid"></bim-grid>
    `,
    )
    appManager.floatingGrid = floatingGrid

    const elementPropertyPanel = EPP(components)
    const toolbar = ViewerToolbar(components)
    const worldPanel = WP(components)
    const treePanel = TP(components)
    const splitView = SV(components)

    floatingGrid.layouts = {
      main: {
        template: `"empty" 1fr 
          "toolbar" auto 
          / 1fr`,
        elements: { toolbar },
      },
      secondary: {
        template: `"empty elementPropertyPanel" 1fr 
          "toolbar toolbar" auto 
          / 1fr 20rem`,
        elements: { toolbar, elementPropertyPanel },
      },
      world: {
        template: `"empty worldPanel" 1fr 
          "toolbar toolbar" auto 
          / 1fr 20rem`,
        elements: { toolbar, worldPanel },
      },
      tree: {
        template: `"empty treePanel" 1fr 
          "toolbar toolbar" auto 
          / 1fr 20rem`,
        elements: { toolbar, treePanel },
      },
      compare: {
        template: `"splitView" 1fr 
          "toolbar toolbar" auto 
          / 1fr 20rem`,
        elements: { toolbar, splitView },
      },
      clean: {
        template: `"empty" 1fr 
          / 1fr`,
        elements: {},
      },
    }

    floatingGrid.layout = "main"

    setTimeout(() => {
      viewerContainer.appendChild(floatingGrid)
    }, 200)

    setUIInitialized(true)
  }, [components, viewportA])

  React.useEffect(() => {
    if (!mainWorld || !viewportA) {
      return
    }

    const viewerContainer = document.getElementById("viewer-container")
    if (viewerContainer && !viewerContainer.contains(viewportA)) {
      viewerContainer.appendChild(viewportA)
    }
  }, [mainWorld, viewportA])

  React.useEffect(() => {
    if (mainWorld && !uiInitialized) {
      initializeUI()
      setupUIRef.current = initializeUI
    }
  }, [mainWorld, uiInitialized, initializeUI])

  // Modificar el return para incluir el componente BC3Panel
  return (
    <BC3Provider>
      <div className="viewer-container">
        {/* Panel izquierdo para BC3 */}
        <div className="left-panel">
          <BC3Uploader />
          <BC3ObjectInfo />
        </div>

        {/* Visor IFC */}
        <div className="viewer-main">
          <div
            id="viewer-container"
            className="dashboard-card"
            style={{
              position: "relative",
              width: "100%",
              height: "95vh",
              minWidth: 0,
              maxWidth: "none",
            }}
          ></div>
        </div>

        <style jsx>{`
          .viewer-container {
            display: flex;
            width: 100%;
            height: 100%;
            gap: 8px;
            padding: 8px;
          }

          .left-panel {
            width: 250px;
            min-width: 250px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            overflow-y: auto;
            max-height: 95vh;
          }

          .viewer-main {
            flex: 1;
            min-width: 0;
          }

          @media (max-width: 768px) {
            .viewer-container {
              flex-direction: column;
            }
            
            .left-panel {
              width: 100%;
              max-height: none;
            }
          }
        `}</style>
      </div>
    </BC3Provider>
  )
}

