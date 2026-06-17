import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root'
})
export class ChatWsService {

  private connected = false;

  private client!: Client;

  private subscribedGroups = new Set<number>();
  connect(): Promise<void> {
const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';

    if (this.connected) {
      return Promise.resolve();
    }


    return new Promise((resolve) => {

      this.client = new Client({

<<<<<<< HEAD
        brokerURL: 'ws://localhost:8081/ws',
=======
        // brokerURL: 'ws://localhost:8081/ws',
>>>>>>> origin/ZJ

        brokerURL: `${protocol}${window.location.host}/ws`,

        reconnectDelay: 5000

      });

      this.client.onConnect = () => {

        this.connected = true;

        console.log('WebSocket Connected');

        resolve();
      };

      this.client.activate();
    });
  }

  subscribe(groupId: number, callback: Function) {

    console.log("訂閱聊天室", groupId);

    if (this.subscribedGroups.has(groupId)) {
      return;
    }

    this.subscribedGroups.add(groupId);

    this.client.subscribe(
      `/topic/group/${groupId}`,
      (msg) => {

        console.log("收到WS", msg.body);

        callback(
          JSON.parse(msg.body)
        );

      }
    );
  }

  subscribeOnline(callback: Function) {

    this.client.subscribe(
      '/topic/group/global',
      (msg) => {

        callback(
          JSON.parse(msg.body)
        );

      }
    );

  }

  sendMessage(payload: any) {

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload)
    });

  }

}
