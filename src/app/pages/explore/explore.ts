import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { CareerDataService, NodeData, CareerPath } from '../../services/career-data.service';
import { renderRichText, stripRichText } from '../../services/rich-text';

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

// Display names for clusters whose stored value is internal jargon
const CLUSTER_LABELS: Record<string, string> = {
  'nvt': 'Algemeen'
};

const CARE_NON_CARE_LABELS: Record<string, string> = {
  'care': 'Zorg',
  'non care': 'Ondersteunend (niet-zorg)'
};

/** Data follows the functiehuis spelling ("medewerker Logistiek B1"); on screen
 * every name starts with a capital so lists and legends read consistently. */
function capitalize(value?: string): string {
  const text = (value || '').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/** Sort key for salary scales such as "FWG 35"; scales without a number last. */
function salaryRank(salary?: string): number {
  const match = String(salary || '').match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

// Edges are deliberately achromatic. Hue is reserved for one job only -
// telling clusters apart - so a coloured line can never read as "this line
// belongs to the green cluster". Direction is carried by tone and weight
// instead. (Freeing green and blue for the edges by re-hueing the clusters
// was measured and is worse: it drops colour-blind separation between
// clusters from dE 8.2 to 2.9, because it strips two of the few
// well-separated hues out of a palette that already carries 8 categories.)
const OUTGOING_EDGE_COLOR = '#9ca3af'; // soft grey: where you can grow to
const INCOMING_EDGE_COLOR = '#cbd5e1'; // lighter grey: where you can come from

// Subtle edge styling for the overview: with this many cross-references the
// lines are only a hint; they gain weight and contrast once a node is selected
const SUBTLE_EDGE_STYLE = {
  'opacity': 0.15,
  'line-color': '#9ca3af',
  'target-arrow-color': '#9ca3af',
  'width': 1.5,
  'z-index': 10
};

// Accent for steps that lead into the other career family
const CROSS_FAMILY_COLOR = '#a855f7';

// Focus view: neighbours grouped in one card per cluster (sizes in graph units)
const FOREIGN_GROUP = '__foreign';
const FOCUS_CHIP_W = 230;
const FOCUS_CHIP_H = 46;
const FOCUS_GAP = 8;
const FOCUS_PAD = 14;
const FOCUS_HEADER = 34;
const FOCUS_COLUMNS = 2;
const FOCUS_GROUP_GAP = 22;
const FOCUS_OFFSET = 170;     // from the selected function's centre to the cards
const FOCUS_MIN_ZOOM = 0.5;   // below this the chip labels stop being readable

/** Dark text on light fills, white on dark ones (WCAG relative luminance). */
function readableTextColor(hex: string): string {
  const rgb = (hex.replace('#', '').match(/../g) || []).map(h => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  return luminance > 0.25 ? '#111827' : '#ffffff';
}

const FAMILY_LABELS: Record<string, string> = {
  care: 'Zorg',
  facility: 'Facilitair'
};

// Band across the bottom of a regular function that also carries an extra role.
// Drawn as a background image because cytoscape has no per-side node styling.
const EXTRA_ROLE_BAR = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="22" viewBox="0 0 150 22">' +
  '<rect width="150" height="22" fill="#ffffff" fill-opacity="0.92"/>' +
  '<text x="75" y="15.5" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" ' +
  'font-size="11" font-weight="bold" fill="#374151">extra rol</text>' +
  '</svg>'
);

/** A regular function that also carries an extra role (Rollen Status = ja). */
function hasExtraRole(node: NodeData): boolean {
  return !node.isRole && String(node.roles || '').trim().toLowerCase() === 'ja';
}

export interface LegendItem {
  name: string;  // stored value, used for filtering
  label: string; // what the employee reads
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
  selectedNodeCrossFamilyPaths: CareerPath[] = [];

  // Sidebar list sections: collapsed on desktop for calm, open on mobile
  // (mobile has no graph, so the lists are the only way to navigate)
  private isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
  showOutgoingList = this.isMobileView;
  showIncomingList = this.isMobileView;

  // Bumped on every new selection to retrigger the details attention animation
  detailsPulse = 0;
  linkCopied = false;

  // Free-text fields rendered once per selection rather than on every change
  // detection pass (each pass would re-sanitize the string)
  selectedDescriptionHtml = '';
  selectedRequirementsHtml = '';

  // Filter properties
  departments: string[] = [];
  selectedDepartment: string = '';
  salaryLevels: string[] = [];
  selectedSalaryLevel: string = '';
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
  // Function nodes currently drawn as a chip inside a focus-view cluster card
  private focusChipIds = new Set<string>();

  // Grid sort: group by cluster, then by salary scale, so the overview reads as blocks of color
  private clusterGridSort = (a: any, b: any): number => {
    const clusterA = a.data('careCluster') || '';
    const clusterB = b.data('careCluster') || '';
    if (clusterA !== clusterB) {
      return clusterA.localeCompare(clusterB);
    }
    return salaryRank(a.data('salary')) - salaryRank(b.data('salary'));
  };

  // Group the neighbourhood per cluster: one card per cluster with the
  // functions as compact chips inside, and ONE bundled line from the selected
  // function to each card. Incoming to the left, outgoing to the right.
  //
  // A line per function (the old fan) never crosses a box, but with 25+ steps
  // the fan grew so wide that everything had to be zoomed out until nothing was
  // readable. Bundling keeps the line count at the number of clusters, and the
  // cards stack compactly enough to stay at a readable zoom.
  private applyFocusLayout(node: any, incomingNodes: any, outgoingNodes: any): any {
    const center = node.position();
    let cards = this.cy.collection();

    const place = (collection: any, side: 'in' | 'out') => {
      const groups = new Map<string, any[]>();
      collection.forEach((n: any) => {
        const key = n.data('isForeign') ? FOREIGN_GROUP : (n.data('careCluster') || 'nvt');
        groups.set(key, [...(groups.get(key) || []), n]);
      });
      if (groups.size === 0) {
        return;
      }

      // Alphabetical, with the catch-all cluster and the other family last
      const order = (key: string) => key === FOREIGN_GROUP ? 2 : key === 'nvt' ? 1 : 0;
      const keys = [...groups.keys()].sort((a, b) =>
        order(a) - order(b) || this.getClusterLabel(a).localeCompare(this.getClusterLabel(b)));

      const cardWidth = FOCUS_PAD * 2 + FOCUS_COLUMNS * FOCUS_CHIP_W + (FOCUS_COLUMNS - 1) * FOCUS_GAP;
      const heights = keys.map(key => {
        const rows = Math.ceil(groups.get(key)!.length / FOCUS_COLUMNS);
        return FOCUS_PAD * 2 + FOCUS_HEADER + rows * FOCUS_CHIP_H + (rows - 1) * FOCUS_GAP;
      });
      const total = heights.reduce((a, b) => a + b, 0) + (keys.length - 1) * FOCUS_GROUP_GAP;
      const cardCenterX = center.x + (side === 'out' ? 1 : -1) * (FOCUS_OFFSET + cardWidth / 2);
      let top = center.y - total / 2;

      keys.forEach((key, i) => {
        const members = groups.get(key)!.sort((a: any, b: any) =>
          salaryRank(a.data('salary')) - salaryRank(b.data('salary')) ||
          (a.data('label') || '').localeCompare(b.data('label') || ''));
        const color = key === FOREIGN_GROUP ? CROSS_FAMILY_COLOR : this.getClusterColor(key);
        const label = key === FOREIGN_GROUP
          ? `Andere familie · ${members.length}`
          : `${this.getClusterLabel(key)} · ${members.length}`;

        const card = this.cy.add({
          group: 'nodes',
          classes: 'focus-decor',
          data: { id: `__focus-${side}-${i}`, label, isDecor: true },
          position: { x: cardCenterX, y: top + heights[i] / 2 }
        });
        card.style({
          'shape': 'round-rectangle',
          'width': cardWidth,
          'height': heights[i],
          'background-color': '#ffffff',
          'background-opacity': 0.92,
          'border-color': color,
          'border-width': 2,
          'border-style': key === FOREIGN_GROUP ? 'dashed' : 'solid',
          'label': label,
          'color': '#1f2937',
          'text-outline-width': 0,
          'font-size': '17px',
          'font-weight': 'bold',
          'text-wrap': 'none',
          'text-valign': 'top',
          'text-halign': 'center',
          'text-margin-y': FOCUS_PAD + FOCUS_HEADER - 4,
          'z-index': 2,
          'events': 'no'
        });
        cards = cards.union(card);

        // Chips: the real function nodes, so hover and click keep working
        const left = cardCenterX - cardWidth / 2 + FOCUS_PAD;
        members.forEach((n: any, j: number) => {
          if (!this.focusSavedPositions.has(n.id())) {
            this.focusSavedPositions.set(n.id(), { ...n.position() });
          }
          const col = j % FOCUS_COLUMNS;
          const row = Math.floor(j / FOCUS_COLUMNS);
          n.position({
            x: left + col * (FOCUS_CHIP_W + FOCUS_GAP) + FOCUS_CHIP_W / 2,
            y: top + FOCUS_PAD + FOCUS_HEADER + row * (FOCUS_CHIP_H + FOCUS_GAP) + FOCUS_CHIP_H / 2
          });
          const fill = n.data('isForeign') ? '#e9d5ff' : this.getClusterColor(n.data('careCluster'));
          n.style({
            'display': 'element',
            'opacity': 1,
            'shape': 'round-rectangle',
            'width': FOCUS_CHIP_W,
            'height': FOCUS_CHIP_H,
            'font-size': '15px',
            'text-max-width': `${FOCUS_CHIP_W - 14}px`,
            'text-margin-y': 0,
            'color': readableTextColor(fill),
            'text-outline-width': 0,
            'background-image': 'none',
            'border-width': n.data('isRole') ? 2 : 1,
            'border-style': n.data('isRole') ? 'dashed' : 'solid',
            'border-color': n.data('isRole') ? '#374151' : '#ffffff',
            'z-index': 25
          });
          this.focusChipIds.add(n.id());
        });

        // One bundled line per cluster
        const edge = this.cy.add({
          group: 'edges',
          classes: 'focus-decor',
          data: {
            id: `__focus-edge-${side}-${i}`,
            source: side === 'out' ? node.id() : card.id(),
            target: side === 'out' ? card.id() : node.id()
          }
        });
        const lineColor = key === FOREIGN_GROUP
          ? CROSS_FAMILY_COLOR
          : side === 'out' ? OUTGOING_EDGE_COLOR : INCOMING_EDGE_COLOR;
        edge.style({
          'curve-style': 'taxi',
          'taxi-direction': 'horizontal',
          'taxi-turn': '50%',
          'line-color': lineColor,
          'target-arrow-color': lineColor,
          'line-style': key === FOREIGN_GROUP ? 'dashed' : 'solid',
          'width': side === 'out' ? 4 : 3,
          'opacity': 1,
          'z-index': 20
        });

        top += heights[i] + FOCUS_GROUP_GAP;
      });
    };

    place(outgoingNodes, 'out');
    place(incomingNodes, 'in');
    return cards;
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
      // Foreign nodes are excluded from the overview, so they must not take up
      // a grid cell either
      cy.nodes('[isForeign]').style({ 'display': 'none' });
      const layout = cy.nodes('[!isForeign]').layout({
        name: 'grid',
        spacingFactor: 1.2,
        avoidOverlap: true,
        padding: 60,
        fit: true,
        animate: false,
        sort: this.clusterGridSort
      } as any);

      // Wait for the layout to settle: its own fit lands asynchronously and
      // would otherwise pan the viewport away from a deep-linked selection
      layout.one('layoutstop', () => {
        this.updateZoomLevel();
        this.applyPendingSelection();
      });

      layout.run();
    };

    if (container.clientWidth > 0 && container.clientHeight > 0) {
      runLayout();
      return;
    }

    // On mobile the graph pane is hidden altogether, so the observer would
    // never fire; a deep link must still open its function in the sidebar
    this.applyPendingSelection();

    const observer = new ResizeObserver(() => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        observer.disconnect();
        runLayout();
      }
    });
    observer.observe(container);
  }

  // The view buttons float over the top-right of the graph. When the cards
  // run under them, use the free room on the left first and only then zoom
  // out, just enough for the cards to end left of the buttons
  private keepClearOfControls(eles: any) {
    const controls = this.cytoscapeContainer.nativeElement.parentElement?.querySelector('.top-4.right-4');
    if (!controls) {
      return;
    }
    const padding = 50;
    const containerRect = this.cytoscapeContainer.nativeElement.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    const controlsLeft = controlsRect.left - containerRect.left - 16;
    const controlsBottom = controlsRect.bottom - containerRect.top;
    let box = eles.renderedBoundingBox();
    if (box.x2 <= controlsLeft || box.y1 >= controlsBottom) {
      return;
    }

    const scale = Math.min(1, (controlsLeft - padding) / box.w);
    if (scale < 1) {
      const level = Math.max(FOCUS_MIN_ZOOM, this.cy.zoom() * scale);
      this.cy.zoom({ level, renderedPosition: { x: box.x1, y: (box.y1 + box.y2) / 2 } });
      box = eles.renderedBoundingBox();
    }
    this.cy.panBy({ x: padding - box.x1, y: 0 });
  }

  // The legend floats over the bottom-left of the graph; fold it away when it
  // would cover the selected function (it opens again with one click)
  private keepClearOfLegend(node: any) {
    const legend = this.cytoscapeContainer.nativeElement.parentElement?.querySelector('.help-tips');
    if (!legend || !this.showLegend) {
      return;
    }
    const containerRect = this.cytoscapeContainer.nativeElement.getBoundingClientRect();
    const legendRect = legend.getBoundingClientRect();
    const box = node.renderedBoundingBox();
    const legendTop = legendRect.top - containerRect.top;
    const legendRight = legendRect.right - containerRect.left;
    if (box.y2 > legendTop && box.x1 < legendRight) {
      this.showLegend = false;
    }
  }

  // Put the focus view away: drop the cluster cards and bundled lines, give the
  // chips their normal function shape back and return them to their spot
  private restoreFocusPositions() {
    this.cy.remove('.focus-decor');
    this.focusChipIds.forEach(id => {
      const n = this.cy.getElementById(id);
      if (n && n.length) {
        n.removeStyle('shape width height font-size text-max-width text-margin-y color ' +
          'text-outline-width background-image border-style');
      }
    });
    this.focusChipIds.clear();

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
    private route: ActivatedRoute,
    private router: Router
  ) {
    // data will be loaded in ngOnInit; departments and salaryLevels are populated after load
  }

  // Quick-start buttons point at a node id: labels follow the functiehuis and
  // change with feedback, ids stay put
  selectQuickStartFunction(nodeId: string) {
    const node = this.careerData.find(n => n.id === nodeId);

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
  private foreignNodeIds = new Set<string>();
  private loadedFamily: string | null = null;
  private pendingNodeId = '';

  isForeignNode(node?: NodeData | null): boolean {
    return !!node && !!node.family && node.family !== this.currentFamily;
  }

  getFamilyLabel(family?: string): string {
    return FAMILY_LABELS[family || ''] || family || '';
  }

  get otherFamilyLabel(): string {
    return this.getFamilyLabel(this.currentFamily === 'care' ? 'facility' : 'care');
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const family = params['family'] === 'facility' ? 'facility' : 'care';
      const nodeId = params['node'] || '';

      // Only rebuild the graph when the family actually changes; selecting a
      // node rewrites the URL too and must not trigger a full reload
      if (family !== this.loadedFamily) {
        this.currentFamily = family;
        this.loadedFamily = family;
        this.pendingNodeId = nodeId;
        this.careerData = [];
        this.careerPaths = [];
        this.navigationHistory = [];
        this.selectedNode = null;
        if (this.cy) {
          this.cy.destroy(); // Destroy existing graph to prevent conflicts
          this.cy = null;
        }
        this.loadCareerData();
        return;
      }

      // Same family: apply a deep link to a node we are not showing yet
      if (nodeId && nodeId !== this.selectedNode?.id) {
        if (this.cy) {
          this.selectNodeById(nodeId);
        } else {
          this.pendingNodeId = nodeId;
        }
      }
    });
  }

  loadCareerData() {
    // Load career data from service
    this.dataService.getCareerData(this.currentFamily).subscribe({
      next: (data) => {
        this.careerData = (data.nodes || []).map(node => ({
          ...node,
          label: capitalize(node.label),
          level: capitalize(node.level),
          department: capitalize(node.department)
        }));
        this.careerPaths = data.paths || [];

        // Nodes from another family are only reachable as a cross-family step;
        // they stay out of the overview, the filters and the search
        this.foreignNodeIds = new Set(
          this.careerData.filter(node => this.isForeignNode(node)).map(node => node.id)
        );
        const ownNodes = this.careerData.filter(node => !this.foreignNodeIds.has(node.id));

        // Populate filters
        this.departments = [...new Set(ownNodes.map(node => node.department).filter(Boolean))].sort();
        this.salaryLevels = [...new Set(ownNodes.map(node => node.salary).filter(Boolean))]
          .sort((a, b) => salaryRank(a) - salaryRank(b) || a.localeCompare(b));
        this.careClusters = [...new Set(ownNodes.map(node => node.careCluster).filter(Boolean) as string[])].sort();

        // Legend: only the clusters that actually occur in this family
        this.legendItems = this.careClusters.map(name => ({
          name,
          label: this.getClusterLabel(name),
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
          isRole: node.isRole || undefined,
          isForeign: this.foreignNodeIds.has(node.id) || undefined,
          hasExtraRole: hasExtraRole(node) || undefined
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
              isToRole: isToRole || undefined,
              isCrossFamily: this.foreignNodeIds.has(path.to) || undefined
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
        // Regular function that also carries an extra role: band along the
        // bottom edge, with the label lifted clear of it
        {
          selector: 'node[hasExtraRole]',
          style: {
            'background-image': EXTRA_ROLE_BAR,
            'background-fit': 'none',
            'background-width': '100%',
            'background-height': '22px',
            'background-position-x': '50%',
            'background-position-y': '100%',
            'background-clip': 'node',
            'background-image-opacity': 1,
            'text-margin-y': -10
          }
        },
        // Nodes from the other career family: dashed violet border marks them
        // as a doorway rather than a step inside this family
        {
          selector: 'node[isForeign]',
          style: {
            'border-color': CROSS_FAMILY_COLOR,
            'border-width': '5px',
            'border-style': 'dashed'
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

        // Add hover style to node (neutral: hue stays reserved for clusters).
        // Darker than the edges on purpose - a hover ring has to register.
        node.style({
          'border-color': '#4b5563',
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

      // Clicking a node of the other family jumps to that family's graph
      if (this.foreignNodeIds.has(nodeId)) {
        this.openInOtherFamily(nodeId);
        return;
      }

      // Remove selected class from all nodes
      this.cy.nodes().removeClass('selected');
      // Add selected class to clicked node
      node.addClass('selected');

      this.selectedNode = this.careerData.find(node => node.id === nodeId) || null;

      // Add to navigation history
      if (this.selectedNode) {
        this.addToHistory(this.selectedNode);
        this.announceSelection(nodeId);
      }

      this.updateSelectedNodePaths(nodeId);

      // Put any previously focused neighbors back before arranging new ones
      this.restoreFocusPositions();

      // Clear cytoscape's native selection so no old orange border lingers
      this.cy.elements().unselect();

      // Reset edge styling
      this.cy.edges().style({
        'opacity': 0,
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
      const incomingEdges = node.incomers('edge');
      // A function you can both come from and grow to sits on the incoming side
      // while instroom is shown - otherwise it would look as if it were missing
      // there - and on the outgoing side otherwise
      const twoWayNodes = this.showIncomingPaths
        ? incomingEdges.sources().intersection(outgoingEdges.targets())
        : this.cy.collection();
      const outgoingNodes = outgoingEdges.targets().difference(node).difference(twoWayNodes);
      const incomingNodes = incomingEdges.sources().difference(outgoingNodes).difference(node);

      // The individual edges stay hidden: the focus view draws one bundled
      // line per cluster instead (see applyFocusLayout)

      // Make selected node stand out prominently
      node.style({
        'display': 'element',
        'opacity': 1,
        'border-color': '#fbbf24',
        'border-width': '5px',
        'z-index': 30
      });

      // Arrange the neighborhood as cluster cards: incoming left, outgoing right
      const cards = this.applyFocusLayout(
        node,
        this.showIncomingPaths ? incomingNodes : this.cy.collection(),
        outgoingNodes
      );

      // Auto-zoom to fit selected node plus its cluster cards
      setTimeout(() => {
        const nodesToFit = node.union(cards);

        this.cy.animate({
          fit: {
            eles: nodesToFit,
            padding: 50
          },
          duration: 400,
          easing: 'ease-out'
        });

        setTimeout(() => {
          // Re-assert the framing once the animation is done: a layout or
          // resize finishing late can leave the viewport panned elsewhere
          this.cy.fit(nodesToFit, 50);

          // Don't blow a lone node up to max zoom (e.g. end of a career line),
          // and never zoom out so far that the chips can't be read: then the
          // view starts at the selected function and the rest is a scroll away
          const maxFocusZoom = 1.2;
          if (this.cy.zoom() > maxFocusZoom) {
            this.cy.zoom(maxFocusZoom);
            this.cy.center(nodesToFit);
          } else if (this.cy.zoom() < FOCUS_MIN_ZOOM) {
            this.cy.zoom(FOCUS_MIN_ZOOM);
            this.cy.center(node);
          }
          this.keepClearOfControls(nodesToFit);
          this.keepClearOfLegend(node);
          this.updateZoomLevel();
        }, 450);
      }, 50);
    });

    // Hide tooltip when panning or zooming
    this.cy.on('viewport', () => {
      this.showTooltip = false;
    });

    // Last: the overview layout also applies a deep-linked selection, which
    // needs the tap handler above to be registered
    this.runOverviewLayoutWhenVisible();
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

      // Reset zoom and fit to the nodes that are actually shown
      this.cy.fit(this.cy.nodes('[!isForeign]'));
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

      const isForeign = node.data('isForeign');

      node.style({
        'background-color': backgroundColor,
        // Nodes of the other family stay out of the overview; they only
        // surface in the focus view of a node that links to them
        'display': isForeign ? 'none' : 'element',
        'opacity': 1,
        'border-width': isForeign ? '5px' : '2px',
        'border-color': isForeign ? CROSS_FAMILY_COLOR : '#ffffff',
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
      !this.foreignNodeIds.has(node.id) &&
      (node.label.toLowerCase().includes(query) ||
        node.department.toLowerCase().includes(query))
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

  getClusterLabel(cluster?: string): string {
    return capitalize((cluster && CLUSTER_LABELS[cluster]) || cluster || '');
  }

  getCareNonCareLabel(value?: string): string {
    const key = (value || '').trim().toLowerCase();
    return CARE_NON_CARE_LABELS[key] || capitalize(value);
  }

  // A path's timeframe holds either an indicative duration ("3-5 jaar") or a
  // condition ("mits HBO"); durations get a "ca." so they don't read as a rule
  private isDuration(timeframe?: string): boolean {
    return /^\s*\d+\s*(-\s*\d+\s*)?jaar\s*$/i.test(timeframe || '');
  }

  formatTimeframe(timeframe?: string): string {
    const text = (timeframe || '').trim();
    return this.isDuration(text) ? `ca. ${text}` : capitalize(text);
  }

  timeframeHint(timeframe?: string): string {
    return this.isDuration(timeframe)
      ? 'Indicatie: zo lang duurt het ongeveer voordat deze stap reëel is'
      : 'Voorwaarde voor deze stap';
  }

  get activeFilterCount(): number {
    return [
      this.selectedDepartment,
      this.selectedSalaryLevel,
      this.selectedCareCluster
    ].filter(Boolean).length;
  }

  hasExtraRole(node?: NodeData | null): boolean {
    return !!node && hasExtraRole(node);
  }

  tooltipDescription(node?: NodeData | null): string {
    return stripRichText(node?.description);
  }

  updateSelectedNodePaths(nodeId: string) {
    this.selectedDescriptionHtml = renderRichText(this.selectedNode?.description);
    this.selectedRequirementsHtml = renderRichText(this.selectedNode?.requirements);

    const outgoing = this.careerPaths.filter(path => path.from === nodeId);

    // Steps into the other family are listed separately, as a deliberate switch
    this.selectedNodeCrossFamilyPaths = outgoing.filter(path => this.foreignNodeIds.has(path.to));
    // Outgoing: where you can go from this node inside this family
    this.selectedNodePaths = outgoing.filter(path => !this.foreignNodeIds.has(path.to));
    // Incoming: from which functions you can grow into this node
    this.selectedNodeIncomingPaths = this.careerPaths.filter(path => path.to === nodeId);
  }

  // Bump the attention animation and keep the URL in sync so every function
  // has its own shareable address
  private announceSelection(nodeId: string) {
    this.detailsPulse++;
    this.linkCopied = false;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { family: this.currentFamily, node: nodeId },
      replaceUrl: true
    });
  }

  // Jump to the same node in the family it actually belongs to
  openInOtherFamily(nodeId: string) {
    const target = this.careerData.find(n => n.id === nodeId);
    if (!target?.family) {
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { family: target.family, node: nodeId }
    });
  }

  private applyPendingSelection() {
    const nodeId = this.pendingNodeId;
    this.pendingNodeId = '';

    if (!nodeId || !this.cy) {
      return;
    }

    const node = this.cy.getElementById(nodeId);
    if (node && node.length) {
      this.showWelcome = false;
      node.trigger('tap');
    }
  }

  copyNodeLink() {
    if (!this.selectedNode) {
      return;
    }

    const url = `${window.location.origin}${window.location.pathname}` +
      `?family=${this.currentFamily}&node=${encodeURIComponent(this.selectedNode.id)}`;

    navigator.clipboard?.writeText(url).then(() => {
      this.linkCopied = true;
      setTimeout(() => { this.linkCopied = false; }, 2500);
    }).catch(() => {
      this.linkCopied = false;
    });
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
    // Filters work on the overview, so leave the focus view first
    this.restoreFocusPositions();

    // Reset all nodes and edges to fully visible first (foreign nodes stay out)
    this.cy.nodes('[!isForeign]').style({
      'opacity': 1,
      'display': 'element',
      'z-index': 1
    });
    this.cy.nodes('[isForeign]').style({ 'display': 'none' });
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
      this.cy.fit(this.cy.nodes('[!isForeign]'));
    }
  }

  toggleClusterFilter(cluster: string) {
    this.selectedCareCluster = this.selectedCareCluster === cluster ? '' : cluster;
    this.applyFilters();
  }

  resetFilters() {
    this.selectedDepartment = '';
    this.selectedSalaryLevel = '';
    this.selectedCareCluster = '';
    this.applyFilters();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  // Handle layout changes: always reset selection and view for a clean start
  changeLayout(event: Event) {
    const select = event.target as HTMLSelectElement;
    const layoutName = select.value;

    // A new layout re-positions everything; just put the focus view away first
    this.restoreFocusPositions();
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

    // Lay out only the nodes of this family; foreign nodes stay hidden
    const layout = this.cy.nodes('[!isForeign]').layout({
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
