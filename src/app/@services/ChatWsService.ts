import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root'
})
export class ChatWsService {

  private client!: Client;

  connect(): Promise<void> {

    return new Promise((resolve) => {

      this.client = new Client({

        brokerURL: 'ws://localhost:8080/ws',

        reconnectDelay: 5000

      });

      this.client.onConnect = () => {

        console.log('WebSocket Connected');

        resolve();
      };

      this.client.activate();
    });
  }

  subscribe(groupId: number, callback: Function) {

    this.client.subscribe(
      `/topic/group/${groupId}`,
      (msg) => callback(JSON.parse(msg.body))
    );

  }

  sendMessage(payload: any) {

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload)
    });

  }

}
