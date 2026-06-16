import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../@models/user.model';

@Injectable({
  providedIn: 'root',
})
export class HttpClientService {
  get(arg0: string) {
    throw new Error('Method not implemented.');
  }
  constructor(private httpClient: HttpClient) {}
  basicUrl = environment.apiUrl;
  // basicUrl = 'http://localhost:8081/';
  // basicUrl = 'https://labels-biz-sheep-concerning.trycloudflare.com/';
  // getApi(url: string) {
  //   return this.httpClient.get(url);
  // }
  // postApi(url: string, postData: any) {
  //   return this.httpClient.post(url, postData);
  // }
  // putApi(url: string, putData: any) {
  //   return this.httpClient.put(url, putData);
  // }
  // deleteApi(url: string) {
  //   return this.httpClient.delete(url);
  // }

  getApi(path: string) {
    console.log("url: ", this.basicUrl+path)
    return this.httpClient.get(`${this.basicUrl}/${path}`);
  }

  postApi(path: string, body: any) {
    return this.httpClient.post(`${this.basicUrl}/${path}`, body);
  }

  putApi(path: string, body: any) {
    return this.httpClient.put(`${this.basicUrl}/${path}`, body);
  }

  deleteApi(path: string) {
    return this.httpClient.delete(`${this.basicUrl}/${path}`);
  }
}
