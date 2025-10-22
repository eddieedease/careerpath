import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import cytoscape from 'cytoscape';
import { CareerDataService, NodeData, CareerPath } from '../../services/career-data.service';

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
  
  // Filter properties
  departments: string[] = [];
  selectedDepartment: string = '';
  salaryLevels: string[] = [];
  selectedSalaryLevel: string = '';
  
  // Welcome screen properties
  showWelcome: boolean = true;
  welcomeChoice: 'starter' | 'experienced' | 'specialized' | 'management' | '' = '';
  selectedStartNode: NodeData | null = null;
  
  // Hover tooltip properties
  hoveredNode: NodeData | null = null;
  tooltipPosition = { x: 0, y: 0 };
  showTooltip = false;
  
  // Additional UI state
  showLabels = true;
  currentZoomLevel = 100;
  
  constructor(private dataService: CareerDataService) {
    // data will be loaded in ngOnInit; departments and salaryLevels are populated after load
  }

  setWelcomeChoice(choice: 'starter' | 'experienced' | 'specialized' | 'management') {
    this.welcomeChoice = choice;
    this.selectedStartNode = null;
  }

  getRelevantDepartments(): string[] {
    switch (this.welcomeChoice) {
      case 'starter':
        return this.departments.filter(dept => 
          this.careerData.some(node => 
            node.department === dept && 
            ['Medewerker zorg C', 'Medewerker zorg A - helpende zorg en welzijn niv 2', 
             'medisch assistent D', 'medisch assistent C'].includes(node.level)
          )
        );
      case 'management':
        return this.departments.filter(dept => 
          this.careerData.some(node => 
            node.department === dept && 
            ['Teamleider zorg A', 'Teamleider zorg B', 'Organisatorisch hoofd A', 
             'Organisatorisch hoofd B1', 'generiek'].includes(node.level)
          )
        );
      case 'specialized':
        return this.departments.filter(dept => 
          this.careerData.some(node => 
            node.department === dept && 
            ['verpleegkundige specialist', 'Physician assistant', 'Sedatie praktijk specialist',
             'Deskundige infectiepreventie', 'verpleegkundige bewaking A'].includes(node.level)
          )
        );
      default:
        return this.departments;
    }
  }

  selectDepartment(department: string) {
    if (!department) {
      this.selectedStartNode = null;
      return;
    }

    this.selectedDepartment = department;
    const nodes = this.careerData.filter(node => node.department === department);
    
    switch (this.welcomeChoice) {
      case 'starter':
        this.selectedStartNode = nodes.find(node => 
          ['Medewerker zorg C', 'Medewerker zorg A - helpende zorg en welzijn niv 2', 
           'medisch assistent D', 'medisch assistent C'].includes(node.level)
        ) || nodes[0];
        break;
      case 'management':
        this.selectedStartNode = nodes.find(node => 
          ['Teamleider zorg C', 'Teamleider zorg B'].includes(node.level)
        ) || nodes[0];
        break;
      case 'specialized':
        this.selectedStartNode = nodes.find(node => 
          node.level.includes('verpleegkundige') || node.level.includes('specialist')
        ) || nodes[0];
        break;
      default:
        this.selectedStartNode = nodes[0];
    }
  }

  startExploring() {
    this.showWelcome = false;
    this.cy.nodes().style({ 'opacity': 0.15 });
    
    if (this.selectedStartNode) {
      const node = this.cy.getElementById(this.selectedStartNode.id);
      if (node) {
        this.selectNodeById(this.selectedStartNode.id);
        this.cy.center(node);
      }
    }
  }

  // Data will be loaded from the assets via CareerDataService
  private careerData: NodeData[] = [];
  private careerPaths: CareerPath[] = [];

  ngOnInit() {
    // Load career data from service
    this.dataService.getCareerData().subscribe({
      next: (data) => {
        this.careerData = data.nodes || [];
        this.careerPaths = data.paths || [];

        // Populate filters
        this.departments = [...new Set(this.careerData.map(node => node.department))].sort();
        this.salaryLevels = [...new Set(this.careerData.map(node => node.salary))].sort();

        // Initialize cytoscape once data is available
        // Delay initialization until view is ready
        setTimeout(() => {
          if ((this as any).cytoscapeContainer && this.cytoscapeContainer.nativeElement) {
            this.initializeCytoscape();
            this.setupKeyboardShortcuts();
          }
        }, 0);
      },
      error: (err) => {
        console.error('Failed to load career data', err);
        // Fallback: initialize with empty graph
        setTimeout(() => {
          this.initializeCytoscape();
          this.setupKeyboardShortcuts();
        }, 0);
      }
    });
  }

  ngAfterViewInit() {
    // No-op: cytoscape initialization happens after data load in ngOnInit
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
            'background-color': '#1e40af', // Default blue
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
            'text-max-width': '120px',
            'text-outline-color': '#000000',
            'text-outline-width': '1px',
            'opacity': 1
          }
        },
        // Entry level positions (green)
        {
          selector: 'node[level="Medewerker zorg C"], node[level="Medewerker zorg A - helpende zorg en welzijn niv 2"], node[level="medisch assistent D"], node[level="medisch assistent C"]',
          style: { 
            'background-color': '#16a34a',
            'opacity': 1
          }
        },
        // Standard healthcare roles (blue)
        {
          selector: 'node[level="verpleegkundige B"], node[level="Verpleegkundige A"], node[level="medisch assistent B"], node[level="medisch assistent A"], node[level="Specialistisch verpleegkundige B"]',
          style: { 
            'background-color': '#2563eb',
            'opacity': 1
          }
        },
        // Management roles (red)
        {
          selector: 'node[level="Teamleider zorg A"], node[level="Teamleider zorg B"], node[level="Organisatorisch hoofd A"], node[level="Organisatorisch hoofd B1"], node[level="generiek"]',
          style: { 
            'background-color': '#dc2626',
            'opacity': 1
          }
        },
        // High specialized roles (purple)
        {
          selector: 'node[level="verpleegkundige specialist"], node[level="Physician assistant"], node[level="Sedatie praktijk specialist"], node[level="Deskundige infectiepreventie"], node[level="verpleegkundige bewaking A"], node[level="verpleegkundige spoedeisende zorg A"], node[level="verpleegkundige spoedeisende zorg A = ambulance"]',
          style: { 
            'background-color': '#7e22ce',
            'opacity': 1
          }
        },
        // Support/technical roles (orange) 
        {
          selector: 'node[level="vakman vormende techniek A"], node[level="Fysiotherapeut"], node[level="Laborant functieonderzoek A1"], node[level="Laborant functieonderzoek A2"], node[level="Laborant beeldvormende technieken A"], node[level="Laborant beeldvormende technieken B"], node[level="Operatieassistent A"], node[level="Operatieassistent B"], node[level="Anesthesiemedewerker A"], node[level="Anesthesiemedewerker B"]',
          style: { 
            'background-color': '#f97316',
            'opacity': 1
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#fbbf24',
            'border-width': '4px',
            'opacity': 1
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
        avoidOverlap: true,
        // Add more default layout options
        padding: 50,
        animate: true,
        animationDuration: 500,
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
      
      // Update zoom level display
      this.updateZoomLevel();
      
      // Adjust text visibility based on zoom level
      if (currentZoom < 0.5) {
        // Hide labels when zoomed out too much
        this.cy.style()
          .selector('node')
          .style({
            'font-size': '0px',
            'text-opacity': 0
          })
          .update();
      } else if (currentZoom < 0.8) {
        // Show abbreviated labels
        this.cy.style()
          .selector('node')
          .style({
            'font-size': '8px',
            'text-opacity': 0.7
          })
          .update();
      } else {
        // Show full labels
        this.cy.style()
          .selector('node')
          .style({
            'font-size': '11px',
            'text-opacity': 1
          })
          .update();
      }
    });

    // Hover event handlers for tooltip
    this.cy.on('mouseover', 'node', (event: any) => {
      const nodeId = event.target.id();
      const node = event.target;
      
      this.hoveredNode = this.careerData.find(n => n.id === nodeId) || null;
      
      if (this.hoveredNode) {
        // Get the rendered position of the node
        const renderedPosition = node.renderedPosition();
        const containerRect = this.cytoscapeContainer.nativeElement.getBoundingClientRect();
        
        this.tooltipPosition = {
          x: renderedPosition.x,
          y: renderedPosition.y
        };
        
        this.showTooltip = true;
        
        // Add hover style to node
        node.style({
          'border-color': '#3b82f6',
          'border-width': '3px'
        });
      }
    });
    
    this.cy.on('mouseout', 'node', (event: any) => {
      this.showTooltip = false;
      this.hoveredNode = null;
      
      // Reset border unless it's the selected node
      const node = event.target;
      if (!node.hasClass('selected')) {
        node.style({
          'border-color': '#ffffff',
          'border-width': '2px'
        });
      }
    });

    this.cy.on('tap', 'node', (event: any) => {
      const nodeId = event.target.id();
      const node = event.target;
      
      // Remove selected class from all nodes
      this.cy.nodes().removeClass('selected');
      // Add selected class to clicked node
      node.addClass('selected');
      
      this.selectedNode = this.careerData.find(node => node.id === nodeId) || null;
      this.updateSelectedNodePaths(nodeId);
      
      // First reset all edges to default style
      this.cy.edges().style({
        'opacity': 0.1, // Reduced from 0.2
        'line-color': '#6b7280',
        'target-arrow-color': '#6b7280',
        'width': 1
      });

      // Set all nodes to dim state but keep them barely visible
      this.cy.nodes().style({
        'opacity': 0.08  // Reduced from 0.15
      });

      // Get connected elements
      const connectedEdges = node.connectedEdges();
      const connectedNodes = connectedEdges.connectedNodes();
      
      // Highlight connected nodes
      connectedNodes.style({
        'opacity': 1
      });
      
      // Color incoming edges red
      const incomingEdges = node.incomers('edge');
      incomingEdges.style({
        'line-color': '#dc2626',
        'target-arrow-color': '#dc2626',
        'width': 3,
        'opacity': 1
      });
      
      // Color outgoing edges green
      const outgoingEdges = node.outgoers('edge');
      outgoingEdges.style({
        'line-color': '#16a34a',
        'target-arrow-color': '#16a34a',
        'width': 3,
        'opacity': 1
      });

      // Make selected node stand out
      node.style({
        'opacity': 1,
        'border-color': '#fbbf24',
        'border-width': '4px'
      });
    });
    
    // Hide tooltip when panning or zooming
    this.cy.on('viewport', () => {
      this.showTooltip = false;
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
      // Remove selected class from all nodes
      this.cy.nodes().removeClass('selected');
      
      // Clear selection
      this.selectedNode = null;
      this.selectedNodePaths = [];
      
      // Reset all nodes to be visible with proper colors based on their level
      this.cy.nodes().forEach((node: any) => {
        const level = node.data('level');
        let backgroundColor = '#1e40af'; // Default blue
        
        // Determine color based on level
        if (['Medewerker zorg C', 'Medewerker zorg A - helpende zorg en welzijn niv 2', 'medisch assistent D', 'medisch assistent C'].includes(level)) {
          backgroundColor = '#16a34a'; // Green for entry level
        } else if (['verpleegkundige B', 'Verpleegkundige A', 'medisch assistent B', 'medisch assistent A', 'Specialistisch verpleegkundige B'].includes(level)) {
          backgroundColor = '#2563eb'; // Blue for standard roles
        } else if (['Teamleider zorg A', 'Teamleider zorg B', 'Organisatorisch hoofd A', 'Organisatorisch hoofd B1', 'generiek'].includes(level)) {
          backgroundColor = '#dc2626'; // Red for management
        } else if (['verpleegkundige specialist', 'Physician assistant', 'Sedatie praktijk specialist', 'Deskundige infectiepreventie', 'verpleegkundige bewaking A', 'verpleegkundige spoedeisende zorg A', 'verpleegkundige spoedeisende zorg A = ambulance'].includes(level)) {
          backgroundColor = '#7e22ce'; // Purple for specialized
        } else if (['vakman vormende techniek A', 'Fysiotherapeut', 'Laborant functieonderzoek A1', 'Laborant functieonderzoek A2', 'Laborant beeldvormende technieken A', 'Laborant beeldvormende technieken B', 'Operatieassistent A', 'Operatieassistent B', 'Anesthesiemedewerker A', 'Anesthesiemedewerker B'].includes(level)) {
          backgroundColor = '#f97316'; // Orange for support/technical
        }
        
        node.style({
          'background-color': backgroundColor,
          'opacity': 1,
          'border-width': '2px',
          'border-color': '#ffffff',
          'label': this.showLabels ? node.data('label') : '',
          'font-size': '11px',
          'text-opacity': this.showLabels ? 1 : 0
        });
      });
      
      // Reset all edges
      this.cy.edges().style({
        'opacity': 1,
        'line-color': '#6b7280',
        'target-arrow-color': '#6b7280',
        'width': 3
      });
      
      // Reset zoom and fit
      this.cy.fit();
      this.updateZoomLevel();
    }
  }

  // Add new methods
  onSearch(event: any) {
    const query = this.searchQuery.toLowerCase();
    if (query.length < 2) {
      this.searchResults = [];
      return;
    }

    this.showWelcome = false; // Hide welcome screen when searching
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

  selectNodeById(nodeId: string) {
    const node = this.cy.getElementById(nodeId);
    if (node) {
      this.showWelcome = false; // Hide welcome screen when a node is selected
      // Trigger the tap event to update selection
      node.trigger('tap');
      
      // Center and zoom to the node
      this.cy.fit(node.neighborhood().add(node), 100);
      
      // Ensure the node is clearly visible
      this.cy.center(node);
    }
  }

  // Filter nodes based on selected department and salary
  applyFilters() {
    // Reset all nodes to visible first
    this.cy.nodes().style({ 'display': 'element' });
    
    // Apply department filter
    if (this.selectedDepartment) {
      this.showWelcome = false; // Hide welcome screen when a department is selected
      this.cy.nodes().filter((node: any) => 
        node.data('department') !== this.selectedDepartment
      ).style({ 'display': 'none' });
    }
    
    // Apply salary filter
    if (this.selectedSalaryLevel) {
      this.showWelcome = false; // Hide welcome screen when a salary level is selected
      this.cy.nodes().filter((node: any) => 
        node.data('salary') !== this.selectedSalaryLevel
      ).style({ 'display': 'none' });
    }
    
    // Fit the view to show visible nodes
    this.cy.fit();
  }

  // Reset all filters
  resetFilters() {
    this.selectedDepartment = '';
    this.selectedSalaryLevel = '';
    this.cy.nodes().style({ 'display': 'element' });
    this.cy.fit();
  }

  // Add new method to handle layout changes
  changeLayout(event: Event) {
    const select = event.target as HTMLSelectElement;
    const layoutName = select.value;
    
    const layoutOptions: any = {
      breadthfirst: {
        name: 'breadthfirst',
        directed: true,
        spacingFactor: 1.8,
        avoidOverlap: true,
      },
      circle: {
        name: 'circle',
        spacingFactor: 1.5,
        avoidOverlap: true,
      },
      concentric: {
        name: 'concentric',
        minNodeSpacing: 50,
        avoidOverlap: true,
      },
      grid: {
        name: 'grid',
        avoidOverlap: true,
        spacingFactor: 1.5,
      },
      random: {
        name: 'random',
        avoidOverlap: true,
      }
    };

    // Common options for all layouts
    const commonOptions = {
      animate: true,
      animationDuration: 500,
      padding: 50,
      fit: true
    };

    const layout = this.cy.layout({
      ...layoutOptions[layoutName],
      ...commonOptions
    });

    layout.run();
  }

  // Toggle node labels visibility
  toggleNodeLabels() {
    this.showLabels = !this.showLabels;
    
    // Update each node's label visibility
    this.cy.nodes().forEach((node: any) => {
      node.style({
        'label': this.showLabels ? node.data('label') : '',
        'text-opacity': this.showLabels ? 1 : 0,
        'font-size': '11px'
      });
    });
  }

  // Zoom control methods
  zoomIn() {
    const currentZoom = this.cy.zoom();
    const newZoom = Math.min(currentZoom * 1.2, 3);
    this.cy.zoom(newZoom);
    this.cy.center();
    this.updateZoomLevel();
  }

  zoomOut() {
    const currentZoom = this.cy.zoom();
    const newZoom = Math.max(currentZoom * 0.8, 0.1);
    this.cy.zoom(newZoom);
    this.cy.center();
    this.updateZoomLevel();
  }

  private updateZoomLevel() {
    this.currentZoomLevel = Math.round(this.cy.zoom() * 100);
  }

  private setupKeyboardShortcuts() {
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch(event.key) {
        case '+':
        case '=':
          event.preventDefault();
          this.zoomIn();
          break;
        case '-':
        case '_':
          event.preventDefault();
          this.zoomOut();
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          this.resetView();
          break;
        case 'l':
        case 'L':
          event.preventDefault();
          this.toggleNodeLabels();
          break;
      }
    });
  }
}