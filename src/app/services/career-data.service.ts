import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

export interface NodeData {
  id: string;
  label: string;
  department: string;
  level: string;
  description: string;
  requirements: string; // Fixed: changed from string[] to string
  salary: string;
  irregularity?: string;
  roles?: string;
  werkenbijlink?: string;
  careNonCare?: string; // Maps to "Care/non care" from JSON
  careCluster?: string; // Maps to "Care cluster" from JSON
  pioLink?: string; // Maps to "Link naar PIO werkenbij (ter bespreking)" from JSON
}

export interface CareerPath {
  from: string;
  to: string;
  timeframe?: string;
}

export interface CareerData {
  nodes: NodeData[];
  paths: CareerPath[];
}

interface NodesResponse {
  nodes: NodeData[];
}

interface PathsResponse {
  paths: CareerPath[];
}

@Injectable({
  providedIn: 'root'
})
export class CareerDataService {
  constructor(private http: HttpClient) { }

  getCareerData(): Observable<CareerData> {
    const timestamp = new Date().getTime();
    return forkJoin({
      nodes: this.http.get<any>(`assets/data/career-nodes.json?v=${timestamp}`),
      paths: this.http.get<PathsResponse>(`assets/data/career-paths.json?v=${timestamp}`)
    }).pipe(
      map(response => ({
        nodes: response.nodes.nodes.map((node: any) => ({
          ...node,
          careNonCare: node['Care/non care'],
          careCluster: node['Care cluster'],
          pioLink: node['Link naar PIO werkenbij (ter bespreking)']
        })),
        paths: response.paths.paths
      }))
    );
  }
}
