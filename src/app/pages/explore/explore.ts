import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [RouterLink],
  templateUrl: './explore.html',
  styleUrl: './explore.css'
})
export class Explore implements OnInit, AfterViewInit {
  @ViewChild('cytoscapeContainer', { static: true }) cytoscapeContainer!: ElementRef;
  
  cy: any;
  selectedNode: NodeData | null = null;

  private careerData: NodeData[] = [
    {
      id: 'nurse-assistant',
      label: 'Nurse Assistant',
      department: 'Nursing',
      level: 'Entry Level',
      description: 'Provide basic patient care under supervision of registered nurses.',
      requirements: ['High school diploma', 'CNA certification', 'Basic life support'],
      salary: '$25,000 - $35,000'
    },
    {
      id: 'registered-nurse',
      label: 'Registered Nurse',
      department: 'Nursing',
      level: 'Professional',
      description: 'Provide direct patient care, administer medications, and coordinate care plans.',
      requirements: ['Bachelor\'s in Nursing', 'RN License', 'Clinical experience'],
      salary: '$60,000 - $80,000'
    },
    {
      id: 'nurse-manager',
      label: 'Nurse Manager',
      department: 'Nursing',
      level: 'Management',
      description: 'Lead nursing staff, manage unit operations, and ensure quality care.',
      requirements: ['BSN/MSN', 'Management experience', 'Leadership skills'],
      salary: '$80,000 - $100,000'
    },
    {
      id: 'med-tech',
      label: 'Medical Technologist',
      department: 'Laboratory',
      level: 'Professional',
      description: 'Perform complex laboratory tests and analyze results.',
      requirements: ['Bachelor\'s in Medical Technology', 'Laboratory certification'],
      salary: '$50,000 - $70,000'
    }
  ];

  private careerPaths: CareerPath[] = [
    { from: 'nurse-assistant', to: 'registered-nurse', timeframe: '2-4 years' },
    { from: 'registered-nurse', to: 'nurse-manager', timeframe: '5-7 years' }
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
          selector: 'node[level="Entry Level"]',
          style: { 'background-color': '#059669' }
        },
        {
          selector: 'node[level="Management"]',
          style: { 'background-color': '#dc2626' }
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
      }
    });

    this.cy.on('tap', 'node', (event: any) => {
      const nodeId = event.target.id();
      this.selectedNode = this.careerData.find(node => node.id === nodeId) || null;
    });
  }

  resetView() {
    if (this.cy) {
      this.cy.fit();
      this.cy.center();
    }
  }
}