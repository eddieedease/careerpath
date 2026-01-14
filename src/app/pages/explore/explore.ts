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
  careTypes: string[] = [];
  selectedCareType: string = '';
  careClusters: string[] = [];
  selectedCareCluster: string = '';

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

  // Store initial layout state
  private initialPositions: Map<string, any> = new Map();
  private hasStoredInitialLayout = false;

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
        this.careTypes = [...new Set(this.careerData.map(node => node.careNonCare).filter(Boolean) as string[])].sort();
        this.careClusters = [...new Set(this.careerData.map(node => node.careCluster).filter(Boolean) as string[])].sort();

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
          level: node.level,
          salary: node.salary,
          careCluster: node.careCluster || 'nvt' // Add care cluster to node data
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
            'background-color': '#94a3b8', // Default gray for nvt/unknown
            'label': 'data(label)',
            'color': '#ffffff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '14px',
            'font-weight': 'bold',
            'width': '150px',
            'height': '80px',
            'shape': 'round-rectangle',
            'border-width': '2px',
            'border-color': '#ffffff',
            'text-wrap': 'wrap',
            'text-max-width': '140px',
            'text-outline-color': '#000000',
            'text-outline-width': '1px',
            'opacity': 1
          }
        },
        // Color by Care Cluster
        // Acute zorg (red/orange)
        {
          selector: 'node[careCluster="acute zorg"]',
          style: {
            'background-color': '#dc2626', // Red
            'opacity': 1
          }
        },
        // Langdurige zorg (blue)
        {
          selector: 'node[careCluster="langdurige zorg"]',
          style: {
            'background-color': '#2563eb', // Blue
            'opacity': 1
          }
        },
        // Medisch ondersteunend (purple)
        {
          selector: 'node[careCluster="Medisch ondersteunend"]',
          style: {
            'background-color': '#7e22ce', // Purple
            'opacity': 1
          }
        },
        // Moeder en kind (pink)
        {
          selector: 'node[careCluster="moeder en kind"]',
          style: {
            'background-color': '#db2777', // Pink
            'opacity': 1
          }
        },
        // Paramedische zorg (green)
        {
          selector: 'node[careCluster="paramedische zorg"]',
          style: {
            'background-color': '#16a34a', // Green
            'opacity': 1
          }
        },
        // nvt (gray)
        {
          selector: 'node[careCluster="nvt"]',
          style: {
            'background-color': '#64748b', // Slate gray
            'opacity': 1
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#fbbf24',
            'border-width': '5px',
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
        name: 'grid',
        spacingFactor: 1.3,
        avoidOverlap: true,
        // Add more default layout options
        padding: 80,
        animate: true,
        animationDuration: 500,
      },
      // Disable built-in zoom
      userZoomingEnabled: false,
      minZoom: 0.1,
      maxZoom: 3,
      zoom: 1
    });

    // Store initial positions after first layout
    setTimeout(() => {
      if (!this.hasStoredInitialLayout) {
        this.cy.nodes().forEach((node: any) => {
          this.initialPositions.set(node.id(), {
            x: node.position('x'),
            y: node.position('y')
          });
        });
        this.hasStoredInitialLayout = true;
      }
    }, 600);

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
            'font-size': '10px',
            'text-opacity': 0.7
          })
          .update();
      } else {
        // Show full labels
        this.cy.style()
          .selector('node')
          .style({
            'font-size': '14px',
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

      // Hide all edges first (make them nearly invisible)
      this.cy.edges().style({
        'opacity': 0.05,
        'line-color': '#6b7280',
        'target-arrow-color': '#6b7280',
        'width': 1
      });

      // Hide all nodes (make them nearly invisible)
      this.cy.nodes().style({
        'opacity': 0.05
      });

      // Get only outgoing edges and their target nodes
      const outgoingEdges = node.outgoers('edge');
      const outgoingNodes = outgoingEdges.targets();

      // Show and highlight outgoing edges with brighter green
      outgoingEdges.style({
        'line-color': '#22c55e',
        'target-arrow-color': '#22c55e',
        'width': 4,
        'opacity': 1
      });

      // Show target nodes (where you can go)
      outgoingNodes.style({
        'opacity': 1
      });

      // Make selected node stand out prominently
      node.style({
        'opacity': 1,
        'border-color': '#fbbf24',
        'border-width': '5px'
      });

      // Auto-zoom to fit selected node and forward paths
      setTimeout(() => {
        const nodesToFit = node.union(outgoingNodes);

        this.cy.animate({
          fit: {
            eles: nodesToFit,
            padding: 30
          },
          duration: 400,
          easing: 'ease-out'
        });

        setTimeout(() => {
          this.updateZoomLevel();
        }, 450);
      }, 50);
    });

    // Hide tooltip when panning or zooming
    this.cy.on('viewport', () => {
      this.showTooltip = false;
    });
  }

  selectSearchResult(node: NodeData) {
    this.searchQuery = '';
    this.searchResults = [];

    // Reset filters
    this.selectedDepartment = '';
    this.selectedSalaryLevel = '';
    this.applyFilters(); // Apply reset filters (shows all nodes)

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

      // Reset all nodes to be visible with proper colors based on their care cluster
      this.cy.nodes().forEach((node: any) => {
        const careCluster = node.data('careCluster');
        let backgroundColor = '#94a3b8'; // Default gray for nvt/unknown

        // Determine color based on care cluster
        if (careCluster === 'acute zorg') {
          backgroundColor = '#dc2626'; // Red
        } else if (careCluster === 'langdurige zorg') {
          backgroundColor = '#2563eb'; // Blue
        } else if (careCluster === 'Medisch ondersteunend') {
          backgroundColor = '#7e22ce'; // Purple
        } else if (careCluster === 'moeder en kind') {
          backgroundColor = '#db2777'; // Pink
        } else if (careCluster === 'paramedische zorg') {
          backgroundColor = '#16a34a'; // Green
        } else if (careCluster === 'nvt') {
          backgroundColor = '#64748b'; // Slate gray
        }

        node.style({
          'background-color': backgroundColor,
          'opacity': 1,
          'border-width': '2px',
          'border-color': '#ffffff',
          'label': this.showLabels ? node.data('label') : '',
          'font-size': '14px',
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

      // Use setTimeout to ensure zoom happens after tap event completes
      if (false) setTimeout(() => {
        // Get outgoing edges and their target nodes for better zoom
        const outgoingEdges = node.outgoers('edge');
        const outgoingNodes = outgoingEdges.targets();

        // Create collection of selected node + all outgoing nodes
        const nodesToFit = node.union(outgoingNodes);

        // Animate the zoom for smoother transition
        this.cy.animate({
          fit: {
            eles: nodesToFit,
            padding: 30
          },
          duration: 400,
          easing: 'ease-out'
        });

        // Update zoom level display after animation
        setTimeout(() => {
          this.updateZoomLevel();
        }, 450);
      }, 50);
    }
  }

  // Filter nodes based on selected department and salary

  applyFilters() {
    // Reset all nodes to fully visible first
    this.cy.nodes().style({
      'opacity': 1,
      'display': 'element'
    });
    this.cy.edges().style({ 'opacity': 1 });

    // Apply department filter
    if (this.selectedDepartment) {
      this.showWelcome = false; // Hide welcome screen when a department is selected
      this.cy.nodes().filter((node: any) =>
        node.data('department') !== this.selectedDepartment
      ).style({ 'opacity': 0.1 });
    }

    // Apply salary filter
    if (this.selectedSalaryLevel) {
      this.showWelcome = false; // Hide welcome screen when a salary level is selected
      this.cy.nodes().filter((node: any) =>
        node.data('salary') !== this.selectedSalaryLevel
      ).style({ 'opacity': 0.1 });
    }

    // Apply care type filter
    if (this.selectedCareType) {
      this.showWelcome = false;
      const filteredNodes = this.careerData
        .filter(node => node.careNonCare !== this.selectedCareType)
        .map(node => node.id);
      filteredNodes.forEach(id => {
        this.cy.getElementById(id).style({ 'opacity': 0.1 });
      });
    }

    // Apply care cluster filter
    if (this.selectedCareCluster) {
      this.showWelcome = false;
      const filteredNodes = this.careerData
        .filter(node => node.careCluster !== this.selectedCareCluster)
        .map(node => node.id);
      filteredNodes.forEach(id => {
        this.cy.getElementById(id).style({ 'opacity': 0.1 });
      });
    }

    // Also dim edges connected to dimmed nodes
    this.cy.nodes().filter((node: any) => node.style('opacity') < 1).connectedEdges().style({ 'opacity': 0.05 });

    // Smart fit: only fit if we don't have a selected node that is still visible
    const selectedNodeStillVisible = this.selectedNode &&
      this.cy.getElementById(this.selectedNode.id).style('opacity') === 1;

    if (!selectedNodeStillVisible) {
      // Fit the view to show visible nodes only if we lost our focus point
      this.cy.fit();
    }
  }

  // Reset all filters
  resetFilters() {
    this.selectedDepartment = '';
    this.selectedSalaryLevel = '';
    this.selectedCareType = '';
    this.selectedCareCluster = '';
    this.cy.nodes().style({ 'display': 'element' });
    this.cy.fit();
  }

  // Add new method to handle layout changes
  changeLayout(event: Event) {
    const select = event.target as HTMLSelectElement;
    const layoutName = select.value;

    // If switching back to breadthfirst and we have stored positions, restore them
    if (layoutName === 'breadthfirst' && this.hasStoredInitialLayout) {
      this.cy.nodes().forEach((node: any) => {
        const pos = this.initialPositions.get(node.id());
        if (pos) {
          node.position(pos);
        }
        // Ensure node styles are correct
        node.style({
          'width': '150px',
          'height': '80px',
          'font-size': '14px',
          'text-max-width': '140px'
        });
      });

      // Fit to the restored layout
      this.cy.fit(undefined, 80);
      this.updateZoomLevel();
      return; // Don't run the layout algorithm
    }

    const layoutOptions: any = {
      breadthfirst: {
        name: 'breadthfirst',
        directed: true,
        spacingFactor: 1.5,  // Reduced from 2.2
        avoidOverlap: true,
      },
      circle: {
        name: 'circle',
        spacingFactor: 1.2,  // Reduced from 1.5
        avoidOverlap: true,
      },
      concentric: {
        name: 'concentric',
        minNodeSpacing: 80,  // Reduced from 100
        avoidOverlap: true,
      },
      grid: {
        name: 'grid',
        avoidOverlap: true,
        spacingFactor: 1.3,  // Reduced from 1.8
      },
      random: {
        name: 'random',
        avoidOverlap: true,
      },
      cose: {
        name: 'cose',
        animate: true,
        nodeRepulsion: 8000,
        idealEdgeLength: 100,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      }
    };

    // Common options for all layouts
    const commonOptions = {
      animate: true,
      animationDuration: 500,
      padding: 80,
      fit: true
    };

    // Store current zoom and pan before layout
    const currentZoom = this.cy.zoom();
    const currentPan = this.cy.pan();

    // Disable auto-fit to prevent node resizing
    const layoutConfig = {
      ...layoutOptions[layoutName],
      ...commonOptions,
      fit: false  // Don't auto-fit during layout
    };

    const layout = this.cy.layout(layoutConfig);

    // Run the layout
    layout.run();

    // When layout completes, restore node styles, zoom, and pan
    layout.one('layoutstop', () => {
      // Force re-apply node dimensions and font sizes
      this.cy.nodes().forEach((node: any) => {
        node.style({
          'width': '150px',
          'height': '80px',
          'font-size': '14px',
          'text-max-width': '140px'
        });
      });

      // Restore the original zoom and pan instead of fitting
      this.cy.zoom(currentZoom);
      this.cy.pan(currentPan);

      // Update zoom level display
      this.updateZoomLevel();
    });
  }

  // Toggle node labels visibility
  toggleNodeLabels() {
    this.showLabels = !this.showLabels;

    // Update each node's label visibility
    this.cy.nodes().forEach((node: any) => {
      node.style({
        'label': this.showLabels ? node.data('label') : '',
        'text-opacity': this.showLabels ? 1 : 0,
        'font-size': '14px'
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

      switch (event.key) {
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
