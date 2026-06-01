import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HttpClientService {
  get(arg0: string) {
    throw new Error('Method not implemented.');
  }
  constructor(private httpClient: HttpClient) {}
  basicUrl = 'http://localhost:8080/';
  getApi(url: string) {
    return this.httpClient.get(url);
  }
  postApi(url: string, postData: any) {
    return this.httpClient.post(url, postData);
  }
  putApi(url: string, putData: any) {
    return this.httpClient.put(url, putData);
  }
  deleteApi(url: string) {
    return this.httpClient.delete(url);
  }
}
