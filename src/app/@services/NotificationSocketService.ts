import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationSocketService {

  private client!: Client;

  private unreadCountSubject = new Subject<number>();

  unreadCount$ = this.unreadCountSubject.asObservable();

  connect(userId: number) {

    this.client = new Client({

      brokerURL: 'ws://localhost:8080/ws',

      reconnectDelay: 5000,

      debug: (str: any) => {
        console.log(str);
      },

      onConnect: () => {

        console.log('WebSocket connected');

        this.client.subscribe(`/topic/notify/${userId}`, (message: any) => {

          const body = JSON.parse(message.body);

          console.log('WS message:', body);

          if (body.type === 'UNREAD_COUNT') {
            this.unreadCountSubject.next(body.count);
          }

        });

      },

      onStompError: (frame: any) => {
        console.error('Broker error:', frame);
      }

    });

    this.client.activate();
  }

  disconnect() {
    this.client?.deactivate();
  }
}
