/**
 * UIManager - Manages all HTML UI components and interactions.
 * This class encapsulates all logic for panels, buttons, and other UI elements.
 */
export class UIManager {
    constructor(app) {
        this.app = app;
        this.stateManager = app.stateManager;

        this.panels = {
            fileInfo: document.getElementById('fileInfoPanel'),
            file: document.getElementById('filePanel'),
            info: document.getElementById('infoPanel'),
            dev: document.getElementById('devPanel'),
            layout: null // Initialized by LayoutGUI
        };

        this.panelToggles = {
            fileInfo: document.getElementById('fileInfoToggle'),
            file: document.getElementById('filePanelToggle'),
            info: document.getElementById('infoPanelToggle'),
            dev: document.getElementById('devPanelToggle')
        };

        this.filePanelContent = document.getElementById('filePanelContent');
        this.infoPanelContent = document.getElementById('infoPanelContent');

        this.stateManager.subscribe(this.handleStateChange.bind(this), 'ui');
    }

    init() {
        console.log('Initializing UIManager...');
        this.initPanelToggling();
        this.initPanelPositioning();
        this.initHighlightToggle();
        this.loadAvailableFiles();
        // The search panel is initialized in main.js, this could also be moved here later.
    }

    handleStateChange(state) {
        // Handle changes related to UI, e.g., showing/hiding panels based on selected objects.
        if (state.selectedObject) {
            this.showInfoPanelFor(state.selectedObject);
        } else {
            this.collapseInfoPanel();
        }

        document.body.style.cursor = state.hoveredObject ? 'pointer' : 'default';
    }

    initPanelToggling() {
        for (const panelName in this.panelToggles) {
            const toggle = this.panelToggles[panelName];
            const panel = this.panels[panelName];
            if (toggle && panel) {
                toggle.addEventListener('click', () => {
                    panel.classList.toggle('collapsed');
                    toggle.innerHTML = panel.classList.contains('collapsed') ? '>' : 'v';
                    // After a toggle, panel positions might need to be recalculated.
                    setTimeout(() => this.updateAllPanelPositions(), 350);
                });

                // Add hover effects
                toggle.addEventListener('mouseenter', () => toggle.style.backgroundColor = 'rgba(128, 128, 128, 0.2)');
                toggle.addEventListener('mouseleave', () => toggle.style.backgroundColor = 'transparent');
            }
        }
    }

    initPanelPositioning() {
        // Initial positioning
        this.updateAllPanelPositions();

        // Update on window resize
        window.addEventListener('resize', () => this.updateAllPanelPositions());

        // Use observers to detect changes in panel sizes (e.g., when content is added)
        const fileInfoPanel = this.panels.fileInfo;
        if (fileInfoPanel) {
            const observer = new ResizeObserver(() => this.updateAllPanelPositions());
            observer.observe(fileInfoPanel);
        }

        // We need to wait for LayoutGUI to create the layout panel, then observe it.
        const checkForLayoutPanel = setInterval(() => {
            const layoutPanel = document.getElementById('layoutPanel');
            if (layoutPanel) {
                this.panels.layout = layoutPanel;
                clearInterval(checkForLayoutPanel);
                const observer = new ResizeObserver(() => this.updateAllPanelPositions());
                observer.observe(layoutPanel);
                this.updateAllPanelPositions();
            }
        }, 500);
    }

    updateAllPanelPositions() {
        if (this.panels.fileInfo && this.panels.file) {
            const fileInfoRect = this.panels.fileInfo.getBoundingClientRect();
            this.panels.file.style.top = `${fileInfoRect.bottom + 10}px`;
        }

        const positioningElement = this.panels.layout || this.panels.file;
        if (positioningElement && this.panels.info) {
             const rect = positioningElement.getBoundingClientRect();
             this.panels.info.style.top = `${rect.bottom + 10}px`;
        }

        if (this.panels.info && this.panels.dev) {
            const infoRect = this.panels.info.getBoundingClientRect();
            this.panels.dev.style.top = `${infoRect.bottom + 10}px`;
        }
    }

    initHighlightToggle() {
        const highlightToggleInput = document.getElementById('highlightToggleInput');
        if (highlightToggleInput) {
            // Set initial state from StateManager
            highlightToggleInput.checked = this.stateManager.state.highlightEffectsEnabled;
            this.updateHighlightToggleVisuals(highlightToggleInput.checked);

            // Listen for changes
            highlightToggleInput.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                this.updateHighlightToggleVisuals(isEnabled);
                this.stateManager.update({ highlightEffectsEnabled: isEnabled });
            });
        }
    }

    updateHighlightToggleVisuals(isEnabled) {
        const slider = document.getElementById('highlightToggleSlider');
        const button = document.getElementById('highlightToggleButton');
        if (slider && button) {
            if (isEnabled) {
                slider.style.backgroundColor = '#4CAF50';
                button.style.transform = 'translateX(16px)';
            } else {
                slider.style.backgroundColor = '#ccc';
                button.style.transform = 'translateX(0px)';
            }
        }
    }

    async loadAvailableFiles() {
        if (!this.filePanelContent) return;

        this.filePanelContent.innerHTML = '<div id="fileLoadingIndicator">Loading files...</div>';
        const files = await this.fetchDirectoryContents();
        this.createFileButtons(files);
        // Refresh button could be added here if desired
    }

    async fetchDirectoryContents() {
        // This is a static list, as client-side JS can't read directories.
        // It's the same hardcoded list from index.html.
        return [
            'EXAMPLE_BAUEINGABE_SYSTEM', 'future_format_example', 'ikosaeder',
            'large', 'medium', 'mega', 'small', 'us_legal_system_actors', 'us_political_system'
        ];
    }

    createFileButtons(filenames) {
        if (!this.filePanelContent) return;

        this.filePanelContent.innerHTML = '';
        if (filenames.length === 0) {
            this.filePanelContent.innerHTML = '<div style="padding: 10px; text-align: center; color: #999;">No files found</div>';
            return;
        }

        filenames.forEach(filename => {
            const button = document.createElement('div');
            button.className = 'file-item';
            button.textContent = this.createDisplayName(filename);

            button.onclick = (event) => {
                // Remove active class from all other buttons
                document.querySelectorAll('.file-item.active').forEach(item => item.classList.remove('active'));
                // Add active class to clicked button
                event.target.classList.add('active');
                // Load data
                this.app.loadData(`data/${filename}.json`);
            };

            this.filePanelContent.appendChild(button);
        });
    }

    createDisplayName(filename) {
        const nameMap = {
            'small': 'Small Network', 'medium': 'Medium Network', 'large': 'Large Network',
            'mega': 'Mega Network', 'family': 'Family Tree', 'architektur': 'Architecture',
            'royal_family': 'Royal Family', 'us_legal_system_actors': 'US Legal System'
        };
        return nameMap[filename] || filename.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // --- Public API for main.js ---

    updateFileInfo(filename, nodeCount, edgeCount, bounds) {
       document.getElementById('fileFilename').textContent = `Dateiname: ${filename}`;
       document.getElementById('fileNodeCount').textContent = `Anzahl Knoten: ${nodeCount}`;
       document.getElementById('fileEdgeCount').textContent = `Anzahl Kanten: ${edgeCount}`;
       if (bounds) {
           document.getElementById('fileXAxis').textContent = `X-Achse: ${bounds.x.min.toFixed(2)} bis ${bounds.x.max.toFixed(2)}`;
           document.getElementById('fileYAxis').textContent = `Y-Achse: ${bounds.y.min.toFixed(2)} bis ${bounds.y.max.toFixed(2)}`;
           document.getElementById('fileZAxis').textContent = `Z-Achse: ${bounds.z.min.toFixed(2)} bis ${bounds.z.max.toFixed(2)}`;
       }
    }

    updateFps(fps) {
        const fpsElement = document.getElementById('fileFPS');
        if (fpsElement) {
            fpsElement.textContent = `FPS: ${fps}`;
        }
    }

    // --- New API Methods ---

    showNodeDetails(nodeData) {
        if (!this.panels.info || !this.infoPanelContent) return;

        const geometryInfo = this.app.nodeObjectsManager.getNodeTypeInfo(nodeData.geometryType);
        const content = `
            <p><strong>Typ:</strong> Node</p>
            <p><strong>Name:</strong> ${nodeData.name || 'Unbenannt'}</p>
            <p><strong>ID:</strong> ${nodeData.id || 'Unbekannt'}</p>
            <p><strong>Geometrie:</strong> ${geometryInfo.name} (${geometryInfo.faces} Flächen)</p>
            <p><strong>Position:</strong> (${nodeData.x.toFixed(2)}, ${nodeData.y.toFixed(2)}, ${nodeData.z.toFixed(2)})</p>
        `;

        this.infoPanelContent.innerHTML = content;
        this.panels.info.classList.remove('collapsed');
        this.panelToggles.info.innerHTML = 'v';
    }

    showEdgeDetails(edgeData) {
        if (!this.panels.info || !this.infoPanelContent) return;

        const content = `
            <p><strong>Typ:</strong> Edge</p>
            <p><strong>Name:</strong> ${edgeData.name || 'Unbenannt'}</p>
            <p><strong>Verbindung:</strong> Knoten ${edgeData.start} ↔ Knoten ${edgeData.end}</p>
            <p><strong>Index:</strong> ${edgeData.index || 'Unbekannt'}</p>
        `;

        this.infoPanelContent.innerHTML = content;
        this.panels.info.classList.remove('collapsed');
        this.panelToggles.info.innerHTML = 'v';
    }

    hideDetails() {
        if (!this.panels.info) return;
        this.panels.info.classList.add('collapsed');
        this.panelToggles.info.innerHTML = '>';
        this.infoPanelContent.innerHTML = '<p>Kein Objekt ausgewählt</p>';
    }

    showInfoPanelFor(object) {
        if (!this.panels.info || !this.infoPanelContent) return;

        let content = '';
        if (object.userData.type === 'node') {
            const { nodeData, geometryType } = object.userData;
            const geometryInfo = this.app.nodeObjectsManager.getNodeTypeInfo(geometryType);
            content = `
                <p><strong>Typ:</strong> Node</p>
                <p><strong>Name:</strong> ${nodeData.name || 'Unbenannt'}</p>
                <p><strong>ID:</strong> ${nodeData.id || 'Unbekannt'}</p>
                <p><strong>Geometrie:</strong> ${geometryInfo.name} (${geometryInfo.faces} Flächen)</p>
            `;
        } else if (object.userData.type === 'edge') {
            const { name, start, end, index } = object.userData;
            content = `
                <p><strong>Typ:</strong> Edge</p>
                <p><strong>Name:</strong> ${name || 'Unbenannt'}</p>
                <p><strong>Verbindung:</strong> Knoten ${start} ↔ Knoten ${end}</p>
                <p><strong>Index:</strong> ${index || 'Unbekannt'}</p>
            `;
        } else {
             content = '<p>Keine Detailansicht für dieses Objekt.</p>';
        }

        this.infoPanelContent.innerHTML = content;
        this.panels.info.classList.remove('collapsed');
        this.panelToggles.info.innerHTML = 'v';
    }

    collapseInfoPanel() {
        if (!this.panels.info) return;
        this.panels.info.classList.add('collapsed');
        this.panelToggles.info.innerHTML = '>';
        this.infoPanelContent.innerHTML = '<p>Kein Objekt ausgewählt</p>';
    }
}
