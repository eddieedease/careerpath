import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CareerDataService, NodeData, CareerPath } from '../../services/career-data.service';

@Component({
  selector: 'app-admin',
  imports: [RouterLink, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  standalone: true
})
export class Admin implements OnInit {
  currentFamily: 'care' | 'facility' = 'care';
  nodes: NodeData[] = [];
  paths: CareerPath[] = [];
  filteredNodes: NodeData[] = [];
  filteredPaths: CareerPath[] = [];
  
  searchQuery: string = '';
  pathSearchQuery: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  // UI state
  activeTab: 'nodes' | 'paths' = 'nodes';
  showNodeModal: boolean = false;
  showPathModal: boolean = false;
  isEditingNode: boolean = false;

  // Auth state
  isAuthenticated: boolean = false;
  passwordInput: string = '';
  loginErrorMessage: string = '';
  isCheckingAuth: boolean = true;

  // Node Form State
  nodeForm = {
    id: '',
    label: '',
    department: '',
    level: '',
    salary: '',
    description: '',
    requirements: '',
    irregularity: '',
    roles: 'nee',
    werkenbijlink: '',
    careNonCare: '',
    careCluster: '',
    pioLink: '',
    isRole: false,
    originalId: ''
  };

  // Path Form State
  pathForm = {
    from: '',
    to: '',
    timeframe: ''
  };

  // Typeahead state for paths
  fromSearch: string = '';
  toSearch: string = '';
  showFromDropdown: boolean = false;
  showToDropdown: boolean = false;

  get filteredFromNodes(): NodeData[] {
    const query = this.fromSearch.toLowerCase().trim();
    if (!query) return this.nodes;
    return this.nodes.filter(n =>
      n.label.toLowerCase().includes(query) ||
      n.id.toLowerCase().includes(query)
    );
  }

  get filteredToNodes(): NodeData[] {
    const query = this.toSearch.toLowerCase().trim();
    if (!query) return this.nodes;
    return this.nodes.filter(n =>
      n.label.toLowerCase().includes(query) ||
      n.id.toLowerCase().includes(query)
    );
  }

  constructor(private dataService: CareerDataService) {}

  ngOnInit() {
    const savedPassword = sessionStorage.getItem('admin_password');
    if (savedPassword) {
      this.dataService.verifyPassword(savedPassword).subscribe({
        next: () => {
          this.isAuthenticated = true;
          this.isCheckingAuth = false;
          this.loadData();
        },
        error: () => {
          sessionStorage.removeItem('admin_password');
          this.isAuthenticated = false;
          this.isCheckingAuth = false;
        }
      });
    } else {
      this.isAuthenticated = false;
      this.isCheckingAuth = false;
    }
  }

  login() {
    this.loginErrorMessage = '';
    if (!this.passwordInput.trim()) {
      this.loginErrorMessage = 'Wachtwoord is verplicht.';
      return;
    }
    this.dataService.verifyPassword(this.passwordInput).subscribe({
      next: () => {
        sessionStorage.setItem('admin_password', this.passwordInput);
        this.isAuthenticated = true;
        this.passwordInput = '';
        this.loginErrorMessage = '';
        this.loadData();
      },
      error: (err) => {
        this.loginErrorMessage = err.error?.message || 'Ongeldig wachtwoord.';
      }
    });
  }

  logout() {
    sessionStorage.removeItem('admin_password');
    this.isAuthenticated = false;
    this.nodes = [];
    this.paths = [];
    this.filteredNodes = [];
    this.filteredPaths = [];
    this.pathSearchQuery = '';
    this.clearMessages();
  }

  handleUnauthorized() {
    sessionStorage.removeItem('admin_password');
    this.isAuthenticated = false;
    this.errorMessage = 'Sessie verlopen of wachtwoord onjuist. Log opnieuw in.';
  }

  setFamily(family: 'care' | 'facility') {
    if (!this.isAuthenticated) return;
    this.currentFamily = family;
    this.loadData();
  }

  setTab(tab: 'nodes' | 'paths') {
    if (!this.isAuthenticated) return;
    this.activeTab = tab;
    this.clearMessages();
  }

  loadData() {
    this.clearMessages();
    this.dataService.getCareerData(this.currentFamily).subscribe({
      next: (data) => {
        this.nodes = data.nodes || [];
        this.paths = data.paths || [];
        this.applySearch();
        this.applyPathSearch();
      },
      error: (err) => {
        if (err.status === 401) {
          this.handleUnauthorized();
        } else {
          this.errorMessage = 'Fout bij het laden van gegevens. Controleer of de Docker-omgeving actief is.';
        }
        console.error(err);
      }
    });
  }

  applySearch() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredNodes = [...this.nodes];
    } else {
      this.filteredNodes = this.nodes.filter(n =>
        n.label.toLowerCase().includes(query) ||
        n.id.toLowerCase().includes(query) ||
        n.department.toLowerCase().includes(query)
      );
    }
  }

  applyPathSearch() {
    const query = this.pathSearchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredPaths = [...this.paths];
    } else {
      this.filteredPaths = this.paths.filter(p => {
        const fromLabel = this.getNodeLabel(p.from).toLowerCase();
        const toLabel = this.getNodeLabel(p.to).toLowerCase();
        return fromLabel.includes(query) ||
               toLabel.includes(query) ||
               p.from.toLowerCase().includes(query) ||
               p.to.toLowerCase().includes(query);
      });
    }
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Node Modal actions
  openAddNodeModal() {
    this.clearMessages();
    this.isEditingNode = false;
    this.nodeForm = {
      id: '',
      label: '',
      department: '',
      level: '',
      salary: '',
      description: '',
      requirements: '',
      irregularity: '',
      roles: 'nee',
      werkenbijlink: '',
      careNonCare: this.currentFamily === 'care' ? 'Care' : 'non care',
      careCluster: '',
      pioLink: '',
      isRole: false,
      originalId: ''
    };
    this.showNodeModal = true;
  }

  openEditNodeModal(node: NodeData) {
    this.clearMessages();
    this.isEditingNode = true;
    this.nodeForm = {
      id: node.id,
      label: node.label,
      department: node.department || '',
      level: node.level || '',
      salary: node.salary || '',
      description: node.description || '',
      requirements: node.requirements || '',
      irregularity: node.irregularity || '',
      roles: node.roles || 'nee',
      werkenbijlink: node.werkenbijlink || '',
      careNonCare: node.careNonCare || '',
      careCluster: node.careCluster || '',
      pioLink: node.pioLink || '',
      isRole: !!node.isRole,
      originalId: node.id
    };
    this.showNodeModal = true;
  }

  closeNodeModal() {
    this.showNodeModal = false;
  }

  saveNode() {
    this.clearMessages();
    if (!this.nodeForm.id.trim() || !this.nodeForm.label.trim()) {
      this.errorMessage = 'ID en Label zijn verplichte velden.';
      return;
    }

    // Auto-generate standard IDs if it's a new node and has uppercase/spaces
    if (!this.isEditingNode) {
      this.nodeForm.id = this.nodeForm.id.toLowerCase().replace(/\s+/g, '-').trim();
    }

    const payload = {
      ...this.nodeForm,
      family: this.currentFamily
    };

    this.dataService.saveNode(payload).subscribe({
      next: (res) => {
        this.successMessage = `Functie '${this.nodeForm.label}' is succesvol opgeslagen.`;
        this.showNodeModal = false;
        this.loadData();
      },
      error: (err) => {
        if (err.status === 401) {
          this.handleUnauthorized();
        } else {
          this.errorMessage = err.error?.message || 'Fout bij het opslaan van de functie.';
        }
        console.error(err);
      }
    });
  }

  deleteNode(node: NodeData) {
    this.clearMessages();
    if (confirm(`Weet je zeker dat je de functie '${node.label}' (${node.id}) wilt verwijderen? Dit verwijdert ook automatisch alle inkomende en uitgaande verbindingen.`)) {
      this.dataService.deleteNode(node.id, this.currentFamily).subscribe({
        next: () => {
          this.successMessage = `Functie '${node.label}' is succesvol verwijderd.`;
          this.loadData();
        },
        error: (err) => {
          if (err.status === 401) {
            this.handleUnauthorized();
          } else {
            this.errorMessage = 'Fout bij het verwijderen van de functie.';
          }
          console.error(err);
        }
      });
    }
  }

  // Path Modal actions
  openAddPathModal() {
    this.clearMessages();
    this.pathForm = {
      from: '',
      to: '',
      timeframe: ''
    };
    this.fromSearch = '';
    this.toSearch = '';
    this.showFromDropdown = false;
    this.showToDropdown = false;
    this.showPathModal = true;
  }

  selectFromNode(node: NodeData) {
    this.pathForm.from = node.id;
    this.fromSearch = node.label;
    this.showFromDropdown = false;
  }

  selectToNode(node: NodeData) {
    this.pathForm.to = node.id;
    this.toSearch = node.label;
    this.showToDropdown = false;
  }

  closeFromDropdown() {
    setTimeout(() => {
      this.showFromDropdown = false;
      const selected = this.nodes.find(n => n.id === this.pathForm.from);
      if (selected) {
        this.fromSearch = selected.label;
      } else {
        this.fromSearch = '';
      }
    }, 200);
  }

  closeToDropdown() {
    setTimeout(() => {
      this.showToDropdown = false;
      const selected = this.nodes.find(n => n.id === this.pathForm.to);
      if (selected) {
        this.toSearch = selected.label;
      } else {
        this.toSearch = '';
      }
    }, 200);
  }

  onFromSearchChange() {
    this.showFromDropdown = true;
    if (!this.fromSearch.trim()) {
      this.pathForm.from = '';
    }
  }

  onToSearchChange() {
    this.showToDropdown = true;
    if (!this.toSearch.trim()) {
      this.pathForm.to = '';
    }
  }

  closePathModal() {
    this.showPathModal = false;
  }

  savePath() {
    this.clearMessages();
    if (!this.pathForm.from || !this.pathForm.to) {
      this.errorMessage = 'Beide functies zijn verplicht.';
      return;
    }
    if (this.pathForm.from === this.pathForm.to) {
      this.errorMessage = 'Een functie kan niet met zichzelf verbonden worden.';
      return;
    }

    const payload = {
      ...this.pathForm,
      family: this.currentFamily
    };

    this.dataService.savePath(payload).subscribe({
      next: () => {
        this.successMessage = 'Verbinding succesvol aangemaakt.';
        this.showPathModal = false;
        this.loadData();
      },
      error: (err) => {
        if (err.status === 401) {
          this.handleUnauthorized();
        } else {
          this.errorMessage = err.error?.message || 'Fout bij het opslaan van de verbinding.';
        }
        console.error(err);
      }
    });
  }

  deletePath(path: CareerPath) {
    this.clearMessages();
    const fromLabel = this.getNodeLabel(path.from);
    const toLabel = this.getNodeLabel(path.to);
    if (confirm(`Weet je zeker dat je de verbinding van '${fromLabel}' naar '${toLabel}' wilt verwijderen?`)) {
      this.dataService.deletePath(path.from, path.to, this.currentFamily).subscribe({
        next: () => {
          this.successMessage = 'Verbinding succesvol verwijderd.';
          this.loadData();
        },
        error: (err) => {
          if (err.status === 401) {
            this.handleUnauthorized();
          } else {
            this.errorMessage = 'Fout bij het verwijderen van de verbinding.';
          }
          console.error(err);
        }
      });
    }
  }

  getNodeLabel(id: string): string {
    return this.nodes.find(n => n.id === id)?.label || id;
  }
}
