import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpClientService } from './@services/http-client.service';

export interface CalendarEventReq {
  groupId?: number;
  createdBy?: number;
  title: string;
  description: string;
  eventTime: string;
  notifyBefore: number;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarApiService {

  // private baseUrl = 'http://localhost:8080/calendar';
  // private baseUrl = 'https://labels-biz-sheep-concerning.trycloudflare.com/calendar';
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  getByGroup(groupId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/group/${groupId}`);
  }

  create(data: CalendarEventReq): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, data);
  }

  update(id: number, data: CalendarEventReq): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number, userId: number, groupId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}/${userId}/${groupId}`);
  }
}
