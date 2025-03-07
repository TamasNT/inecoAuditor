"use client"
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

      // Modificar para capturar el ID del objeto seleccionado
      // Verificar que highlighter.events y highlighter.events.select existan antes de acceder a onHighlight
      if (highlighter.events && highlighter.events.select && highlighter.events.select.onHighlight) {
        highlighter.events.select.onHighlight.add((selection) => {
          if (selection.length > 0) {
            const objectId = selection[0].id
            setSelectedObjectId(objectId)
          } else {
            setSelectedObjectId(null)
          }
        })
      } else {
        console.warn("No se pudo acceder a highlighter.events.select.onHighlight")
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

  console.log("Estado actual:", {
    mainWorld: !!mainWorld,
    compareWorld: !!compareWorld,
    viewportA: !!viewportA,
    viewportB: !!viewportB,
    showSecondWorld,
  })

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
    <div className="viewer-container">
      {/* Panel izquierdo para BC3 */}
      <div className="left-panel">
        <div className="bc3-uploader">
          <h3>Cargar archivo BC3</h3>
          <div className="upload-area">
            <input
              type="file"
              accept=".bc3"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // Aquí procesamos el archivo BC3
                  console.log("Archivo BC3 seleccionado:", file.name)
                }
              }}
              id="bc3-file"
            />
            <label htmlFor="bc3-file">
              <div className="upload-button">
                <span className="icon">📁</span>
                <span>Seleccionar archivo BC3</span>
              </div>
            </label>
          </div>
        </div>
        {/* Aquí irá la información BC3 cuando se seleccione un objeto */}
        <div className="bc3-info">
          {selectedObjectId ? (
            <div>
              <h4>Información del objeto: {selectedObjectId}</h4>
              {/* Aquí mostraremos la información BC3 */}
            </div>
          ) : (
            <p>Seleccione un objeto para ver su información BC3</p>
          )}
        </div>
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
          gap: 16px;
          padding: 16px;
        }

        .left-panel {
          width: 300px;
          min-width: 300px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .viewer-main {
          flex: 1;
          min-width: 0;
        }

        .bc3-uploader {
          border-bottom: 1px solid #eee;
          padding-bottom: 16px;
        }

        .bc3-uploader h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #333;
        }

        .upload-area {
          position: relative;
        }

        .upload-area input[type="file"] {
          display: none;
        }

        .upload-button {
          border: 2px dashed #ccc;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upload-button:hover {
          border-color: #999;
          background: #f9f9f9;
        }

        .icon {
          font-size: 24px;
          display: block;
          margin-bottom: 8px;
        }

        .bc3-info {
          flex: 1;
          overflow-y: auto;
        }

        .bc3-info h4 {
          margin: 0 0 16px 0;
          font-size: 14px;
          color: #333;
        }

        .bc3-info p {
          color: #666;
          text-align: center;
          padding: 20px;
        }
      `}</style>
    </div>
  )
}

