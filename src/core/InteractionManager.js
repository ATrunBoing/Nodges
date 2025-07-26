/**
 * InteractionManager - Unified Interaction System
 * Verwaltet alle Benutzerinteraktionen (Hover, Click, Selection, etc.)
 * Arbeitet mit CentralEventManager und StateManager zusammen
 */

export class InteractionManager {
    constructor(centralEventManager, stateManager, highlightManager) {
        this.eventManager = centralEventManager;
        this.stateManager = stateManager;
        this.highlightManager = highlightManager;
        
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
        
        console.log('[InteractionManager] Initialisiert');
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
        this.infoPanelElement = document.getElementById('infoPanel');
        this.infoPanelTitle = document.getElementById('infoPanelTitle');
        this.infoPanelContent = document.getElementById('infoPanelContent');
        
        if (!this.infoPanelElement) {
            console.warn('[InteractionManager] Info Panel nicht gefunden');
        }
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
            
            console.log('[InteractionManager] Hover Start:', object.userData?.type || 'unknown');
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
            
            console.log('[InteractionManager] Hover End:', object.userData?.type || 'unknown');
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
        
        console.log('[InteractionManager] Click:', clickedObject?.userData?.type || 'background');
    }
    
    /**
     * Handler fuer Double-Click Events
     */
    handleDoubleClick(data) {
        if (!this.isEnabled) return;
        
        const { clickedObject } = data;
        
        if (clickedObject) {
            this.focusOnObject(clickedObject);
            console.log('[InteractionManager] Double-Click Focus:', clickedObject.userData?.type || 'unknown');
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
                console.log('[InteractionManager] Drag detected');
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
        
        console.log('[InteractionManager] Context Menu:', clickedObject?.userData?.type || 'background');
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
        
        console.log('[InteractionManager] Object selected:', object.userData?.type || 'unknown');
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
        this.hideInfoPanel();
        
        console.log('[InteractionManager] All deselected');
    }
    
    /**
     * Fokussiert auf ein Objekt (Kamera-Bewegung)
     */
    focusOnObject(object) {
        // Diese Funktionalitaet wird spaeter implementiert
        // Benoetigt Zugriff auf Camera und Controls
        console.log('[InteractionManager] Focus on object:', object.userData?.type || 'unknown');
    }
    
    /**
     * Loescht selektierte Objekte
     */
    deleteSelected() {
        const selectedObject = this.stateManager.state.selectedObject;
        if (selectedObject) {
            // Diese Funktionalitaet wird spaeter implementiert
            console.log('[InteractionManager] Delete selected:', selectedObject.userData?.type || 'unknown');
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
        if (!this.infoPanelElement || !object) return;
        
        const content = this.generateInfoPanelContent(object);
        
        if (this.infoPanelTitle) {
            this.infoPanelTitle.textContent = content.title;
        }
        
        if (this.infoPanelContent) {
            this.infoPanelContent.innerHTML = content.html;
        }
        
        // Panel anzeigen
        this.infoPanelElement.style.display = 'block';
        this.infoPanelElement.classList.remove('collapsed');
        
        // StateManager benachrichtigen
        this.stateManager.showInfoPanel();
        
        console.log('[InteractionManager] Info Panel shown for:', object.userData?.type || 'unknown');
    }
    
    /**
     * Versteckt Info Panel
     */
    hideInfoPanel() {
        if (this.infoPanelElement) {
            this.infoPanelElement.style.display = 'none';
        }
        
        this.stateManager.hideInfoPanel();
        
        console.log('[InteractionManager] Info Panel hidden');
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
        
        return {
            title: name,
            html: `
                <p><strong>Typ:</strong> Kante</p>
                <p><strong>Verbindung:</strong> ${edgeData.start || 'Unbekannt'} <-> ${edgeData.end || 'Unbekannt'}</p>
                <p><strong>Offset:</strong> ${edgeData.offset || 0}</p>
            `
        };
    }
    
    /**
     * Zeigt Context Menu an
     */
    showContextMenu(object, event) {
        // Context Menu Implementierung - spaeter
        console.log('[InteractionManager] Context Menu fuer:', object.userData?.type || 'unknown');
    }
    
    /**
     * Setzt Interaction Mode
     */
    setMode(mode) {
        if (Object.values(this.modes).includes(mode)) {
            this.currentMode = mode;
            this.stateManager.setCurrentTool(mode);
            console.log('[InteractionManager] Mode changed to:', mode);
        }
    }
    
    /**
     * Aktiviert/Deaktiviert Interaktionen
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        this.stateManager.setInteractionEnabled(enabled);
        console.log('[InteractionManager] Enabled:', enabled);
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
        
        console.log('[InteractionManager] Cleanup abgeschlossen');
    }
}