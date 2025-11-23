/**
 * Nodges - Main Application
 * 3D Netzwerkvisualisierung mit Caching
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Kernsystem
import { StateManager } from './src/core/StateManager.js';
import { CentralEventManager } from './src/core/CentralEventManager.js';
import { InteractionManager } from './src/core/InteractionManager.js';
import { LayoutManager } from './src/core/LayoutManager.js';
import { UIManager } from './src/core/UIManager.js';
// Utilities
import { SelectionManager } from './src/utils/SelectionManager.js';
import { RaycastManager } from './src/utils/RaycastManager.js';
import { NetworkAnalyzer } from './src/utils/NetworkAnalyzer.js';
import { PathFinder } from './src/utils/PathFinder.js';
import { PerformanceOptimizer } from './src/utils/PerformanceOptimizer.js';
import { FPSMonitor } from './src/utils/FPSMonitor.js';
import { FileHandler } from './src/utils/FileHandler.js';
import { ImportManager } from './src/utils/ImportManager.js';
import { ExportManager } from './src/utils/ExportManager.js';
import { EdgeLabelManager } from './src/utils/EdgeLabelManager.js';
import { NeighborhoodHighlighter } from './src/utils/NeighborhoodHighlighter.js';
import { KeyboardShortcuts } from './src/utils/KeyboardShortcuts.js';
import { BatchOperations } from './src/utils/BatchOperations.js';
import { NodeGroupManager } from './src/utils/NodeGroupManager.js';
import { LayoutGUI } from './src/utils/LayoutGUI.js';
import { FutureDataParser } from './src/utils/FutureDataParser.js';

// Effekte
import { HighlightManager } from './src/effects/HighlightManager.js';
import { GlowEffect } from './src/effects/GlowEffect.js';

// Objekte
import { Node } from './objects/Node.js';
import { Edge } from './objects/Edge.js';
import { NodeObjects } from './objects/nodeObjects.js';

class NodgesApp {
    constructor() {
        console.log('Initialisiere Nodges');
        
        // Kernkomponenten
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Manager
        this.stateManager = new StateManager();
        this.centralEventManager = null;
        this.interactionManager = null;
        this.layoutManager = null;
        this.uiManager = null;
        this.eventManager = null;
        this.selectionManager = null;
        this.raycastManager = null;
        this.networkAnalyzer = null;
        this.pathFinder = null;
        this.performanceOptimizer = null;
        this.fpsMonitor = null;
        this.fileHandler = null;
        this.importManager = null;
        this.exportManager = null;
        this.edgeLabelManager = null;
        this.neighborhoodHighlighter = null;
        this.keyboardShortcuts = null;
        this.batchOperations = null;
        this.nodeGroupManager = null;
        this.layoutGUI = null;
        this.highlightManager = null;
        this.glowEffect = null;

        // Node Objects Manager für verschiedene Geometrien
        this.nodeObjectsManager = new NodeObjects();
        
        // Daten
        this.currentNodes = [];
        this.currentEdges = [];
        this.nodeObjects = [];
        this.edgeObjects = [];
        this.lastMouseMoveTime = 0;
        this.edgeType = 'tube'; // Standard: Gebogene Rhren
        
        // Performance-Cache fr Raycast-Operationen
        this.raycastObjectsCache = null;
        this.raycastCacheValid = false;
        
        // Zustand
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            await this.initThreeJS();
            await this.initManagers();
            // GUI vor Event-Listenern initialisieren
            await this.initGUI();
            await this.initEventListeners();
            // Default-Daten nach Event-Registrierung laden
            await this.loadDefaultData();
            
        this.isInitialized = true;
        console.log('Nodges erfolgreich initialisiert');
        
        // Zeige Versionsnummer nach einer kurzen Verzgerung
        setTimeout(() => {
            console.log('Version : 0.92.19');
        }, 100);
        
        this.animate();
        } catch (error) {
            console.error('Fehler bei der Initialisierung:', error);
        }
    }
    
    async initThreeJS() {
        // Szene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        
        // Kamera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(10, 10, 10);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        
        // Steuerung
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Beleuchtung
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        
        // Schattenkamera konfigurieren
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        directionalLight.shadow.camera.updateProjectionMatrix();
        
        this.scene.add(directionalLight);

        // Untergrund erstellen
        this.createGround();
        
        // Fenstergrennderung behandeln
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        console.log('Three.js initialisiert');
    }

    createGround() {
        // Geometrie fr Untergrund
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        
        // Material mit Textur
        const groundMaterial = new THREE.MeshLambertMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.8
        });

        // Mesh erstellen
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -5;
        this.ground.receiveShadow = true;
        this.ground.name = 'ground';

        this.scene.add(this.ground);

        // Hilfsgitter fr Orientierung
        this.createGridLines();

        console.log('Untergrund erstellt');
    }

    createGridLines() {
        const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
        gridHelper.position.y = -4.9;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.3;
        this.scene.add(gridHelper);
    }
    
    async initManagers() {
        try {
            // Kern-Manager
            this.layoutManager = new LayoutManager();
        this.glowEffect = new GlowEffect();
        this.highlightManager = new HighlightManager(this.stateManager, this.glowEffect);
        
        // UI Manager is now self-contained and gets the app instance
        this.uiManager = new UIManager(this);
        
        
        // Unified Event System
        this.centralEventManager = new CentralEventManager(this.scene, this.camera, this.renderer, this.stateManager);
        
        // Interaktionsmanager nach Highlightmanager
        this.interactionManager = new InteractionManager(
            this.centralEventManager,
            this.stateManager,
            this.highlightManager,
                this.camera,
                this.controls,
                this.scene
            );
            
            // Hilfsmanager
            this.selectionManager = new SelectionManager(this.scene, this.camera, this.renderer, this.stateManager);
            this.raycastManager = new RaycastManager(this.camera, this.scene);
            this.networkAnalyzer = new NetworkAnalyzer();
            this.pathFinder = new PathFinder(this.scene, this.stateManager);
            this.performanceOptimizer = new PerformanceOptimizer(this.scene, this.camera, this.renderer);
            // FPSMonitor deaktiviert - Anzeige erfolgt im Datei-Info-Panel
            this.fpsMonitor = null;
            this.fileHandler = new FileHandler();
            this.importManager = new ImportManager();
            this.exportManager = new ExportManager();
            this.edgeLabelManager = new EdgeLabelManager(this.scene, this.camera);
            this.neighborhoodHighlighter = new NeighborhoodHighlighter();
            this.keyboardShortcuts = new KeyboardShortcuts();
            this.batchOperations = new BatchOperations();
            this.nodeGroupManager = new NodeGroupManager();
            
            console.log('Managersystem initialisiert');
        } catch (error) {
            console.error('Fehler bei Manager-Initialisierung:', error);
            throw error;
        }
    }
    
    async initGUI() {
        this.layoutGUI = new LayoutGUI(this.layoutManager, document.body);
        this.uiManager.init();
        this.initSearchPanel(); // TODO: Move to UIManager
        console.log('GUI-System initialisiert');
    }
    
    initSearchPanel() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        
        if (searchInput && searchButton) {
            searchButton.addEventListener('click', () => {
                this.performSearch(searchInput.value);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(searchInput.value);
                }
            });
        }
    }
    
    async initEventListeners() {
        // Note: Event listeners for data loading buttons are now handled dynamically inside UIManager.
        // The old static button listeners are no longer needed.
        console.log('Event-Listener for main app are initialized.');
    }
    
    async loadDefaultData() {
        await this.loadData('data/small.json');
    }
    
    async loadData(url) {
        try {
            //console.log(`[DEBUG] loadData called with URL: ${url}`);
            // Kamera automatisch auf Netzwerk ausrichten
            this.fitCameraToScene();
            
            // Sicherstellen, dass der Pfad korrekt ist
            const correctedUrl = url.includes('data/') ? url : `data/${url}`;
            //console.log(`[DEBUG] Corrected URL: ${correctedUrl}`);
            
            //console.log(`[DEBUG] Starting fetch...`);
            const response = await fetch(correctedUrl);
            //console.log(`[DEBUG] Fetch response status: ${response.status}`);
            if (!response.ok) throw new Error(`HTTP-Fehler! Status: ${response.status}`);
            
            const data = await response.json();
           
            this.clearScene();
            
            // Future Format Adapter - convert entities/relationships to nodes/edges
            if (data.data && data.data.entities) {
                //console.log('[DEBUG] Future Format detected - using FutureDataParser');
                const parser = new FutureDataParser();
                const parsedData = await parser.parseData(data);

                this.currentNodes = parsedData.entities.map(entity => ({
                    id: entity.id,
                    name: entity.label,
                    x: entity.properties.position?.x || 0,
                    y: entity.properties.position?.y || 0,
                    z: entity.properties.position?.z || 0,
                    type: entity.type,
                    originalData: entity
                }));

                this.currentEdges = parsedData.relationships.map(rel => ({
                    start: this.currentNodes.findIndex(node => node.id === rel.source),
                    end: this.currentNodes.findIndex(node => node.id === rel.target),
                    name: rel.label,
                    type: rel.type,
                    originalData: rel
                }));

                //console.log('[DEBUG] Future nodes count:', this.currentNodes.length);
                //console.log('[DEBUG] Future edges count:', this.currentEdges.length);
            } else {
                //console.log('[DEBUG] Standard Format detected');
                // Standard Format (z.B. us_legal_system_actors.json oder small.json)
                this.currentNodes = data.nodes || [];
                
                // Wenn Knoten keine IDs haben, füge sie hinzu (für alte Dateien)
                this.currentNodes.forEach((node, index) => {
                    if (!node.id) {
                        node.id = `node${index}`;
                    }
                });
                
                // Erstelle eine Map von Knoten-IDs zu Indizes für schnelle Suche
                const nodeIndexMap = new Map();
                this.currentNodes.forEach((node, index) => {
                    nodeIndexMap.set(node.id, index);
                });
                
            // Konvertiere Kanten vom source/target Format zum start/end Format
            this.currentEdges = (data.edges || []).map(edge => {
                const start = nodeIndexMap.get(edge.source);
                const end = nodeIndexMap.get(edge.target);
                
                // Validierung der Knotenindizes
                if (start === undefined || end === undefined) {
                    console.warn(`Ungltige Kante: Knoten ${edge.source} oder ${edge.target} nicht gefunden`);
                    return null;
                }
                
                return {
                    start: start,
                    end: end,
                    name: edge.relationship || edge.label || edge.name || 'Unbenannte Kante',
                    type: edge.type || 'Beziehung',
                    originalData: edge
                };
            }).filter(edge => edge !== null); // Entferne ungltige Kanten
                
                //console.log('[DEBUG] Standard nodes count:', this.currentNodes.length);
                //console.log('[DEBUG] Standard edges count:', this.currentEdges.length);
            }
            
            await this.createNodes();
            await this.createEdges();
            
            // Layout nur anwenden, wenn nicht deaktiviert und Knoten noch nicht positioniert sind
            const nodesHavePositions = this.currentNodes.some(node => 
                typeof node.x === 'number' && typeof node.y === 'number' && typeof node.z === 'number'
            );
            
            if (this.stateManager.state.layoutEnabled && !nodesHavePositions) {
                await this.layoutManager.applyLayout('force-directed', this.currentNodes, this.currentEdges);
                this.updateNodePositions();
                //console.log('Layout erfolgreich angewendet');
            } else if (this.stateManager.state.layoutEnabled && nodesHavePositions) {
                // Wenn Knoten bereits Positionen haben, aktualisiere nur die Positionen
                this.updateNodePositions();
            } else {
                //console.log('Layout-Anwendung bersprungen (deaktiviert)');
            }
            
            this.uiManager.updateFileInfo(
                url.split('/').pop(),
                this.currentNodes.length,
                this.currentEdges.length,
                this.calculateBounds()
            );
            
            if (this.networkAnalyzer) {
                this.networkAnalyzer.initialize(this.currentNodes, this.currentEdges);
            }
            
            console.log(`Netzwerk geladen: ${this.currentNodes.length} Knoten, ${this.currentEdges.length} Kanten`);
        } catch (error) {
            console.error('Fehler beim Laden der Daten:', error);
        }
    }
    
    clearScene() {
        this.nodeObjects.forEach(node => {
            if (node.mesh) {
                this.scene.remove(node.mesh);
                node.mesh.geometry?.dispose();
                node.mesh.material?.dispose();
            }
        });
        
        this.edgeObjects.forEach(edge => {
            if (edge.line || edge.tube) {
                this.scene.remove(edge.line || edge.tube);
                (edge.line || edge.tube).geometry?.dispose();
                (edge.line || edge.tube).material?.dispose();
            }
        });
        
        if (typeof Edge !== 'undefined' && Edge.clearCache) {
            Edge.clearCache();
        }
        
        this.nodeObjects = [];
        this.edgeObjects = [];
    }
    
    async createNodes() {
        // Prüfe, ob Knoten Positionen haben, wenn nicht, wende Layout an
        const nodesHavePositions = this.currentNodes.some(node =>
            typeof node.x === 'number' && typeof node.y === 'number' && typeof node.z === 'number'
        );

        if (!nodesHavePositions && this.layoutManager && this.stateManager.state.layoutEnabled) {
            // Stelle sicher, dass alle Knoten eine eindeutige ID haben
            this.currentNodes.forEach((node, index) => {
                if (!node.id) {
                    node.id = `node_${index}`;
                }
            });

            // Wende Layout an, um Positionen zu berechnen
            await this.layoutManager.applyLayout('force-directed', this.currentNodes, this.currentEdges);
        }

        // Hole alle verfügbaren Node-Geometrien
        const availableTypes = this.nodeObjectsManager.getAvailableTypes();
        console.log(`Verfügbare Node-Geometrien: ${availableTypes.join(', ')}`);

        this.nodeObjects = this.currentNodes.map((node, index) => {
            // Setze Standardpositionen, wenn keine vorhanden sind
            const x = typeof node.x === 'number' ? node.x : 0;
            const y = typeof node.y === 'number' ? node.y : 0;
            const z = typeof node.z === 'number' ? node.z : 0;

            // Wähle Geometrie basierend auf Node-Index (zyklisch durch alle verfügbaren Typen)
            const geometryIndex = index % availableTypes.length;
            const geometryType = availableTypes[geometryIndex];

            // Bestimme Farbe basierend auf Node-Typ oder verwende Standardfarbe
            let nodeColor = 0x3498db; // Standard: Blau
            if (node.type) {
                // Verschiedene Farben für verschiedene Node-Typen
                const colorMap = {
                    'person': 0x3498db,      // Blau
                    'organization': 0xe74c3c, // Rot
                    'location': 0x2ecc71,    // Grün
                    'event': 0xf39c12,       // Orange
                    'resource': 0x9b59b6,    // Lila
                    'process': 0x1abc9c,     // Türkis
                    'system': 0xe67e22,      // Dunkelorange
                    'data': 0x34495e        // Dunkelblau
                };
                nodeColor = colorMap[node.type] || nodeColor;
            }

            // Erstelle Node-Mesh mit verschiedenen Geometrien
            const nodeMesh = this.nodeObjectsManager.createNodeMesh(geometryType, {
                size: 1.0,
                color: nodeColor,
                position: new THREE.Vector3(x, y, z),
                materialType: 'phong'
            });

            // Zusätzliche userData für Interaktion
            nodeMesh.userData.nodeData = node;
            nodeMesh.userData.nodeIndex = index;
            nodeMesh.userData.geometryType = geometryType;

            // Füge zur Szene hinzu
            this.scene.add(nodeMesh);

            console.log(`Node ${index} (${node.name || `Node ${index}`}) erstellt als ${geometryType} an Position (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`);

            return {
                index: index,
                position: new THREE.Vector3(x, y, z),
                mesh: nodeMesh,
                geometryType: geometryType,
                nodeData: node
            };
        });

        console.log(`${this.currentNodes.length} Knoten mit verschiedenen Geometrien erstellt`);
        console.log(`Verwendete Geometrien: ${[...new Set(this.nodeObjects.map(obj => obj.geometryType))].join(', ')}`);
    }
    
    updateNodePositions() {
        this.currentNodes.forEach((node, i) => {
            if (this.nodeObjects[i]) {
                this.nodeObjects[i].position.set(node.x, node.y, node.z);
                if (this.nodeObjects[i].mesh) {
                    this.nodeObjects[i].mesh.position.set(node.x, node.y, node.z);
                }
            }
        });
        
        // Aktualisiere alle Kantenpositionen
        this.edgeObjects.forEach(edge => {
            if (edge.options && edge.options.start !== undefined && edge.options.end !== undefined) {
                const startNode = this.nodeObjects[edge.options.start];
                const endNode = this.nodeObjects[edge.options.end];
                
                if (startNode && endNode && edge.updatePositions) {
                    edge.updatePositions(startNode.position, endNode.position, 0.2, 0.2);
                }
            }
        });
    }
    
    async createEdges() {
        if (this.edgeType === 'tube') {
            await this.createTubeEdges();
        } else {
            await this.createLineEdges();
        }
        
       
      
    }
    
    async createLineEdges() {
        const totalEdges = this.currentEdges.length;
        //console.log(`[DEBUG] Start edge creation for ${totalEdges} edges`);
        //console.log(`[DEBUG] Node objects available: ${this.nodeObjects.length}`);
        
        // Debug node object availability
        this.nodeObjects.forEach((node, i) => {
          //  console.log(`[DEBUG] Node ${i}: ${node.position.x},${node.position.y},${node.position.z}`);
        });
        
        const startTime = performance.now();
        let geometryCacheHits = 0;
        let geometryCacheMisses = 0;
        let materialCacheHits = 0;
        let materialCacheMisses = 0;
        
        this.currentEdges.forEach((edgeData, index) => {
            // Sicherstellen, dass die Knotenindizes gltig sind
            if (edgeData.start >= 0 && edgeData.start < this.nodeObjects.length && 
                edgeData.end >= 0 && edgeData.end < this.nodeObjects.length) {
                
                const startNode = this.nodeObjects[edgeData.start];
                const endNode = this.nodeObjects[edgeData.end];
                
                const geoCacheSizeBefore = Edge.geometryCache ? Edge.geometryCache.size : 0;
                const matCacheSizeBefore = Edge.materialCache ? Edge.materialCache.size : 0;
                
                const edge = new Edge(startNode.position, endNode.position, 0.2, 0.2, {
                    ...edgeData,
                    name: edgeData.name || 'Kante ' + index,
                    totalEdges: totalEdges
                });
                
                const geoCacheSizeAfter = Edge.geometryCache ? Edge.geometryCache.size : 0;
                const matCacheSizeAfter = Edge.materialCache ? Edge.materialCache.size : 0;
                
                if (geoCacheSizeAfter > geoCacheSizeBefore) geometryCacheMisses++;
                else geometryCacheHits++;
                
                if (matCacheSizeAfter > matCacheSizeBefore) materialCacheMisses++;
                else materialCacheHits++;
                
                if (edge.line) {
                    this.scene.add(edge.line);
                    this.edgeObjects.push(edge);
                  //  console.log(`Kante ${index} zwischen Knoten ${edgeData.start} und ${edgeData.end} erstellt`);
                }
            } else {
                console.warn(`Ungltige Kante ${index}: Knoten ${edgeData.start} oder ${edgeData.end} existiert nicht`);
            }
        });
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        //console.log(`[Performance] Kantenerstellung abgeschlossen in ${duration.toFixed(2)}ms`);
        //console.log(`Erstellte Kanten: ${this.edgeObjects.length}/${totalEdges}`);
    }
    
    async createTubeEdges() {
        const { Edge } = await import('./objects/Edge.js');
        const totalEdges = this.currentEdges.length;
        //console.log(`[DEBUG] Start tube edge creation for ${totalEdges} edges`);
        
        // Zählen der Kanten zwischen denselben Knoten
        const edgeCountMap = new Map();
        this.currentEdges.forEach((edgeData, index) => {
            // Validierung der Knotenindizes
            if (edgeData.start === undefined || edgeData.end === undefined) {
                console.warn(`[DEBUG] Ungltige Rhren-Kante ${index}: Start oder Endknoten ist undefined`);
                return;
            }
            
            if (edgeData.start < 0 || edgeData.start >= this.nodeObjects.length || 
                edgeData.end < 0 || edgeData.end >= this.nodeObjects.length) {
                console.warn(`[DEBUG] Ungltige Rhren-Kante ${index}: Knoten ${edgeData.start} oder ${edgeData.end} existiert nicht`);
                return;
            }
            
            // Erstelle einen eindeutigen Schlüssel für das Knotenpaar (unabhängig von Richtung)
            const key = edgeData.start < edgeData.end ? 
                `${edgeData.start}-${edgeData.end}` : 
                `${edgeData.end}-${edgeData.start}`;
                
            if (!edgeCountMap.has(key)) {
                edgeCountMap.set(key, 0);
            }
            edgeCountMap.set(key, edgeCountMap.get(key) + 1);
        });
        
        this.currentEdges.forEach((edgeData, index) => {
            // Validierung der Knotenindizes
            if (edgeData.start === undefined || edgeData.end === undefined) {
                console.warn(`[DEBUG] Ungltige Rhren-Kante ${index}: Start oder Endknoten ist undefined`);
                return;
            }
            
            if (edgeData.start >= 0 && edgeData.start < this.nodeObjects.length && 
                edgeData.end >= 0 && edgeData.end < this.nodeObjects.length) {
                
                const startNode = this.nodeObjects[edgeData.start];
                const endNode = this.nodeObjects[edgeData.end];
                
                // Erstelle einen eindeutigen Schlüssel für das Knotenpaar (unabhängig von Richtung)
                const key = edgeData.start < edgeData.end ? 
                    `${edgeData.start}-${edgeData.end}` : 
                    `${edgeData.end}-${edgeData.start}`;
                
                const edge = new Edge(
                    startNode.position,
                    endNode.position,
                    0.2,
                    0.2,
                    {
                        ...edgeData,
                        name: edgeData.name || 'Kante ' + index,
                        totalEdges: edgeCountMap.get(key) || 1,
                        index: index  // Fge den Index der aktuellen Kante hinzu
                    }
                );
                //console.log('Startposition:', startNode.position);
                //console.log(`[DEBUG] Erstelle Rhren-Kante ${index} zwischen Knoten ${edgeData.start} und ${edgeData.end}`);
                //console.log('Endposition:', endNode.position);
                /*console.log('Optionen:', {
                    start: edgeData.start,
                    end: edgeData.end,
                    totalEdges: totalEdges,
                    index: index
                });
                */
                if (edge.tube) {
                    // WICHTIG: userData NACH Edge-Erstellung setzen
                    edge.tube.userData = {
                        type: 'edge',
                        edge: edge,
                        name: edgeData.name || `Kante ${index}`,
                        start: edgeData.start,
                        end: edgeData.end,
                        index: index
                    };
                    
                    this.scene.add(edge.tube);
                    this.edgeObjects.push(edge);
                    //console.log(`Tube-Kante ${index} zwischen Knoten ${edgeData.start} und ${edgeData.end} erstellt`);
                    //console.log(`Tube userData:`, edge.tube.userData);
                }
            } else {
                console.warn(`[DEBUG] Ungltige Rhren-Kante ${index}: Knoten ${edgeData.start} oder ${edgeData.end} existiert nicht`);
            }
        });
    }
    
    
    calculateBounds() {
        const bounds = {
            x: { min: Infinity, max: -Infinity },
            y: { min: Infinity, max: -Infinity },
            z: { min: Infinity, max: -Infinity }
        };
        
        this.currentNodes.forEach(node => {
            bounds.x.min = Math.min(bounds.x.min, node.x);
            bounds.x.max = Math.max(bounds.x.max, node.x);
            bounds.y.min = Math.min(bounds.y.min, node.y);
            bounds.y.max = Math.max(bounds.y.max, node.y);
            bounds.z.min = Math.min(bounds.z.min, node.z);
            bounds.z.max = Math.max(bounds.z.max, node.z);
        });
        
        return bounds;
    }

    fitCameraToScene() {
        if (this.currentNodes.length === 0) return;
        
        const bounds = this.calculateBounds();
        const center = new THREE.Vector3(
            (bounds.x.min + bounds.x.max) / 2,
            (bounds.y.min + bounds.y.max) / 2,
            (bounds.z.min + bounds.z.max) / 2
        );
        
        const maxDimension = Math.max(
            bounds.x.max - bounds.x.min,
            bounds.y.max - bounds.y.min,
            bounds.z.max - bounds.z.min
        );
        
        // Berechne optimalen Kamera-Abstand basierend auf Netzwerkgre
        const fov = this.camera.fov * (Math.PI / 180);
        const distance = Math.abs(maxDimension / Math.sin(fov / 2));
        
        this.camera.position.set(
            center.x,
            center.y,
            center.z + distance * 1.5  // Abstand mit Puffer
        );
        this.camera.lookAt(center);
        this.controls.target.copy(center);
        this.controls.update();
    }
    
    performSearch(query) {
        if (!query.trim()) return;
        // Suchfunktionalitt deaktiviert
    }
    
    displaySearchResults(results) {
        // Suchfunktionalitt deaktiviert
    }
    
    focusOnNode(nodeData) {
        // Suchfunktionalitt deaktiviert
    }
    
    getConnectedEdges(nodeIndex) {
        const connectedEdges = [];
        this.currentEdges.forEach((edgeData, index) => {
            if (edgeData.start === nodeIndex || edgeData.end === nodeIndex) {
                connectedEdges.push({
                    name: edgeData.name || `Kante ${index}`,
                    start: edgeData.start,
                    end: edgeData.end,
                    index: index
                });
            }
        });
        return connectedEdges;
    }
    
    highlightEdge(edgeIndex, highlight) {
        const edgeObject = this.edgeObjects[edgeIndex];
        if (edgeObject && (edgeObject.line || edgeObject.tube)) {
            this.stateManager.setHoveredObject(highlight ? (edgeObject.line || edgeObject.tube) : null);
        }
    }
    
    selectEdge(edgeIndex) {
        const edgeObject = this.edgeObjects[edgeIndex];
        if (edgeObject && (edgeObject.line || edgeObject.tube)) {
            this.stateManager.setSelectedObject(edgeObject.line || edgeObject.tube);
            this.showInfoPanel(edgeObject.line || edgeObject.tube);
        }
    }
    
    highlightNode(nodeIndex, highlight) {
        const nodeObject = this.nodeObjects[nodeIndex];
        if (nodeObject && nodeObject.mesh) {
            this.stateManager.setHoveredObject(highlight ? nodeObject.mesh : null);
        }
    }
    
    selectNode(nodeIndex) {
        const nodeObject = this.nodeObjects[nodeIndex];
        if (nodeObject && nodeObject.mesh) {
            this.stateManager.setSelectedObject(nodeObject.mesh);
            this.showInfoPanel(nodeObject.mesh);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // FPS-Anzeige aktualisieren
        const now = performance.now();
        this.frameCount = (this.frameCount || 0) + 1;
        
        if (!this.lastFPSUpdate) this.lastFPSUpdate = now;
        if (now - this.lastFPSUpdate >= 1000) {
            const fps = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = now;
            
            // FPS-Anzeige wird vom UIManager gehandhabt
            if (this.uiManager) {
                this.uiManager.updateFps(fps);
            }
        }

        this.controls.update();
        if (window.TWEEN) window.TWEEN.update();
        if (this.stateManager) this.stateManager.animate();
        this.renderer.render(this.scene, this.camera);
    }
    
    // ffentliche API-Methoden
    getNodes() { return this.currentNodes; }
    getEdges() { return this.currentEdges; }
    getNodeObjects() { return this.nodeObjects; }
    getEdgeObjects() { return this.edgeObjects; }
    getScene() { return this.scene; }
    getCamera() { return this.camera; }
    getRenderer() { return this.renderer; }
    
    // Future Format Converter
    convertEntitiesToNodes(entities) {
        return entities.map((entity, index) => {
            let x = 0, y = 0, z = 0;
            if (entity.position) {
                x = entity.position.x || 0;
                y = entity.position.y || 0; 
                z = entity.position.z || 0;
            } else if (entity.properties && entity.properties.position) {
                x = entity.properties.position.x || 0;
                y = entity.properties.position.y || 0;
                z = entity.properties.position.z || 0;
            }
            
            return {
                id: entity.id || index,
                name: entity.label || entity.name || 'Entity ' + index,
                x: x,
                y: y, 
                z: z,
                type: entity.type,
                originalData: entity
            };
        });
    }
    
    convertRelationshipsToEdges(relationships) {
        return relationships.map((rel, index) => {
            const startIndex = this.currentNodes.findIndex(node => node.id === rel.source);
            const endIndex = this.currentNodes.findIndex(node => node.id === rel.target);
            
            return {
                start: startIndex >= 0 ? startIndex : 0,
                end: endIndex >= 0 ? endIndex : 0,
                name: rel.label || rel.name || 'Relationship ' + index,
                type: rel.type,
                originalData: rel
            };
        });
    }
    
}

// Dev-Optionen Event-Handler
function setupDevOptions(app) {
    const toggleStats = document.getElementById('toggleStats');
    const toggleOptimized = document.getElementById('toggleOptimized');
    
    if (toggleStats) {
        toggleStats.addEventListener('change', () => {
            app.updatePerformanceStats();
        });
    }
    
    if (toggleOptimized) {
        toggleOptimized.addEventListener('change', () => {
            //console.log('Optimized mode toggled:', toggleOptimized.checked);
            // Hier spter die Umschaltung zwischen normalem und optimiertem Modus implementieren
        });
    }
}

// Anwendung initialisieren
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        const app = new NodgesApp();
        window.nodgesApp = app;
        setupDevOptions(app);
    });
} else {
    console.error("Diese Anwendung muss im Browser ausgefhrt werden");
}

export { NodgesApp };

/**
 * Demonstriert Connect Interface Interaktionen
 */
async function demoConnectInterface() {
    console.log('\n🎛️ Connect Interface Demo...\n');
    
    const app = new NodgesApp();
    await app.loadData('data/examples/future_format_example.json');
    
    const connectInterface = app.interactionManager.connectInterface;
    
    // Verschiedene Mapping-Szenarien
    const scenarios = [
        {
            name: "Alter-basierte Visualisierung",
            mappings: {
                'entities': {
                    'person': {
                        'size': { enabled: true, source: 'age', function: 'linear', range: [0.5, 2.0] },
                        'color': { enabled: true, source: 'age', function: 'heatmap', palette: 'rainbow' }
                    }
                }
            }
        },
        {
            name: "Persönlichkeits-basierte Visualisierung",
            mappings: {
                'entities': {
                    'person': {
                        'size': { enabled: true, source: 'personality.extraversion', function: 'exponential' },
                        'color': { enabled: true, source: 'personality.openness', function: 'heatmap', palette: 'blue-red' },
                        'geometry': { enabled: true, source: 'personality.conscientiousness', function: 'sphereComplexity' }
                    }
                }
            }
        },
        {
            name: "Abteilungs-basierte Visualisierung",
            mappings: {
                'entities': {
                    'person': {
                        'color': { enabled: true, source: 'department', function: 'categorical' },
                        'size': { enabled: true, source: 'influence', function: 'linear', range: [1.0, 3.0] }
                    }
                }
            }
        }
    ];
    
    for (const scenario of scenarios) {
        console.log(` Scenario: ${scenario.name}`);
        
        // Mappings anwenden
        for (const [category, types] of Object.entries(scenario.mappings)) {
            for (const [type, mappings] of Object.entries(types)) {
                for (const [visualProp, mapping] of Object.entries(mappings)) {
                    app.interactionManager.connectInterface.updateMapping(category, type, visualProp, mapping);
                }
            }
        }
        
        // Visualisierung generieren
        const visualData = app.generateVisualizationData();
        
        // Erste Node analysieren
        const firstNode = visualData.nodes[0];
        console.log(`   📍 ${firstNode.name}: size=${firstNode.size}, color=${firstNode.color}`);
        
        console.log('');
    }
}

window.demoConnectInterface = demoConnectInterface;

/**
 * Demonstriert alle verfügbaren Node-Geometrien
 */
async function demoNodeGeometries() {
    console.log('\n🔺 Node-Geometrien Demo...\n');

    if (!window.nodgesApp) {
        console.error('Nodges App nicht verfügbar');
        return;
    }

    const app = window.nodgesApp;
    const availableTypes = app.nodeObjectsManager.getAvailableTypes();

    console.log(`Verfügbare Geometrien (${availableTypes.length}):`);
    availableTypes.forEach((type, index) => {
        const info = app.nodeObjectsManager.getNodeTypeInfo(type);
        console.log(`  ${index + 1}. ${info.name} (${info.faces} Flächen) - ${info.description}`);
    });

    console.log('\nErstelle Test-Netzwerk mit allen Geometrien...');

    // Erstelle ein Test-Netzwerk mit allen verfügbaren Geometrien
    const testNodes = availableTypes.map((type, index) => ({
        id: `test_${type}`,
        name: type.charAt(0).toUpperCase() + type.slice(1),
        x: (index % 5) * 1.5 - 3, // 5 Spalten
        y: Math.floor(index / 5) * 1.5 - 1, // Mehrere Reihen
        z: 0,
        type: 'test'
    }));

    // Erstelle einige Test-Kanten
    const testEdges = [];
    for (let i = 0; i < testNodes.length - 1; i++) {
        testEdges.push({
            start: i,
            end: i + 1,
            name: `Verbindung ${i}-${i + 1}`
        });
    }

    // Temporäre Daten setzen
    app.currentNodes = testNodes;
    app.currentEdges = testEdges;

    // Szene leeren und neu erstellen
    app.clearScene();
    await app.createNodes();
    await app.createEdges();

    console.log(`\n✅ Demo-Netzwerk erstellt mit ${testNodes.length} verschiedenen Geometrien!`);
    console.log('Klicke auf verschiedene Nodes, um ihre Eigenschaften im Info-Panel zu sehen.');

    // Kamera anpassen
    app.fitCameraToScene();
}

window.demoNodeGeometries = demoNodeGeometries;
