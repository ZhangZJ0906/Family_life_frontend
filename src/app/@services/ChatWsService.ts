import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

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

        brokerURL: 'ws://localhost:8081/ws',

        // brokerURL: `${protocol}${window.location.host}/ws`,

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

    const sub = this.client.subscribe(
      `/topic/group/${groupId}`,
      (msg) => {

        console.log("收到WS", msg.body);

        callback(
          JSON.parse(msg.body)
        );

      }
    );

    // ⭐ 存起來
    this.subscriptions.set(groupId, sub);
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

  private subscriptions = new Map<number, StompSubscription>();

  // =========================
  // UNSUBSCRIBE SINGLE GROUP
  // =========================
  unsubscribe(groupId: number) {

    const sub = this.subscriptions.get(groupId);

    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(groupId);
    }

    this.subscribedGroups.delete(groupId);
  }

  // =========================
  // DISCONNECT ALL (🔥 logout 用)
  // =========================
  disconnect() {

    console.log('WS disconnect');

    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
    this.subscribedGroups.clear();

    if (this.client?.connected) {
      this.client.deactivate();
    }

    this.connected = false;
  }

  sendMessage(payload: any) {

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload)
    });

  }

  enterRoom(groupId: number, userId: number) {
    console.log("UID: ", userId + "is enterroom");
    this.client.publish({
      destination: '/app/chat.enter',
      body: JSON.stringify({
        groupId,
        userId
      })
    });

  }

  leaveRoom(groupId: number, userId: number) {
        console.log("UID: ", userId + "is leaveroom");
    this.client.publish({
      destination: '/app/chat.leave',
      body: JSON.stringify({
        groupId,
        userId
      })
    });

  }

  //判斷是否死了
  sendHeartbeat(groupId: number, userId: number) {

    if (!this.client?.connected) return;

    this.client.publish({
      destination: '/app/chat.heartbeat',
      body: JSON.stringify({
        groupId,
        userId
      })
    });
  }

}
