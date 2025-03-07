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

// BC3 Integration
import { BC3Provider, useBC3 } from "../contexts/bc3-context"
import { BC3Uploader } from "../components/bc3-uploader"
import { BC3ObjectInfo } from "../components/bc3-object-info"
import type { BC3Data } from "../services/bc3-parser"

interface Props {
  components: OBC.Components
}

function IFCViewerInner(props: Props) {
  const components: OBC.Components = props.components
  const viewerPanelRef = React.useRef<ViewerPanel | null>(null)

  const [mainWorld, setMainWorld] = React.useState<OBC.World>()
  const [compareWorld, setCompareWorld] = React.useState<OBC.World>()
  const [viewportA, setViewportA] = React.useState<HTMLElement>()
  const [viewportB, setViewportB] = React.useState<HTMLElement>()
  const [showSecondWorld, setShowSecondWorld] = React.useState(false)
  const [uiInitialized, setUIInitialized] = React.useState(false)
  const setupUIRef = React.useRef<(() => void) | null>(null)

  // BC3 Integration
  const { setBc3Data, setSelectedObjectId } = useBC3()

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

      // BC3 Integration: Add event listener for object selection
      highlighter.events.select.onHighlight.add((selection) => {
        if (selection.length > 0) {
          const objectId = selection[0].id
          setSelectedObjectId(objectId)
        } else {
          setSelectedObjectId(null)
        }
      })

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

  const handleBC3DataLoaded = (data: BC3Data) => {
    setBc3Data(data)
  }

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

  return (
    <div className="flex flex-col md:flex-row w-full h-full gap-4">
      <div
        id="viewer-container"
        className="dashboard-card flex-1"
        style={{
          position: "relative",
          height: "95vh",
          minWidth: 0,
          maxWidth: 800,
        }}
      ></div>
      <div className="flex flex-col gap-4 w-full md:w-96">
        <BC3Uploader onDataLoaded={handleBC3DataLoaded} />
        <BC3ObjectInfoContainer />
      </div>
    </div>
  )
}

// Separate component to use the BC3 context
function BC3ObjectInfoContainer() {
  const { bc3Data, selectedObjectId } = useBC3()

  return <BC3ObjectInfo bc3Data={bc3Data} selectedObjectId={selectedObjectId} />
}

// Wrap the IFCViewer with the BC3Provider
export function IFCViewer(props: Props) {
  return (
    <BC3Provider>
      <IFCViewerInner {...props} />
    </BC3Provider>
  )
}

