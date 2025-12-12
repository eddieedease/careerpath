import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

export interface NodeData {
  id: string;
  label: string;
  department: string;
  level: string;
  description: string;
  requirements: string[];
  salary: string;
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
      nodes: this.http.get<NodesResponse>(`assets/data/career-nodes.json?v=${timestamp}`),
      paths: this.http.get<PathsResponse>(`assets/data/career-paths.json?v=${timestamp}`)
    }).pipe(
      map(response => ({
        nodes: response.nodes.nodes,
        paths: response.paths.paths
      }))
    );
  }
}
