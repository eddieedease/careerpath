import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import cytoscape from 'cytoscape';

interface NodeData {
  id: string;
  label: string;
  department: string;
  level: string;
  description: string;
  requirements: string[];
  salary: string;
}

interface CareerPath {
  from: string;
  to: string;
  timeframe?: string;
}

@Component({
  selector: 'app-explore',
  imports: [RouterLink, FormsModule],
  templateUrl: './explore.html',
  styleUrl: './explore.css',
  standalone: true
})
export class Explore implements OnInit, AfterViewInit {
  @ViewChild('cytoscapeContainer', { static: true }) cytoscapeContainer!: ElementRef;
  
  cy: any;
  selectedNode: NodeData | null = null;

  // Add new properties
  searchQuery: string = '';
  searchResults: NodeData[] = [];
  selectedNodePaths: CareerPath[] = [];

  private careerData: NodeData[] = [
    {
      id: 'nurse-assistant',
      label: 'Zorgassistent',
      department: 'Verpleging',
      level: 'Instapniveau',
      description: 'Biedt basiszorg aan patiënten onder toezicht van gediplomeerde verpleegkundigen.',
      requirements: ['Middelbare school diploma', 'Verzorgende IG certificaat', 'Basale levensondersteuning'],
      salary: '€23.000 - €32.000'
    },
    {
      id: 'registered-nurse',
      label: 'Verpleegkundige',
      department: 'Verpleging',
      level: 'Professional',
      description: 'Verleent directe patiëntenzorg, dient medicatie toe, en coördineert zorgplannen.',
      requirements: ['HBO-V', 'BIG-registratie', 'Klinische ervaring'],
      salary: '€35.000 - €55.000'
    },
    {
      id: 'nurse-manager',
      label: 'Afdelingshoofd Verpleging',
      department: 'Verpleging',
      level: 'Management',
      description: 'Leidt verplegend personeel, beheert afdelingsoperaties, en zorgt voor kwaliteitszorg.',
      requirements: ['HBO-V/Master', 'Management ervaring', 'Leiderschapsvaardigheden'],
      salary: '€55.000 - €75.000'
    },
    {
      id: 'med-tech',
      label: 'Medisch Analist',
      department: 'Laboratorium',
      level: 'Professional',
      description: 'Voert complexe laboratoriumtests uit en analyseert resultaten.',
      requirements: ['Bachelor Medische Technologie', 'Laboratorium certificering'],
      salary: '€32.000 - €50.000'
    },
    {
      id: 'lab-manager',
      label: 'Laboratorium Manager',
      department: 'Laboratorium',
      level: 'Management',
      description: 'Superviseert laboratoriumoperaties, beheert personeel en zorgt voor kwaliteitscontrole van alle tests.',
      requirements: ['Master Medische Biologie of Chemie', 'Management ervaring', 'Kwaliteitsbeheersysteem kennis'],
      salary: '€60.000 - €80.000'
    },
    {
      id: 'physician-assistant',
      label: 'Physician Assistant',
      department: 'Medisch',
      level: 'Professional',
      description: 'Assisteert artsen bij diagnose en behandeling van patiënten, voert medische procedures uit.',
      requirements: ['Master Physician Assistant', 'BIG-registratie', 'Klinische ervaring'],
      salary: '€45.000 - €65.000'
    },
    {
      id: 'medical-specialist',
      label: 'Medisch Specialist',
      department: 'Medisch',
      level: 'Expert',
      description: 'Diagnosticeert en behandelt patiënten binnen een medisch specialisme zoals cardiologie of neurologie.',
      requirements: ['Geneeskunde opleiding', 'Specialisatie', 'BIG-registratie'],
      salary: '€90.000 - €120.000'
    },
    {
      id: 'it-support',
      label: 'IT Ondersteuning',
      department: 'ICT',
      level: 'Instapniveau',
      description: 'Biedt technische ondersteuning voor ziekenhuissystemen en apparatuur.',
      requirements: ['MBO Informatica', 'Kennis van netwerken', 'Probleemoplossend vermogen'],
      salary: '€28.000 - €38.000'
    },
    {
      id: 'health-informatics',
      label: 'Zorginformaticus',
      department: 'ICT',
      level: 'Professional',
      description: 'Ontwikkelt en beheert klinische informatiesystemen en zorgt voor data-integratie binnen het ziekenhuis.',
      requirements: ['HBO/WO Informatica of Zorginformatica', 'Kennis van EPD-systemen', 'SQL en databeheer'],
      salary: '€45.000 - €65.000'
    }
  ];

  private careerPaths: CareerPath[] = [
    { from: 'nurse-assistant', to: 'registered-nurse', timeframe: '2-4 jaar' },
    { from: 'registered-nurse', to: 'nurse-manager', timeframe: '5-7 jaar' },
    { from: 'med-tech', to: 'lab-manager', timeframe: '4-6 jaar' },
    { from: 'registered-nurse', to: 'physician-assistant', timeframe: '3-5 jaar' },
    { from: 'physician-assistant', to: 'medical-specialist', timeframe: '5-8 jaar' },
    { from: 'it-support', to: 'health-informatics', timeframe: '2-4 jaar' },
    { from: 'med-tech', to: 'health-informatics', timeframe: '2-3 jaar' },
    { from: 'registered-nurse', to: 'health-informatics', timeframe: '1-2 jaar' },
    { from: 'nurse-manager', to: 'medical-specialist', timeframe: '6-8 jaar' },
    { from: 'lab-manager', to: 'medical-specialist', timeframe: '7-9 jaar' }
  ];

  ngOnInit() {}

  ngAfterViewInit() {
    this.initializeCytoscape();
  }

  private initializeCytoscape() {
    const elements = [
      ...this.careerData.map(node => ({
        data: { 
          id: node.id, 
          label: node.label,
          department: node.department,
          level: node.level
        }
      })),
      ...this.careerPaths.map(path => ({
        data: { 
          source: path.from, 
          target: path.to,
          timeframe: path.timeframe 
        }
      }))
    ];

    this.cy = cytoscape({
      container: this.cytoscapeContainer.nativeElement,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#1e40af',
            'label': 'data(label)',
            'color': '#ffffff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '11px',
            'font-weight': 'bold',
            'width': '130px',
            'height': '70px',
            'shape': 'round-rectangle',
            'border-width': '2px',
            'border-color': '#ffffff',
            'text-wrap': 'wrap',
            'text-max-width': '120px'
          }
        },
        {
          selector: 'node[level="Instapniveau"]',
          style: { 'background-color': '#059669' }
        },
        {
          selector: 'node[level="Management"]',
          style: { 'background-color': '#dc2626' }
        },
        {
          selector: 'node[level="Expert"]',
          style: { 'background-color': '#7e22ce' }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#fbbf24',
            'border-width': '4px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#6b7280',
            'target-arrow-color': '#6b7280',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        }
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        spacingFactor: 1.8,
        avoidOverlap: true
      },
      // Disable built-in zoom
      userZoomingEnabled: false,
      minZoom: 0.1,
      maxZoom: 3,
      zoom: 1
    });

    // Custom zoom handler
    let currentZoom = 1;
    const zoomStep = 0.1;

    this.cytoscapeContainer.nativeElement.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault();
      
      // Calculate new zoom level
      if (event.deltaY < 0) {
        currentZoom = Math.min(currentZoom + zoomStep, 3);
      } else {
        currentZoom = Math.max(currentZoom - zoomStep, 0.1);
      }

      // Apply zoom centered on mouse position
      const mousePosition = this.cy.renderer().projectIntoViewport(event.offsetX, event.offsetY);
      this.cy.zoom({
        level: currentZoom,
        renderedPosition: { x: event.offsetX, y: event.offsetY }
      });
    });

    this.cy.on('tap', 'node', (event: any) => {
      const nodeId = event.target.id();
      const node = event.target;
      
      this.selectedNode = this.careerData.find(node => node.id === nodeId) || null;
      this.updateSelectedNodePaths(nodeId);
      
      // Reset all edges to default style first
      this.cy.edges().style({
        'line-color': '#6b7280',
        'target-arrow-color': '#6b7280',
        'width': 3
      });
      
      // Highlight connected edges
      const connectedEdges = node.connectedEdges();
      connectedEdges.style({
        'line-color': '#fbbf24',
        'target-arrow-color': '#fbbf24',
        'width': 5
      });
    });
  }

  selectSearchResult(node: NodeData) {
    this.searchQuery = '';
    this.searchResults = [];
    const cyNode = this.cy.getElementById(node.id);
    if (cyNode) {
      cyNode.trigger('tap');
      
      this.cy.fit(cyNode.neighborhood().add(cyNode), 100);
    }
  }

  public resetView(): void {
    if (this.cy) {
      this.cy.edges().style({
        'line-color': '#6b7280',
        'target-arrow-color': '#6b7280',
        'width': 3
      });
      
      this.cy.fit();
    }
  }

  // Add new methods
  onSearch(event: any) {
    const query = this.searchQuery.toLowerCase();
    if (query.length < 2) {
      this.searchResults = [];
      return;
    }

    this.searchResults = this.careerData.filter(node =>
      node.label.toLowerCase().includes(query) ||
      node.department.toLowerCase().includes(query)
    ).slice(0, 5); // Limit to 5 results
  }

  getNodeLabel(nodeId: string): string {
    return this.careerData.find(node => node.id === nodeId)?.label || nodeId;
  }

  updateSelectedNodePaths(nodeId: string) {
    // Find all possible career paths from this node
    this.selectedNodePaths = this.careerPaths.filter(path => path.from === nodeId);
  }
}