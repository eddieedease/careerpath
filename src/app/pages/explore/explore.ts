import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { CareerDataService, NodeData, CareerPath } from '../../services/career-data.service';

cytoscape.use(dagre);

// Single source of truth for cluster colors (graph nodes, legend and sidebar dots)
const CLUSTER_COLORS: Record<string, string> = {
  'acute zorg': '#dd1334',            // ETZ Red
  'langdurige zorg': '#41b8ee',       // ETZ Light Blue
  'Medisch ondersteunend': '#00273e', // ETZ Navy
  'moeder en kind': '#db2777',        // Pink
  'paramedische zorg': '#a4c047',     // ETZ Green
  'Inkoop & Logistiek': '#0f766e',    // Dark Teal
  'Veiligheid & Ontvangst': '#d97706',// Orange-Amber
  'fsp & catering': '#b45309',        // Warm Terracotta
  'patientenvoeding': '#15803d',      // Fresh Green
  'schoonmaak': '#0369a1',            // Sky Blue
  'hospitality': '#be185d',           // Rose-Pink
  'Fac Services alg': '#4b5563',      // Charcoal Gray
  'nvt': '#9333ea'                    // Purple
};
const DEFAULT_CLUSTER_COLOR = '#9333ea';

// Subtle edge styling for the overview: with this many cross-references the
// lines are only a hint; they light up (green/blue) once a node is selected
const SUBTLE_EDGE_STYLE = {
  'opacity': 0.15,
  'line-color': '#9ca3af',
  'target-arrow-color': '#9ca3af',
  'width': 1.5,
  'z-index': 10
};

export interface LegendItem {
  name: string;
  color: string;
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
  currentFamily: 'care' | 'facility' = 'care';

  searchQuery: string = '';
  searchResults: NodeData[] = [];
  selectedNodePaths: CareerPath[] = [];
  selectedNodeIncomingPaths: CareerPath[] = [];

  // Filter properties
  departments: string[] = [];
  selectedDepartment: string = '';
  salaryLevels: string[] = [];
  selectedSalaryLevel: string = '';
  careTypes: string[] = [];
  selectedCareType: string = '';
  careClusters: string[] = [];
  selectedCareCluster: string = '';

  // Welcome screen
  showWelcome: boolean = true;

  // Hover tooltip properties
  hoveredNode: NodeData | null = null;
  tooltipPosition = { x: 0, y: 0 };
  showTooltip = false;
  tooltipBelow = false;

  // Additional UI state
  showLabels = true;
  showFilters = false;
  showLegend = true;
  showIncomingPaths = false;
  currentZoomLevel = 100;
  legendItems: LegendItem[] = [];

  // Navigation history
  navigationHistory: NodeData[] = [];
  maxHistorySize: number = 5;

  private keyboardShortcutsInitialized = false;

  // Original positions of nodes moved by the focus view, so they can be put back
  private focusSavedPositions = new Map<string, { x: number; y: number }>();

  // Grid sort: group by cluster, then by salary scale, so the overview reads as blocks of color
  private clusterGridSort = (a: any, b: any): number => {
    const clusterA = a.data('careCluster') || '';
    const clusterB = b.data('careCluster') || '';
    if (clusterA !== clusterB) {
      return clusterA.localeCompare(clusterB);
    }
    return (a.data('salary') || '').localeCompare(b.data('salary') || '');
  };

  // Move incoming nodes into columns left of the selected node and outgoing
  // nodes into columns on the right, so a busy network stays readable per selection
  private applyFocusLayout(node: any, incomingNodes: any, outgoingNodes: any) {
    const center = node.position();
    const columnWidth = 380;
    const rowHeight = 110;
    const perColumn = 8;

    const place = (collection: any, direction: 1 | -1) => {
      const nodes = collection
        .toArray()
        .sort((a: any, b: any) => (a.data('label') || '').localeCompare(b.data('label') || ''));

      nodes.forEach((n: any, i: number) => {
        const column = Math.floor(i / perColumn);
        const indexInColumn = i % perColumn;
        const countInColumn = Math.min(perColumn, nodes.length - column * perColumn);

        if (!this.focusSavedPositions.has(n.id())) {
          this.focusSavedPositions.set(n.id(), { ...n.position() });
        }

        n.position({
          x: center.x + direction * columnWidth * (column + 1),
          y: center.y + (indexInColumn - (countInColumn - 1) / 2) * rowHeight
        });
      });
    };

    place(outgoingNodes, 1);
    place(incomingNodes, -1);
  }

  // Run the overview layout as soon as the graph container has real dimensions.
  // On first paint (or in an embedded/hidden pane) the container can be 0x0;
  // running grid then would stack every node on one spot.
  private runOverviewLayoutWhenVisible() {
    const cy = this.cy;
    const container = this.cytoscapeContainer.nativeElement;

    const runLayout = () => {
      if (!cy || cy.destroyed() || cy !== this.cy) {
        return;
      }
      cy.resize();
      cy.layout({
        name: 'grid',
        spacingFactor: 1.2,
        avoidOverlap: true,
        padding: 60,
        fit: true,
        animate: false,
        sort: this.clusterGridSort
      } as any).run();
      this.updateZoomLevel();
    };

    if (container.clientWidth > 0 && container.clientHeight > 0) {
      runLayout();
      return;
    }

    const observer = new ResizeObserver(() => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        observer.disconnect();
        runLayout();
      }
    });
    observer.observe(container);
  }

  private restoreFocusPositions() {
    this.focusSavedPositions.forEach((position, id) => {
      const n = this.cy.getElementById(id);
      if (n && n.length) {
        n.position(position);
      }
    });
    this.focusSavedPositions.clear();
  }

  constructor(
    private dataService: CareerDataService,
    private route: ActivatedRoute
  ) {
    // data will be loaded in ngOnInit; departments and salaryLevels are populated after load
  }

  selectQuickStartFunction(functionName: string) {
    // Find the node by label (case-insensitive partial match)
    const node = this.careerData.find(n =>
      n.label.toLowerCase().includes(functionName.toLowerCase())
    );

    if (node) {
      this.showWelcome = false;
      // Select and focus on the node
      setTimeout(() => {
        const cyNode = this.cy.getElementById(node.id);
        if (cyNode) {
          cyNode.trigger('tap');
        }
      }, 100);
    }
  }

  openHelp() {
    this.showWelcome = true;
  }

  // Navigation history methods
  addToHistory(node: NodeData) {
    // Don't add if it's the same as the last item
    if (this.navigationHistory.length > 0 &&
      this.navigationHistory[this.navigationHistory.length - 1].id === node.id) {
      return;
    }

    this.navigationHistory.push(node);

    // Keep only last 5 items
    if (this.navigationHistory.length > this.maxHistorySize) {
      this.navigationHistory.shift();
    }
  }

  goBack() {
    if (this.navigationHistory.length > 1) {
      // Remove current node
      this.navigationHistory.pop();
      // Get previous node
      const previousNode = this.navigationHistory[this.navigationHistory.length - 1];
      // Select it by triggering tap event
      const cyNode = this.cy.getElementById(previousNode.id);
      if (cyNode) {
        cyNode.trigger('tap');
        // Remove the duplicate entry that tap will add
        this.navigationHistory.pop();
      }
    }
  }

  canGoBack(): boolean {
    return this.navigationHistory.length > 1;
  }

  // Data will be loaded from the assets via CareerDataService
  private careerData: NodeData[] = [];
  private careerPaths: CareerPath[] = [];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.currentFamily = params['family'] === 'facility' ? 'facility' : 'care';
      // Reset data and reload
      this.careerData = [];
      this.careerPaths = [];
      if (this.cy) {
        this.cy.destroy(); // Optional: destroy existing graph to prevent conflicts
      }
      this.loadCareerData();
    });
  }

  loadCareerData() {
    // Load career data from service
    this.dataService.getCareerData(this.currentFamily).subscribe({
      next: (data) => {
        this.careerData = data.nodes || [];
        this.careerPaths = data.paths || [];

        // Populate filters
        this.departments = [...new Set(this.careerData.map(node => node.department))].sort();
        this.salaryLevels = [...new Set(this.careerData.map(node => node.salary))].sort();
        this.careTypes = [...new Set(this.careerData.map(node => node.careNonCare).filter(Boolean) as string[])].sort();
        this.careClusters = [...new Set(this.careerData.map(node => node.careCluster).filter(Boolean) as string[])].sort();

        // Legend: only the clusters that actually occur in this family
        this.legendItems = this.careClusters.map(name => ({
          name,
          color: CLUSTER_COLORS[name] || DEFAULT_CLUSTER_COLOR
        }));

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
          careCluster: node.careCluster || 'nvt', // Add care cluster to node data
          isRole: node.isRole || undefined
        }
      })),
      ...this.careerPaths
        .filter(path => {
          const sourceExists = this.careerData.some(n => n.id === path.from);
          const targetExists = this.careerData.some(n => n.id === path.to);
          return sourceExists && targetExists;
        })
        .map(path => {
          const targetNode = this.careerData.find(n => n.id === path.to);
          const isToRole = targetNode ? !!targetNode.isRole : false;
          return {
            data: {
              source: path.from,
              target: path.to,
              timeframe: path.timeframe,
              isToRole: isToRole || undefined
            }
          };
        })
    ];

    this.cy = cytoscape({
      container: this.cytoscapeContainer.nativeElement,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': DEFAULT_CLUSTER_COLOR, // Default purple for nvt/unknown
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
            'opacity': 1,
            'z-index': 1,
            'z-index-compare': 'manual'
          }
        },
        // Color by cluster, from the shared CLUSTER_COLORS map
        ...Object.entries(CLUSTER_COLORS).map(([cluster, color]) => ({
          selector: `node[careCluster="${cluster}"]`,
          style: {
            'background-color': color,
            'opacity': 1
          }
        })),
        // Role nodes (triangle shape, dashed border)
        {
          selector: 'node[isRole]',
          style: {
            'shape': 'triangle',
            'border-style': 'dashed',
            'border-width': '3px',
            'width': '140px',
            'height': '125px',
            'text-valign': 'center',
            'text-margin-y': 12,
            'text-max-width': '110px',
            'font-size': '13px'
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
            ...SUBTLE_EDGE_STYLE,
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'z-index-compare': 'manual',
            'events': 'no'
          }
        },
        // Paths leading to roles
        {
          selector: 'edge[isToRole]',
          style: {
            'line-style': 'dashed',
            'line-dash-pattern': [6, 4]
          }
        }
      ] as any,
      // Positions come from runOverviewLayoutWhenVisible(), which waits until
      // the container actually has dimensions (grid needs them to spread nodes)
      layout: { name: 'preset' } as any,
      // Disable built-in zoom
      userZoomingEnabled: false,
      minZoom: 0.1,
      maxZoom: 3,
      zoom: 1
    });

    this.runOverviewLayoutWhenVisible();

    // Custom zoom handler
    const zoomStep = 0.1;

    this.cytoscapeContainer.nativeElement.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault();

      // Start from the actual current zoom so wheel and buttons stay in sync
      let zoom = this.cy.zoom();
      if (event.deltaY < 0) {
        zoom = Math.min(zoom + zoomStep, 3);
      } else {
        zoom = Math.max(zoom - zoomStep, 0.1);
      }

      // Apply zoom centered on mouse position
      this.cy.zoom({
        level: zoom,
        renderedPosition: { x: event.offsetX, y: event.offsetY }
      });

      // Update zoom level display
      this.updateZoomLevel();

      // Adjust text visibility based on zoom level (only when labels are enabled)
      if (this.showLabels) {
        if (zoom < 0.3) {
          // Hide labels when zoomed out too much
          this.cy.style()
            .selector('node')
            .style({
              'font-size': '0px',
              'text-opacity': 0
            })
            .update();
        } else if (zoom < 0.6) {
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
      }
    });

    // Hover event handlers for tooltip
    this.cy.on('mouseover', 'node', (event: any) => {
      const nodeId = event.target.id();
      const node = event.target;

      this.hoveredNode = this.careerData.find(n => n.id === nodeId) || null;

      if (this.hoveredNode) {
        const renderedPosition = node.renderedPosition();
        const container = this.cytoscapeContainer.nativeElement;

        // Clamp horizontally so the tooltip never leaves the graph area
        const halfTooltipWidth = 160; // ~half of the 300px max-width plus margin
        const x = Math.max(
          halfTooltipWidth,
          Math.min(container.clientWidth - halfTooltipWidth, renderedPosition.x)
        );

        // Flip below the node when there is not enough room above it
        this.tooltipBelow = renderedPosition.y < 280;

        const nodeHalfHeight = typeof node.renderedOuterHeight === 'function'
          ? node.renderedOuterHeight() / 2
          : 40;
        const y = this.tooltipBelow
          ? renderedPosition.y + nodeHalfHeight + 10
          : renderedPosition.y - nodeHalfHeight - 10;

        this.tooltipPosition = { x, y };
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

      // Add to navigation history
      if (this.selectedNode) {
        this.addToHistory(this.selectedNode);
      }

      this.updateSelectedNodePaths(nodeId);

      // Put any previously focused neighbors back before arranging new ones
      this.restoreFocusPositions();

      // Clear cytoscape's native selection so no old orange border lingers
      this.cy.elements().unselect();

      // Reset edge styling
      this.cy.edges().style({
        'opacity': 0.01,
        'line-color': '#6b7280',
        'target-arrow-color': '#6b7280',
        'width': 1,
        'z-index': 5
      });

      // Hide all other nodes completely so nothing shows through the focus view,
      // and wipe any leftover selection border from a previous focus
      this.cy.nodes().style({
        'display': 'none',
        'opacity': 1,
        'border-color': '#ffffff',
        'border-width': '2px',
        'z-index': 1
      });

      const outgoingEdges = node.outgoers('edge');
      const outgoingNodes = outgoingEdges.targets().difference(node);
      const incomingEdges = node.incomers('edge');
      const incomingNodes = incomingEdges.sources().difference(outgoingNodes).difference(node);

      // Incoming paths (where you can come from) in blue — only when toggled on
      if (this.showIncomingPaths) {
        incomingEdges.style({
          'line-color': '#3b82f6',
          'target-arrow-color': '#3b82f6',
          'width': 3,
          'opacity': 0.9,
          'z-index': 15
        });
        incomingNodes.style({
          'display': 'element',
          'opacity': 0.75,
          'z-index': 25
        });
      }

      // Outgoing paths (where you can go) in green, on top
      outgoingEdges.style({
        'line-color': '#22c55e',
        'target-arrow-color': '#22c55e',
        'width': 4,
        'opacity': 1,
        'z-index': 20
      });
      outgoingNodes.style({
        'display': 'element',
        'opacity': 1,
        'z-index': 25
      });

      // Make selected node stand out prominently
      node.style({
        'display': 'element',
        'opacity': 1,
        'border-color': '#fbbf24',
        'border-width': '5px',
        'z-index': 30
      });

      // Arrange the neighborhood as a tidy focus view: incoming left, outgoing right
      this.applyFocusLayout(
        node,
        this.showIncomingPaths ? incomingNodes : this.cy.collection(),
        outgoingNodes
      );

      // Auto-zoom to fit selected node plus visible paths
      setTimeout(() => {
        let nodesToFit = node.union(outgoingNodes);
        if (this.showIncomingPaths) {
          nodesToFit = nodesToFit.union(incomingNodes);
        }

        this.cy.animate({
          fit: {
            eles: nodesToFit,
            padding: 60
          },
          duration: 400,
          easing: 'ease-out'
        });

        setTimeout(() => {
          // Don't blow a lone node up to max zoom (e.g. end of a career line)
          const maxFocusZoom = 1.2;
          if (this.cy.zoom() > maxFocusZoom) {
            this.cy.zoom(maxFocusZoom);
            this.cy.center(nodesToFit);
          }
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
    }

    // Auto-scroll on mobile
    this.scrollToDetails();
  }

  private scrollToDetails() {
    // Check if we are on mobile (using a simple width check)
    if (window.innerWidth < 768) {
      setTimeout(() => {
        const detailsElement = document.getElementById('function-details');
        if (detailsElement) {
          detailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }

  public resetView(): void {
    if (this.cy) {
      // Put focus-view neighbors back on their original spot
      this.restoreFocusPositions();

      this.resetSelectionAndStyles();

      // Reset zoom and fit
      this.cy.fit();
      this.updateZoomLevel();
    }
  }

  private resetSelectionAndStyles(): void {
    // Remove selected class from all nodes
    this.cy.nodes().removeClass('selected');

    // Clear selection
    this.selectedNode = null;
    this.selectedNodePaths = [];
    this.selectedNodeIncomingPaths = [];

    // Reset all nodes to be visible with proper colors based on their care cluster
    this.cy.nodes().forEach((node: any) => {
      const careCluster = node.data('careCluster');
      const backgroundColor = CLUSTER_COLORS[careCluster] || DEFAULT_CLUSTER_COLOR;

      node.style({
        'background-color': backgroundColor,
        'display': 'element',
        'opacity': 1,
        'border-width': '2px',
        'border-color': '#ffffff',
        'z-index': 1,
        'label': this.showLabels ? node.data('label') : '',
        'font-size': '14px',
        'text-opacity': this.showLabels ? 1 : 0
      });
    });

    // Reset all edges to the subtle overview styling
    this.cy.edges().style(SUBTLE_EDGE_STYLE);
  }

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

  getNodeById(nodeId: string): NodeData | undefined {
    return this.careerData.find(node => node.id === nodeId);
  }

  getClusterColor(cluster?: string): string {
    return (cluster && CLUSTER_COLORS[cluster]) || DEFAULT_CLUSTER_COLOR;
  }

  get activeFilterCount(): number {
    return [
      this.selectedDepartment,
      this.selectedSalaryLevel,
      this.selectedCareType,
      this.selectedCareCluster
    ].filter(Boolean).length;
  }

  updateSelectedNodePaths(nodeId: string) {
    // Outgoing: where you can go from this node
    this.selectedNodePaths = this.careerPaths.filter(path => path.from === nodeId);
    // Incoming: from which functions you can grow into this node
    this.selectedNodeIncomingPaths = this.careerPaths.filter(path => path.to === nodeId);
  }

  selectNodeById(nodeId: string) {
    const node = this.cy.getElementById(nodeId);
    if (node) {
      this.showWelcome = false; // Hide welcome screen when a node is selected
      // Trigger the tap event to update selection
      node.trigger('tap');

      this.scrollToDetails();
    }
  }

  // Filter nodes based on selected department and salary

  applyFilters() {
    // Reset all nodes and edges to fully visible first
    this.cy.nodes().style({
      'opacity': 1,
      'display': 'element',
      'z-index': 1
    });
    this.cy.edges().style(SUBTLE_EDGE_STYLE);

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
    this.cy.nodes().filter((node: any) => node.style('opacity') < 1).connectedEdges().style({
      'opacity': 0.05,
      'z-index': 5
    });

    // Smart fit: only fit if we don't have a selected node that is still visible
    const selectedNodeStillVisible = this.selectedNode &&
      this.cy.getElementById(this.selectedNode.id).style('opacity') === 1;

    if (!selectedNodeStillVisible) {
      // Fit the view to show visible nodes only if we lost our focus point
      this.cy.fit();
    }
  }

  toggleClusterFilter(cluster: string) {
    this.selectedCareCluster = this.selectedCareCluster === cluster ? '' : cluster;
    this.applyFilters();
  }

  resetFilters() {
    this.selectedDepartment = '';
    this.selectedSalaryLevel = '';
    this.selectedCareType = '';
    this.selectedCareCluster = '';
    this.cy.nodes().style({ 'display': 'element' });
    this.applyFilters();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  // Handle layout changes: always reset selection and view for a clean start
  changeLayout(event: Event) {
    const select = event.target as HTMLSelectElement;
    const layoutName = select.value;

    // A new layout re-positions everything, so forget saved focus positions
    this.focusSavedPositions.clear();
    this.resetSelectionAndStyles();

    const layoutOptions: any = {
      grid: {
        name: 'grid',
        avoidOverlap: true,
        spacingFactor: 1.2,
        sort: this.clusterGridSort
      },
      dagre: {
        name: 'dagre',
        rankDir: 'LR',
        nodeSep: 30,
        rankSep: 130
      },
      breadthfirst: {
        name: 'breadthfirst',
        directed: true,
        spacingFactor: 2.0,  // Increased spacing for hierarchical view
        avoidOverlap: true,
        circle: false,
        grid: false,
        roots: undefined,  // Auto-detect roots
        maximal: false
      },
      cose: {
        name: 'cose',
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

    const layout = this.cy.layout({
      ...layoutOptions[layoutName],
      animate: true,
      animationDuration: 500,
      padding: 60,
      fit: true
    });

    // Run the layout
    layout.run();

    // When layout completes, restore node styles
    layout.one('layoutstop', () => {
      // Force re-apply node dimensions and font sizes
      this.cy.nodes().forEach((node: any) => {
        const isRole = node.data('isRole');
        node.style({
          'width': isRole ? '140px' : '150px',
          'height': isRole ? '125px' : '80px',
          'font-size': isRole ? '13px' : '14px',
          'text-max-width': isRole ? '110px' : '140px'
        });
      });

      // Update zoom level display
      this.updateZoomLevel();
    });
  }

  // Toggle incoming paths in the focus view; re-applies the current selection
  toggleIncomingPaths() {
    this.showIncomingPaths = !this.showIncomingPaths;

    if (this.selectedNode && this.cy) {
      const cyNode = this.cy.getElementById(this.selectedNode.id);
      if (cyNode && cyNode.length) {
        cyNode.trigger('tap');
      }
    }
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
    if (this.keyboardShortcutsInitialized) {
      return;
    }
    this.keyboardShortcutsInitialized = true;

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
