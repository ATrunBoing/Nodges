/**
 * InteractionManager - Unified Interaction System
 * Verwaltet alle Benutzerinteraktionen (Hover, Click, Selection, etc.)
 * Arbeitet mit CentralEventManager und StateManager zusammen
 */

export class InteractionManager {
    constructor(centralEventManager, stateManager, highlightManager, camera, controls, scene) {
        this.eventManager = centralEventManager;
        this.stateManager = stateManager;
        this.highlightManager = highlightManager;
        this.camera = camera;
        this.controls = controls;
        this.scene = scene;
        
        // Interaction Modes
        this.modes = {
            SELECT: 'select',
            HOVER: 'hover',
            DRAG: 'drag',
            PAN: 'pan',
            ZOOM: 'zoom'
        };
        
        this.currentMode = this.modes.SELECT;
        
        // Interaction State
        this.isEnabled = true;
        this.isDragging = false;
        this.dragStartPosition = null;
        this.dragThreshold = 5; // Pixel
        
        // Info Panel Management
        this.infoPanelElement = null;
        this.infoPanelTitle = null;
        this.infoPanelContent = null;
        
        // Timing
        this.lastInteractionTime = 0;
        this.interactionCooldown = 50; // ms
        
        this.initializeEventSubscriptions();
        this.initializeInfoPanel();
        
    }
    
    /**
     * Initialisiert Event-Subscriptions
     */
    initializeEventSubscriptions() {
        // Hover Events
        this.eventManager.subscribe('hover_start', this.handleHoverStart.bind(this));
        this.eventManager.subscribe('hover_end', this.handleHoverEnd.bind(this));
        
        // Selection Events
        this.eventManager.subscribe('click', this.handleClick.bind(this));
        this.eventManager.subscribe('doubleclick', this.handleDoubleClick.bind(this));
        
        // Mouse Events
        this.eventManager.subscribe('mousedown', this.handleMouseDown.bind(this));
        this.eventManager.subscribe('mouseup', this.handleMouseUp.bind(this));
        this.eventManager.subscribe('mousemove', this.handleMouseMove.bind(this));
        
        // Context Menu
        this.eventManager.subscribe('contextmenu', this.handleContextMenu.bind(this));
        
        // Keyboard Events
        this.eventManager.subscribe('keydown', this.handleKeyDown.bind(this));
        this.eventManager.subscribe('keyup', this.handleKeyUp.bind(this));
    }
    
    /**
     * Initialisiert Info Panel Elemente
     */
    initializeInfoPanel() {
        // Info Panel Initialisierung wird nun vom UIManager gehandhabt
    }
    
    /**
     * Handler fuer Hover Start
     */
    handleHoverStart(data) {
        if (!this.isEnabled) return;

        const { object } = data;

        if (object) {
            // Highlight anwenden
            this.highlightManager.highlightHoveredObject(object);

            // Tooltip anzeigen (optional)
            this.showTooltip(object);

        }
    }
    
    /**
     * Handler fuer Hover End
     */
    handleHoverEnd(data) {
        if (!this.isEnabled) return;

        const { object } = data;

        if (object) {
            // Highlight entfernen (nur wenn nicht selektiert)
            if (!this.stateManager.isObjectSelected(object)) {
                this.highlightManager.removeHighlight(object);
            }

            // Tooltip verstecken
            this.hideTooltip();

        }
    }
    
    /**
     * Handler fuer Click Events
     */
    handleClick(data) {
        if (!this.isEnabled) return;
        
        const { event, clickedObject } = data;
        
        // Cooldown check
        const now = performance.now();
        if (now - this.lastInteractionTime < this.interactionCooldown) {
            return;
        }
        this.lastInteractionTime = now;
        
        // Drag-Check: War es ein Drag oder ein echter Click?
        if (this.isDragging) {
            this.isDragging = false;
            return;
        }
        
        if (clickedObject) {
            this.selectObject(clickedObject);
        } else {
            this.deselectAll();
        }
        
    }
    
    /**
     * Handler fuer Double-Click Events
     */
    handleDoubleClick(data) {
        if (!this.isEnabled) return;
        
        const { clickedObject } = data;
        
        if (clickedObject) {
            this.focusOnObject(clickedObject);
        }
    }
    
    /**
     * Handler fuer Mouse Down
     */
    handleMouseDown(data) {
        if (!this.isEnabled) return;
        
        const { event, clickedObject } = data;
        
        this.dragStartPosition = {
            x: event.clientX,
            y: event.clientY
        };
        
        this.isDragging = false;
    }
    
    /**
     * Handler fuer Mouse Up
     */
    handleMouseUp(data) {
        if (!this.isEnabled) return;
        
        this.isDragging = false;
        this.dragStartPosition = null;
    }
    
    /**
     * Handler fuer Mouse Move
     */
    handleMouseMove(data) {
        if (!this.isEnabled) return;
        
        const { event } = data;
        
        // Drag-Detection
        if (this.dragStartPosition && !this.isDragging) {
            const deltaX = Math.abs(event.clientX - this.dragStartPosition.x);
            const deltaY = Math.abs(event.clientY - this.dragStartPosition.y);
            
            if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
                this.isDragging = true;
            }
        }
    }
    
    /**
     * Handler fuer Context Menu
     */
    handleContextMenu(data) {
        if (!this.isEnabled) return;
        
        const { event, clickedObject } = data;
        
        if (clickedObject) {
            this.showContextMenu(clickedObject, event);
        }
        
    }
    
    /**
     * Handler fuer Keyboard Events
     */
    handleKeyDown(data) {
        if (!this.isEnabled) return;
        
        const { event } = data;
        
        switch (event.key) {
            case 'Escape':
                this.deselectAll();
                this.hideInfoPanel();
                break;
            case 'Delete':
                this.deleteSelected();
                break;
            case 'f':
            case 'F':
                if (this.stateManager.state.selectedObject) {
                    this.focusOnObject(this.stateManager.state.selectedObject);
                }
                break;
        }
    }
    
    handleKeyUp(data) {
        // Placeholder fuer Key-Up Events
    }
    
    /**
     * Selektiert ein Objekt
     */
    selectObject(object) {
        // Altes Objekt deselektieren
        const oldSelected = this.stateManager.state.selectedObject;
        if (oldSelected && oldSelected !== object) {
            this.highlightManager.removeHighlight(oldSelected);
        }
        
        // Neues Objekt selektieren
        this.stateManager.setSelectedObject(object);
        this.highlightManager.highlightSelectedObject(object);
        
        // Info Panel anzeigen
        this.showInfoPanel(object);
        
    }
    
    /**
     * Deselektiert alle Objekte
     */
    deselectAll() {
        const selectedObject = this.stateManager.state.selectedObject;
        if (selectedObject) {
            this.highlightManager.removeHighlight(selectedObject);
        }
        
        this.stateManager.setSelectedObject(null);
        
        // Panel kollabieren statt verstecken
        if (this.infoPanelElement) {
            this.infoPanelElement.classList.add('collapsed');
            
            const infoPanelToggle = document.getElementById('infoPanelToggle');
            if (infoPanelToggle) {
                infoPanelToggle.innerHTML = '>';
            }
            
            if (this.infoPanelContent) {
                this.infoPanelContent.innerHTML = '<p>Kein Objekt ausgewaehlt</p>';
            }
        }
        
    }
    
    /**
     * Fokussiert auf ein Objekt (Kamera-Bewegung)
     */
    focusOnObject(object) {
        if (!this.camera || !this.controls || !object) return;
        
        // Berechne die Position des Objekts
        const position = new THREE.Vector3();
        object.getWorldPosition(position);
        
        // Berechne die Entfernung basierend auf der Objektgröße
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3()).length();
        const distance = Math.max(size * 2, 5); // Mindestabstand von 5 Einheiten
        
        // Berechne die neue Kameraposition
        const direction = new THREE.Vector3()
            .subVectors(this.camera.position, this.controls.target)
            .normalize();
            
        const newPosition = position.clone().addScaledVector(direction, distance);
        
        // Setze die neue Kamera-Position und das Ziel
        this.camera.position.copy(newPosition);
        this.controls.target.copy(position);
        this.controls.update();
        
        // Anpassung der Zoom-Stärke basierend auf der Objektgröße
        const zoomFactor = Math.max(1, size / 5);
        this.controls.zoomSpeed = 1.5 / zoomFactor;
    }
    
    /**
     * Loescht selektierte Objekte
     */
    deleteSelected() {
        const selectedObject = this.stateManager.state.selectedObject;
        if (selectedObject) {
            // Lösche das Objekt aus der Szene
            this.scene.remove(selectedObject);
            
            // Entferne Highlight und Ressourcen
            this.highlightManager.removeHighlight(selectedObject);
            
            // Freigabe von Geometrie und Material
            if (selectedObject.geometry) {
                selectedObject.geometry.dispose();
            }
            if (selectedObject.material) {
                selectedObject.material.dispose();
            }
            
            // Deselektiere das Objekt
            this.deselectAll();
            
            // Event veröffentlichen
            this.eventManager.publish('object_deleted', { object: selectedObject });
        }
    }
    
    /**
     * Zeigt Tooltip an
     */
    showTooltip(object) {
        if (!object || !object.userData) return;
        
        const content = this.generateTooltipContent(object);
        // Tooltip-Position wird vom Event-System bereitgestellt
        this.stateManager.showTooltip(content, null);
    }
    
    /**
     * Versteckt Tooltip
     */
    hideTooltip() {
        this.stateManager.hideTooltip();
    }
    
    /**
     * Generiert Tooltip-Inhalt
     */
    generateTooltipContent(object) {
        if (object.userData.type === 'node') {
            return object.userData.node?.data?.name || object.name || 'Unbenannter Knoten';
        } else if (object.userData.type === 'edge') {
            return object.userData.edge?.options?.name || object.name || 'Unbenannte Kante';
        }
        return 'Unbekanntes Objekt';
    }
    
    /**
     * Zeigt Info Panel an
     */
    showInfoPanel(object) {
        if (!object) return;

        // Verwende UIManager API
        this.app.uiManager.showInfoPanelFor(object);
    }
    
    /**
     * Versteckt Info Panel
     */
    hideInfoPanel() {
        // Verwende UIManager API
        this.app.uiManager.hideDetails();
    }
    
    /**
     * Generiert Info Panel Inhalt
     */
    generateInfoPanelContent(object) {
        if (object.userData.type === 'node') {
            return this.generateNodeInfo(object);
        } else if (object.userData.type === 'edge') {
            return this.generateEdgeInfo(object);
        }
        
        return {
            title: 'Unbekanntes Objekt',
            html: '<p>Keine Informationen verfuegbar</p>'
        };
    }
    
    /**
     * Generiert Node-Informationen
     */
    generateNodeInfo(nodeObject) {
        const nodeData = nodeObject.userData.node?.data || {};
        const name = nodeData.name || nodeObject.name || 'Unbenannter Knoten';
        const x = nodeData.x || 0;
        const y = nodeData.y || 0;
        const z = nodeData.z || 0;
        
        return {
            title: name,
            html: `
                <p><strong>Position:</strong> (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})</p>
                <p><strong>Typ:</strong> Knoten</p>
                <p><strong>ID:</strong> ${nodeData.id || 'Unbekannt'}</p>
            `
        };
    }
    
    /**
     * Generiert Edge-Informationen
     */
    generateEdgeInfo(edgeObject) {
        const edgeData = edgeObject.userData.edge?.options || {};
        const name = edgeData.name || edgeObject.name || 'Unbenannte Kante';
        
        // Erweiterte Edge-Informationen
        const startIndex = edgeData.start || 'Unbekannt';
        const endIndex = edgeData.end || 'Unbekannt';
        const offset = edgeData.offset || 0;
        const edgeType = edgeObject.userData.edge?.type || 'Unbekannt';
        
        return {
            title: name,
            html: `
                <p><strong>Typ:</strong> Kante (${edgeType})</p>
                <p><strong>Verbindung:</strong> Knoten ${startIndex} <-> Knoten ${endIndex}</p>
                <p><strong>Offset:</strong> ${offset}</p>
                <p><strong>Index:</strong> ${edgeData.index || 'Unbekannt'}</p>
                <p><strong>Geometrie:</strong> ${edgeObject.geometry?.type || 'Unbekannt'}</p>
            `
        };
    }
    
    /**
     * Zeigt Context Menu an
     */
    showContextMenu(object, event) {
        // Context Menu Implementierung - spaeter
    }
    
    /**
     * Setzt Interaction Mode
     */
    setMode(mode) {
        if (Object.values(this.modes).includes(mode)) {
            this.currentMode = mode;
            this.stateManager.setCurrentTool(mode);
        }
    }
    
    /**
     * Aktiviert/Deaktiviert Interaktionen
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        this.stateManager.setInteractionEnabled(enabled);
    }
    
    /**
     * Debug-Informationen
     */
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            currentMode: this.currentMode,
            isDragging: this.isDragging,
            dragStartPosition: this.dragStartPosition,
            lastInteractionTime: this.lastInteractionTime,
            infoPanelVisible: this.stateManager.state.infoPanelVisible,
            selectedObject: this.stateManager.state.selectedObject?.userData?.type || null,
            hoveredObject: this.stateManager.state.hoveredObject?.userData?.type || null
        };
    }
    
    /**
     * Cleanup
     */
    destroy() {
        // Event-Subscriptions werden automatisch durch CentralEventManager bereinigt
        this.hideInfoPanel();
        this.hideTooltip();
        
    }
}
