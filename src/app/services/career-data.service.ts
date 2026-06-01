import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  isRole?: boolean;
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

@Injectable({
  providedIn: 'root'
})
export class CareerDataService {
  private apiBaseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  private getHeaders(customPassword?: string) {
    const password = customPassword !== undefined ? customPassword : (sessionStorage.getItem('admin_password') || '');
    return {
      headers: {
        'X-Admin-Password': password
      }
    };
  }

  verifyPassword(password: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/verify.php`, {}, this.getHeaders(password));
  }

  getCareerData(family: 'care' | 'facility' = 'care'): Observable<CareerData> {
    return this.http.get<CareerData>(`${this.apiBaseUrl}/get-data.php?family=${family}`);
  }

  saveNode(node: NodeData & { originalId?: string; family: string }): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/save-node.php`, node, this.getHeaders());
  }

  deleteNode(id: string, family: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/delete-node.php`, { id, family }, this.getHeaders());
  }

  savePath(path: { from: string; to: string; timeframe: string; family: string }): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/save-path.php`, path, this.getHeaders());
  }

  deletePath(from: string, to: string, family: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/delete-path.php`, { from, to, family }, this.getHeaders());
  }
}
