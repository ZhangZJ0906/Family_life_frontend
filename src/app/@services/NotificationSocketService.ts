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

<<<<<<< HEAD
      debug: (str) => {
=======
      debug: (str: any) => {
>>>>>>> origin/ZJ
        console.log(str);
      },

      onConnect: () => {

        console.log('WebSocket connected');

<<<<<<< HEAD
        this.client.subscribe(`/topic/notify/${userId}`, (message) => {
=======
        this.client.subscribe(`/topic/notify/${userId}`, (message: any) => {
>>>>>>> origin/ZJ

          const body = JSON.parse(message.body);

          console.log('WS message:', body);

          if (body.type === 'UNREAD_COUNT') {
            this.unreadCountSubject.next(body.count);
          }

        });

      },

<<<<<<< HEAD
      onStompError: (frame) => {
=======
      onStompError: (frame: any) => {
>>>>>>> origin/ZJ
        console.error('Broker error:', frame);
      }

    });

    this.client.activate();
  }

  disconnect() {
    this.client?.deactivate();
  }
}
