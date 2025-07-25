/**
 * KI-System-Generator fuer Nodges 0.88
 * Ermoeglicht die Generierung von Systemvisualisierungen durch externe KI
 */

export class AISystemGenerator {
    constructor(loadNetworkFromImportedData) {
        this.loadNetworkFromImportedData = loadNetworkFromImportedData;
        this.settings = {
            systemDescription: '',
            systemType: 'government', // government, business, healthcare, education
            jurisdiction: 'Schweiz',
            complexity: 'medium', // low, medium, high
            generationStatus: 'Bereit',
            lastGenerated: null
        };
    }

    /**
     * Generiert einen KI-Prompt basierend auf den aktuellen Einstellungen
     */
    generatePrompt() {
        if (!this.settings.systemDescription.trim()) {
            alert('Bitte geben Sie eine System-Beschreibung ein!');
            return;
        }
        
        const prompt = this.buildSystemPrompt();
        
        // Kopiere Prompt in Zwischenablage
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(prompt).then(() => {
                alert('Prompt in Zwischenablage kopiert!\n\nJetzt in externe KI einfuegen (ChatGPT, Claude, etc.) und JSON zurueckkopieren.');
                this.settings.generationStatus = 'Prompt kopiert - Warte auf KI...';
            }).catch(err => {
                console.error('Fehler beim Kopieren:', err);
                this.showPromptDialog(prompt);
            });
        } else {
            // Fallback fuer aeltere Browser
            this.showPromptDialog(prompt);
        }
    }

    /**
     * Erstellt den vollstaendigen System-Prompt fuer die KI
     */
    buildSystemPrompt() {
        const systemTypeDescriptions = {
            government: 'Behoerden-/Verwaltungsverfahren',
            business: 'Geschaeftsprozess',
            healthcare: 'Gesundheitswesen-Prozess',
            education: 'Bildungs-/Ausbildungsprozess'
        };

        const complexityDescriptions = {
            low: 'Einfach (5-10 Knoten, wenige Schritte)',
            medium: 'Mittel (10-20 Knoten, mehrere Ebenen)',
            high: 'Komplex (20+ Knoten, viele Abhaengigkeiten)'
        };

        const basePrompt = `Du bist ein Experte fuer die Visualisierung komplexer Systeme und Prozesse. 
Deine Aufgabe ist es, reale Systeme in Nodges-kompatible JSON-Strukturen zu uebersetzen.

SYSTEM-DETAILS:
System: ${this.settings.systemDescription}
Typ: ${systemTypeDescriptions[this.settings.systemType]}
Zustaendigkeit: ${this.settings.jurisdiction}
Komplexitaet: ${complexityDescriptions[this.settings.complexity]}

Erstelle ein vollstaendiges JSON mit folgender Struktur:

{
  "metadata": {
    "title": "Titel des Systems",
    "description": "Detaillierte Beschreibung",
    "type": "process",
    "jurisdiction": "Zustaendigkeitsbereich",
    "lastUpdated": "2025-01-01",
    "complexity": "medium"
  },
  "nodes": [
    {
      "id": "eindeutige_id",
      "name": "Anzeigename",
      "position": {"x": 0, "y": 0, "z": 0},
      "metadata": {
        "nodeType": "process|authority|document|decision",
        "type": "sphere|cube|cylinder",
        "color": "0x00cc66",
        "duration": 5,
        "jurisdiction": "Zustaendigkeitsbereich",
        "requirements": ["Liste", "von", "Anforderungen"]
      }
    }
  ],
  "edges": [
    {
      "source": "start_node_id",
      "target": "end_node_id",
      "type": "process|dependency|approval|document",
      "offset": 0,
      "condition": "Bedingung fuer diese Verbindung",
      "metadata": {
        "duration": 3,
        "requirements": ["Dokument1", "Dokument2"]
      }
    }
  ]
}

KOORDINATEN-SYSTEM fuer Typ "process":
- X-Achse: Zeitlicher Ablauf (frueher = niedrigere X-Werte, Abstand 5 Einheiten)
- Y-Achse: Hierarchie/Zustaendigkeit (hoeher = hoehere Y-Werte, alle > -0.81)  
- Z-Achse: Parallele/Alternative Pfade (Hauptpfad z=0, Alternativen z=±3)

NODE-TYPEN und Farben:
- authority (Behoerden): "cube", Farbe 0x0066cc (blau)
- document (Dokumente): "cylinder", Farbe 0xffcc00 (gelb)
- decision (Entscheidungen): "octahedron", Farbe 0xff6600 (orange)
- process (Prozessschritte): "sphere", Farbe 0x00cc66 (gruen)

EDGE-TYPEN und Farben:
- process: Prozessfluss (blau)
- dependency: Abhaengigkeiten (orange) 
- approval: Genehmigungsschritte (gruen)
- document: Dokumentenfluss (gelb)

WICHTIGE REGELN:
- Alle IDs muessen eindeutig und ohne Leerzeichen sein
- Koordinaten muessen numerisch sein
- Offset fuer mehrere Edges zwischen gleichen Knoten
- Realistische Zeitangaben in Tagen

Beruecksichtige dabei:
- Alle beteiligten Akteure (Behoerden, Personen, Systeme)
- Zeitliche Ablaeufe und Reihenfolgen
- Parallele Prozesse und Entscheidungspunkte
- Erforderliche Dokumente und Abhaengigkeiten
- Zustaendigkeiten und Hierarchien
- Moegliche Rekurse und Einsprueche

Ausgabe: Nur das vollstaendige JSON, keine zusaetzlichen Erklaerungen.`;

        return basePrompt;
    }

    /**
     * Zeigt den Prompt in einem Dialog-Fenster
     */
    showPromptDialog(prompt) {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; justify-content: center;
            align-items: center; z-index: 10000; color: white; font-family: Arial;
        `;
        
        dialog.innerHTML = `
            <h3>KI-Prompt fuer ${this.settings.systemDescription}</h3>
            <p>Kopieren Sie diesen Prompt und fuegen Sie ihn in ChatGPT, Claude oder eine andere KI ein:</p>
            <textarea readonly style="width: 100%; height: 300px; font-family: monospace; font-size: 12px;">${prompt}</textarea>
            <br><br>
            <button onclick="navigator.clipboard.writeText(\`${prompt.replace(/`/g, '\\`')}\`).then(() => alert('Prompt kopiert!')).catch(() => alert('Manuell kopieren')); this.parentElement.remove();">Kopieren</button>
            <button onclick="this.parentElement.remove();">Schliessen</button>
        `;
        
        document.body.appendChild(dialog);
    }

    /**
     * Verarbeitet die KI-Antwort und laedt das generierte Netzwerk
     */
    async pasteAndLoad() {
        try {
            // Moderne Browser mit Clipboard API
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                this.processAIResponse(text);
            } else {
                // Fallback fuer aeltere Browser
                const text = prompt('Fuegen Sie das KI-generierte JSON hier ein:');
                if (text) {
                    this.processAIResponse(text);
                }
            }
        } catch (error) {
            console.error('Fehler beim Lesen der Zwischenablage:', error);
            // Fallback fuer aeltere Browser
            const text = prompt('Fuegen Sie das KI-generierte JSON hier ein:');
            if (text) {
                this.processAIResponse(text);
            }
        }
    }

    /**
     * Verarbeitet die KI-Antwort
     */
    processAIResponse(text) {
        try {
            // Entferne Markdown-Code-Bloecke
            let cleanText = text.trim();
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const data = JSON.parse(cleanText);
            
            if (this.validateJSON(data)) {
                const title = data.metadata?.title || 'KI-generiertes System';
                this.loadNetworkFromImportedData(data, title);
                this.settings.generationStatus = 'Erfolgreich geladen';
                this.settings.lastGenerated = new Date().toLocaleString();
            } else {
                this.settings.generationStatus = 'Fehler: Ungueltiges JSON-Format';
                alert('Ungueltiges JSON-Format. Bitte pruefen Sie die Struktur.');
            }
        } catch (error) {
            console.error('JSON Parse Error:', error);
            this.settings.generationStatus = 'Fehler: JSON-Parsing fehlgeschlagen';
            alert('Fehler beim Parsen des JSON. Bitte pruefen Sie die Syntax.');
        }
    }

    /**
     * Validiert die JSON-Struktur fuer Nodges-Kompatibilitaet
     */
    validateJSON(data) {
        // Grundstruktur pruefen
        if (!data || typeof data !== 'object') {
            console.error('Keine gueltige JSON-Struktur');
            return false;
        }

        // Metadata pruefen
        if (!data.metadata || !data.metadata.title) {
            console.error('Metadata fehlt oder unvollstaendig');
            return false;
        }

        // Nodes pruefen
        if (!Array.isArray(data.nodes) || data.nodes.length === 0) {
            console.error('Keine gueltigen Nodes');
            return false;
        }

        // Edges pruefen
        if (!Array.isArray(data.edges)) {
            console.error('Keine gueltigen Edges');
            return false;
        }

        // Node-Struktur pruefen
        for (const node of data.nodes) {
            if (!node.id || !node.name || !node.position) {
                console.error('Ungueltige Node-Struktur:', node);
                return false;
            }
            
            if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number' || typeof node.position.z !== 'number') {
                console.error('Ungueltige Position:', node.position);
                return false;
            }
        }

        // Edge-Struktur pruefen
        for (const edge of data.edges) {
            if (!edge.source || !edge.target) {
                console.error('Ungueltige Edge-Struktur:', edge);
                return false;
            }
            
            // Pruefe ob Source und Target Nodes existieren
            const sourceExists = data.nodes.some(node => node.id === edge.source);
            const targetExists = data.nodes.some(node => node.id === edge.target);
            
            if (!sourceExists || !targetExists) {
                console.error('Edge verweist auf nicht existierende Nodes:', edge);
                return false;
            }
        }

        return true;
    }

    /**
     * Zeigt Beispiele fuer den gewaehlten System-Typ
     */
    showExamples() {
        const examples = this.getExamplesForType(this.settings.systemType);
        const exampleText = `Beispiele fuer ${this.settings.systemType}:\n\n${examples.join('\n\n')}`;
        alert(exampleText);
    }

    /**
     * Gibt Beispiele fuer verschiedene System-Typen zurueck
     */
    getExamplesForType(type) {
        const examples = {
            government: [
                'Baueingabe-Verfahren Kanton Zuerich fuer Neubauten in Wohnzonen',
                'Einbuergerungsverfahren Schweiz fuer ordentliche Einbuergerung',
                'Steuererklaerung-Prozess mit Pruefung und Veranlagung',
                'Fuehrerschein-Antrag mit Theorie- und Praxispruefung'
            ],
            business: [
                'Software-Entwicklungsprozess mit Scrum-Methodik',
                'Recruiting-Prozess fuer Software-Entwickler',
                'Kundenservice-Workflow fuer Beschwerdebearbeitung',
                'Produktentwicklung von Idee bis Markteinfuehrung'
            ],
            healthcare: [
                'Notfall-Patientenaufnahme im Krankenhaus',
                'Operationsplanung und -durchfuehrung',
                'Medikamenten-Zulassungsverfahren',
                'Impfkampagne-Organisation und -durchfuehrung'
            ],
            education: [
                'Universitaets-Bewerbungsverfahren',
                'Pruefungsorganisation und -durchfuehrung',
                'Forschungsprojekt von Antrag bis Publikation',
                'Online-Kurs-Entwicklung und -bereitstellung'
            ]
        };
        return examples[type] || [];
    }

    /**
     * Laedt das vordefinierte US-Politiksystem
     */
    async loadUSPoliticalSystem() {
        try {
            const response = await fetch('us_political_system.json');
            if (response.ok) {
                const data = await response.json();
                this.loadNetworkFromImportedData(data, 'US Political System');
                this.settings.generationStatus = 'US-Politiksystem geladen';
                this.settings.lastGenerated = new Date().toLocaleString();
            } else {
                console.error('US Political System Datei nicht gefunden');
                alert('US Political System Datei nicht gefunden');
            }
        } catch (error) {
            console.error('Fehler beim Laden des US Political Systems:', error);
            alert('Fehler beim Laden des US Political Systems');
        }
    }

    /**
     * Laedt das vordefinierte Baueingabe-Beispiel
     */
    async loadBaueingabeExample() {
        try {
            const response = await fetch('EXAMPLE_BAUEINGABE_SYSTEM.json');
            if (response.ok) {
                const data = await response.json();
                this.loadNetworkFromImportedData(data, 'Baueingabe Kanton Zuerich');
                this.settings.generationStatus = 'Baueingabe-Beispiel geladen';
                this.settings.lastGenerated = new Date().toLocaleString();
            } else {
                console.error('Baueingabe-Beispiel Datei nicht gefunden');
                alert('Baueingabe-Beispiel Datei nicht gefunden');
            }
        } catch (error) {
            console.error('Fehler beim Laden des Baueingabe-Beispiels:', error);
            alert('Fehler beim Laden des Baueingabe-Beispiels');
        }
    }

    /**
     * Erstellt die GUI-Integration fuer lil-gui
     */
    createGUIIntegration(gui) {
        // Haupt-Ordner fuer KI-System-Generator
        const aiSystemFolder = gui.addFolder('KI-System-Generator');
        
        // Eingabe-Felder
        aiSystemFolder.add(this.settings, 'systemDescription').name('System-Beschreibung');
        aiSystemFolder.add(this.settings, 'systemType', ['government', 'business', 'healthcare', 'education']).name('System-Typ');
        aiSystemFolder.add(this.settings, 'jurisdiction').name('Zustaendigkeitsbereich');
        aiSystemFolder.add(this.settings, 'complexity', ['low', 'medium', 'high']).name('Komplexitaet');
        
        // Aktions-Buttons
        aiSystemFolder.add(this, 'generatePrompt').name('Prompt generieren');
        aiSystemFolder.add(this, 'pasteAndLoad').name('JSON einfuegen & laden');
        aiSystemFolder.add(this, 'showExamples').name('Beispiele anzeigen');
        
        // Status-Anzeigen (read-only)
        aiSystemFolder.add(this.settings, 'generationStatus').name('Status').listen();
        aiSystemFolder.add(this.settings, 'lastGenerated').name('Zuletzt generiert').listen();
        
        // Beispiel-Systeme Unterordner
        const exampleSystemsFolder = aiSystemFolder.addFolder('Beispiel-Systeme');
        exampleSystemsFolder.add(this, 'loadUSPoliticalSystem').name('US-Politiksystem');
        exampleSystemsFolder.add(this, 'loadBaueingabeExample').name('Baueingabe Zuerich');
        
        return aiSystemFolder;
    }

    /**
     * Gibt die aktuellen Einstellungen zurueck
     */
    getSettings() {
        return this.settings;
    }

    /**
     * Setzt neue Einstellungen
     */
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
    }
}