import { Component, OnInit } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { CalendarApiService } from '../../calendar-api.service';
import Swal from 'sweetalert2';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
// import { RouterLink } from '@angular/router';
import { HttpClientService } from '../../@services/http-client.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  MatSelect,
  MatSelectChange,
  MatSelectModule,
} from '@angular/material/select';
import { FormsModule } from '@angular/forms'; // ← 加這個
import { DropDownGroupList } from '../../common/interfaceList';
import { MatDialog } from '@angular/material/dialog';
import { CalendarEventDialogComponent } from '../calendar-event-dialog/calendar-event-dialog.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    FormsModule,
    FullCalendarModule,
    TopbarComponent,

    MatFormFieldModule,
    MatSelect,
    MatSelectModule,
  ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent {
  selectedGroupId: any;
  userGroupList: DropDownGroupList[] = [];
  currentGroupId: number | null = null;
  userInfo!: any;
  createdBy!: number;

  // FullCalendar 的主要設定
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: 'zh-tw',
    editable: true, // 開啟拖曳
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek',
    },
    events: [],
    dateClick: this.handleDateClick.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventDrop: this.handleEventDrop.bind(this), // 拖曳後觸發
  };

  constructor(
    private dialog: MatDialog,
    private calendarApiService: CalendarApiService,
    private http: HttpClientService,
  ) {
    this.userInfo = JSON.parse(
      sessionStorage.getItem('family-life-current-user')!,
    );
    this.createdBy = this.userInfo.user_id;
    this.getUserGroupList(this.createdBy);
  }

  getUserGroupList(userId: number) {
    this.http
      .getApi(this.http.basicUrl + `family_life/getGroupList?user_Id=${userId}`)
      .subscribe({
        next: (res: any) => {
          if (res.code != 200) {
            Swal.fire({
              title: '拉取群組錯誤',
              text: res.message || 'server error',
              icon: 'error',
            });
            return;
          }
          this.userGroupList = res.groupIdList;

          this.userGroupList = Object.entries(res.groupIdList).map(
            ([id, name]) => ({
              groupId: Number(id),
              groupName: name as string,
            }),
          );
          this.userGroupList.unshift({
            groupId: 0,
            groupName: '私人活動',
          });
          this.selectedGroupId = this.userGroupList[0].groupId;
          this.currentGroupId = this.userGroupList[0].groupId;
          this.loadCalendarEvents(this.currentGroupId, this.createdBy);
        },
        error: (err) => {
          Swal.fire({
            title: '拉取群組錯誤',
            text: err.message || 'server error',
            icon: 'error',
          });
          return;
        },
      });
  }
  // 從後端查詢某個家庭群組的所有行事曆事件
  loadCalendarEvents(groupId: number | null, userId: number): void {
    /* this.calendarApiService.getByGroup(this.currentGroupId).subscribe({
       next: (res) => {
         if (res.code! = 200) {
           Swal.fire({
             icon: 'error',
             title: '查詢行事曆失敗',
             text: res.message || '請確認後端是否啟動',
           });
         }

          //將後端資料格式轉成 FullCalendar 可以讀的格式
         const fullCalendarEvents = res.data.map((item: any) => ({

           id: String(item.id),
           title: item.title,
           start: item.eventTime,
           end: item.endTime,
           extendedProps: {
             description: item.description,
             notifyBefore: item.notifyBefore,
             createdBy: item.createdBy,
             groupId: item.groupId,
           },
         }));

          //更新 FullCalendar 事件資料
         this.calendarOptions = {
           ...this.calendarOptions,
           events: fullCalendarEvents,
         };
       },
       error: (err) => {
         Swal.fire({
           icon: 'error',
           title: '查詢行事曆失敗',
           text: err.error?.message || '請確認後端是否啟動',
         });
       },
     });*/

    //2026-05-24 by ZJ 試試看新東西
    let url = this.http.basicUrl + `calendar/getUserEventInfo?userId=${userId}`;
    if (groupId !== null && groupId !== 0) {
      url += `&groupId=${groupId}`;
    }
    this.http.getApi(url).subscribe({
      next: (res: any) => {
        if (res.code !== 200) {
          Swal.fire({
            icon: 'error',
            title: '查詢行事曆失敗',
            text: res.message || '請確認後端是否啟動',
          });
        }

        // 將後端資料格式轉成 FullCalendar 可以讀的格式
        const fullCalendarEvents = res.data.map((item: any) => ({
          id: String(item.id),
          title: item.title,
          start: item.eventTime,
          end: item.endTime,
          extendedProps: {
            description: item.description,
            notifyBefore: item.notifyBefore,
            createdBy: item.createdBy,
            groupId: item.groupId,
          },
        }));

        // 更新 FullCalendar 事件資料
        this.calendarOptions = {
          ...this.calendarOptions,
          events: fullCalendarEvents,
        };
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: '查詢行事曆失敗',
          text: err.error?.message || '請確認後端是否啟動',
        });
      },
    });
  }

  onGroupChange(event: MatSelectChange) {
    this.currentGroupId = event.value === 0 ? null : event.value;
    this.loadCalendarEvents(this.currentGroupId, this.createdBy);
  }
  // 點擊日期時新增活動，日期會帶入使用者點到的日期
  handleDateClick(info: DateClickArg): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clickDate = new Date(info.dateStr);
    clickDate.setHours(0, 0, 0, 0);

    if (clickDate < today) {
      Swal.fire({
        icon: 'warning',
        title: '不可新增到今日之前',
        text: '請選擇今天或未來日期',
        confirmButtonText: '確認',
      });

      return;
    }

    this.createCalendarEvent(info.dateStr);
  }

  // HTML「新增活動」按鈕會呼叫這個方法
  //   openCreateDialog(): void {
  //     this.createCalendarEvent();
  //   }
  //   // 共用新增活動方法
  //   createCalendarEvent(dateStr?: string): void {
  //     Swal.fire({
  //       title: '新增行事曆事件',
  //       didOpen: () => {
  //         (document.getElementById('createEventTime') as HTMLInputElement).value =
  //           '';
  //         (document.getElementById('createEndTime') as HTMLInputElement).value =
  //           '';
  //       },
  //       html: `
  //   <div class="swal-form">

  //     <div class="form-row">
  //       <label>活動名稱</label>
  //       <input id="createTitle" class="swal2-input" placeholder="請輸入活動名稱">
  //     </div>

  //     <div class="form-row">
  //       <label>活動描述</label>
  //       <input id="createDescription" class="swal2-input" placeholder="請輸入活動描述">
  //     </div>

  //     <div class="form-row">
  //       <label>開始日期</label>
  //       <input id="createEventDate" type="date" class="swal2-input" value="${dateStr || ''}">
  //     </div>

  //     <div class="form-row">
  //       <label>開始時間</label>
  //       <input id="createEventTime" type="time" class="swal2-input" value="" autocomplete="off">
  //     </div>

  //     <div class="form-row">
  //       <label>結束日期</label>
  //       <input id="createEndDate" type="date" class="swal2-input" value="${dateStr || ''}">
  //     </div>

  //     <div class="form-row">
  //       <label>結束時間</label>
  //       <input id="createEndTime" type="time" class="swal2-input" value="" autocomplete="off">
  //     </div>

  //     <div class="form-row">
  //       <label>提醒時間</label>
  //       <input id="createNotifyBefore" type="number" class="swal2-input" placeholder="提前幾分鐘通知">
  //     </div>

  //   </div>
  // `,
  //       preConfirm: () => {
  //         const title = (
  //           document.getElementById('createTitle') as HTMLInputElement
  //         ).value;
  //         const description = (
  //           document.getElementById('createDescription') as HTMLInputElement
  //         ).value;
  //         const eventDate = (
  //           document.getElementById('createEventDate') as HTMLInputElement
  //         ).value;
  //         const eventTime = (
  //           document.getElementById('createEventTime') as HTMLInputElement
  //         ).value;
  //         const endDate = (
  //           document.getElementById('createEndDate') as HTMLInputElement
  //         ).value;
  //         const endTime = (
  //           document.getElementById('createEndTime') as HTMLInputElement
  //         ).value;
  //         const notifyBefore = Number(
  //           (document.getElementById('createNotifyBefore') as HTMLInputElement)
  //             .value,
  //         );
  //         const startDateTime = `${eventDate}T${eventTime}:00`;
  //         const endDateTime = `${endDate}T${endTime}:00`;
  //         const today = new Date();
  //         today.setHours(0, 0, 0, 0);

  //         const selectedDate = new Date(eventDate);
  //         selectedDate.setHours(0, 0, 0, 0);

  //         if (selectedDate < today) {
  //           Swal.showValidationMessage('不可新增到今日之前');
  //           return;
  //         }

  //         if (!title) {
  //           Swal.showValidationMessage('活動名稱不可為空');
  //           return;
  //         }

  //         if (!eventDate) {
  //           Swal.showValidationMessage('活動日期不可為空');
  //           return;
  //         }

  //         if (!eventTime) {
  //           Swal.showValidationMessage('開始時間不可為空');
  //           return;
  //         }

  //         if (endDate && !endTime) {
  //           Swal.showValidationMessage('結束時間不可為空');
  //           return;
  //         }

  //         if (endDate && startDateTime > endDateTime) {
  //           Swal.showValidationMessage('開始時間不可大於結束時間');
  //           return;
  //         }
  //         return {
  //           groupId: this.currentGroupId,
  //           createdBy: this.createdBy,
  //           title,
  //           description,
  //           eventTime: startDateTime,
  //           endTime: endDate ? endDateTime : null,
  //           notifyBefore,
  //         };
  //       },
  //     }).then((result) => {
  //       if (!result.isConfirmed || !result.value) {
  //         return;
  //       }

  //       this.calendarApiService.create(result.value).subscribe({
  //         next: () => {
  //           Swal.fire({
  //             icon: 'success',
  //             title: '新增成功',
  //             showConfirmButton: true,
  //             confirmButtonText: '確認',
  //           });

  //           this.loadCalendarEvents(this.currentGroupId, this.createdBy);
  //         },
  //         error: (err) => {
  //           Swal.fire({
  //             icon: 'error',
  //             title: '新增失敗',
  //             text: err.error?.message || '請稍後再試',
  //             showConfirmButton: true,
  //             confirmButtonText: '確認',
  //           });
  //         },
  //       });
  //     });
  //   }

  createCalendarEvent(dateStr?: string): void {
  const groupId =
    this.currentGroupId === 0 ||
    this.currentGroupId === undefined
      ? null
      : this.currentGroupId;

  // 依照目前選到的 groupId 找群組名稱
  const selectedGroup = this.userGroupList.find(
    group => Number(group.groupId) === Number(this.currentGroupId)
  );

  // 私人活動顯示「私人活動」
  const groupName = groupId === null
    ? '私人活動'
    : selectedGroup?.groupName || '未選擇群組';

  const ref = this.dialog.open(CalendarEventDialogComponent, {
    width: '760px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    panelClass: 'calendar-event-dialog-panel',
    autoFocus: false,
    data: {
      mode: 'create',
      dateStr,
      groupId: groupId,
      groupName: groupName,
    },
  });

  ref.afterClosed().subscribe((result) => {
    if (!result) {
      return;
    }

    const payload = {
      groupId: groupId,
      createdBy: this.createdBy,
      ...result,
    };

    console.log('createCalendarEvent payload:', payload);

    this.calendarApiService.create(payload).subscribe({
      next: (res: any) => {
        if (res.code !== 200) {
          Swal.fire({
            icon: 'error',
            title: '新增失敗',
            text: res.message,
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: '新增成功',
          confirmButtonText: '確認',
        });

        this.loadCalendarEvents(groupId, this.createdBy);
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: '新增失敗',
          text: err.error?.message || '伺服器發生錯誤',
        });
      },
    });
  });
}
  // 修改活動視窗
  //   openUpdateDialog(info: EventClickArg): void {
  //     const eventId = Number(info.event.id);

  //     const oldTitle = info.event.title;
  //     const oldDescription = info.event.extendedProps['description'] || '';
  //     const oldNotifyBefore = info.event.extendedProps['notifyBefore'] || '';

  //     const oldDate = info.event.startStr.substring(0, 10);
  //     const oldTime = info.event.startStr.substring(11, 16);
  //     const oldEndDate = info.event.endStr
  //       ? info.event.endStr.substring(0, 10)
  //       : '';
  //     const oldEndTime = info.event.endStr
  //       ? info.event.endStr.substring(11, 16)
  //       : '';
  //     Swal.fire({
  //       title: '修改行事曆事件',
  //       html: `
  //   <div class="swal-form">

  //     <div class="form-row">
  //       <label>活動名稱</label>
  //       <input
  //         id="updateTitle"
  //         class="swal2-input"
  //         placeholder="活動名稱"
  //         value="${oldTitle}">
  //     </div>

  //     <div class="form-row">
  //       <label>活動描述</label>
  //       <input
  //         id="updateDescription"
  //         class="swal2-input"
  //         placeholder="活動描述"
  //         value="${oldDescription}">
  //     </div>

  //     <div class="form-row">
  //       <label>開始日期</label>
  //       <input
  //         id="updateEventDate"
  //         type="date"
  //         class="swal2-input"
  //         value="${oldDate}">
  //     </div>

  //     <div class="form-row">
  //       <label>開始時間</label>
  //       <input
  //         id="updateEventTime"
  //         type="time"
  //         class="swal2-input"
  //         value="${oldTime}">
  //     </div>

  //     <div class="form-row">
  //       <label>結束日期</label>
  //       <input
  //         id="updateEndDate"
  //         type="date"
  //         class="swal2-input"
  //         value="${oldEndDate}">
  //     </div>

  //     <div class="form-row">
  //       <label>結束時間</label>
  //       <input
  //         id="updateEndTime"
  //         type="time"
  //         class="swal2-input"
  //         value="${oldEndTime}">
  //     </div>

  //     <div class="form-row">
  //       <label>提醒時間</label>
  //       <input
  //         id="updateNotifyBefore"
  //         type="number"
  //         class="swal2-input"
  //         placeholder="提前幾分鐘通知"
  //         value="${oldNotifyBefore}">
  //     </div>

  //   </div>
  // `,
  //       preConfirm: () => {
  //         const title = (
  //           document.getElementById('updateTitle') as HTMLInputElement
  //         ).value;
  //         const description = (
  //           document.getElementById('updateDescription') as HTMLInputElement
  //         ).value;
  //         const eventDate = (
  //           document.getElementById('updateEventDate') as HTMLInputElement
  //         ).value;
  //         const eventTime = (
  //           document.getElementById('updateEventTime') as HTMLInputElement
  //         ).value;
  //         const endDate = (
  //           document.getElementById('updateEndDate') as HTMLInputElement
  //         ).value;
  //         const endTime = (
  //           document.getElementById('updateEndTime') as HTMLInputElement
  //         ).value;
  //         const notifyBefore = Number(
  //           (document.getElementById('updateNotifyBefore') as HTMLInputElement)
  //             .value,
  //         );
  //         const startDateTime = `${eventDate}T${eventTime}:00`;
  //         const endDateTime = `${endDate}T${endTime}:00`;
  //         const today = new Date();
  //         today.setHours(0, 0, 0, 0);
  //         const selectedDate = new Date(eventDate);
  //         selectedDate.setHours(0, 0, 0, 0);
  //         if (selectedDate < today) {
  //           Swal.showValidationMessage('不可新增到今日之前');
  //           return;
  //         }

  //         if (!title) {
  //           Swal.showValidationMessage('活動名稱不可為空');
  //           return;
  //         }

  //         if (!eventDate) {
  //           Swal.showValidationMessage('活動日期不可為空');
  //           return;
  //         }

  //         if (endDate && startDateTime > endDateTime) {
  //           Swal.showValidationMessage('開始時間不可大於結束時間');
  //           return;
  //         }

  //         return {
  //           title,
  //           description,
  //           eventTime: startDateTime,
  //           endTime: endDate ? endDateTime : null,
  //           notifyBefore,
  //         };
  //       },
  //     }).then((result) => {
  //       if (!result.isConfirmed || !result.value) {
  //         return;
  //       }

  //       this.calendarApiService.update(eventId, result.value).subscribe({
  //         next: () => {
  //           Swal.fire({
  //             icon: 'success',
  //             title: '修改成功',
  //             confirmButtonText: '確認',
  //           });

  //           this.loadCalendarEvents(this.currentGroupId, this.createdBy);
  //         },
  //         error: (err) => {
  //           Swal.fire({
  //             icon: 'error',
  //             title: '修改失敗',
  //             text: err.error?.message || '請稍後再試',
  //           });
  //         },
  //       });
  //     });
  //   }

 openUpdateDialog(info: EventClickArg): void {
  // 私人活動：currentGroupId 為 0、undefined、null 時，送 null
  const groupId =
    this.currentGroupId === 0 ||
    this.currentGroupId === undefined ||
    this.currentGroupId === null
      ? null
      : this.currentGroupId;

  // 找出目前選到的群組名稱
  const selectedGroup = this.userGroupList.find(
    group => Number(group.groupId) === Number(this.currentGroupId)
  );

  // Dialog 顯示用的群組名稱
  const groupName =
    groupId === null
      ? '私人活動'
      : selectedGroup?.groupName || '未選擇群組';

  const ref = this.dialog.open(CalendarEventDialogComponent, {
    width: '760px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    panelClass: 'calendar-event-dialog-panel',
    autoFocus: false,
    data: {
      mode: 'update',
      event: info.event,

      // 傳給 Dialog 顯示唯讀欄位
      groupId: groupId,
      groupName: groupName,
    },
  });

  ref.afterClosed().subscribe((result) => {
    // 使用者按取消或關閉 Dialog，不做任何事
    if (!result) {
      return;
    }

    // 如果你的後端 update 只需要活動資料，可以只送 result
    // 但建議把 groupId、createdBy 一起帶上，跟新增格式一致
    const payload = {
      groupId: groupId,
      createdBy: this.createdBy,
      ...result,
    };

    console.log('updateCalendarEvent -> payload', payload);

    this.calendarApiService.update(Number(info.event.id), payload).subscribe({
      next: (res: any) => {
        if (res.code !== 200) {
          Swal.fire({
            icon: 'error',
            title: '更新失敗',
            text: res.message,
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: '修改成功',
          confirmButtonText: '確認',
        });

        // 更新後重新載入目前群組的行事曆
        this.loadCalendarEvents(groupId, this.createdBy);
      },

      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: '修改失敗',
          text: err.error?.message || '伺服器發生錯誤',
        });
      },
    });
  });
}
  // 點擊活動後，可選擇修改或刪除
  handleEventClick(info: EventClickArg): void {
    const eventId = Number(info.event.id);

    Swal.fire({
      title: info.event.title,
      text: '請選擇要執行的操作',
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: '修改',
      denyButtonText: '刪除',
      cancelButtonText: '取消',
    }).then((result) => {
      if (result.isConfirmed) {
        this.openUpdateDialog(info);
        return;
      }

      if (result.isDenied) {
        this.deleteCalendarEvent(eventId, info.event.title);
        return;
      }
    });
  }

  // 刪除活動
  deleteCalendarEvent(eventId: number, title: string): void {
    Swal.fire({
      icon: 'warning',
      title: `是否刪除「${title}」？`,
      text: '刪除後無法復原',
      showCancelButton: true,
      confirmButtonText: '刪除',
      cancelButtonText: '取消',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.calendarApiService.delete(eventId).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '刪除成功',
            confirmButtonText: '確認',
          });

          this.loadCalendarEvents(this.currentGroupId, this.createdBy);
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: '刪除失敗',
            text: err.error?.message || '請稍後再試',
          });
        },
      });
    });
  }
  // 拖曳活動到其他日期後，更新後端資料
  handleEventDrop(info: any): void {
    const eventId = Number(info.event.id);

    const title = info.event.title;
    const description = info.event.extendedProps['description'] || '';
    const notifyBefore = info.event.extendedProps['notifyBefore'] || 60;

    const newDateTime =
      info.event.startStr.length === 10
        ? info.event.startStr + 'T09:00:00'
        : info.event.startStr.substring(0, 19);

    const newEndTime = info.event.endStr
      ? info.event.endStr.substring(0, 19)
      : null;

    const data = {
      title: title,
      description: description,
      eventTime: newDateTime,
      endTime: newEndTime,
      notifyBefore: notifyBefore,
    };

    //拖曳後日期早於今天，就還原位置
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dropDate = new Date(info.event.start);
    dropDate.setHours(0, 0, 0, 0);

    if (dropDate < today) {
      info.revert();

      Swal.fire({
        icon: 'warning',
        title: '不可移動到今日之前',
        text: '行事曆事件不能拖曳到過去日期',
        confirmButtonText: '確認',
      });

      return;
    }

    Swal.fire({
      icon: 'question',
      title: '確認移動活動？',
      text: `是否將「${title}」移動到新的日期？`,
      showCancelButton: true,
      confirmButtonText: '確認',
      cancelButtonText: '取消',
    }).then((result) => {
      if (!result.isConfirmed) {
        info.revert(); // 取消就還原位置
        return;
      }

      this.calendarApiService.update(eventId, data).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '移動成功',
            showCancelButton: true,
            confirmButtonText: '確認',
            cancelButtonText: '取消',
          });

          this.loadCalendarEvents(this.currentGroupId, this.createdBy);
        },
        error: (err) => {
          info.revert(); // 更新失敗也還原

          Swal.fire({
            icon: 'error',
            title: '移動失敗',
            text: err.error?.message || '請稍後再試',
            showCancelButton: true,
            confirmButtonText: '確認',
            cancelButtonText: '取消',
          });
        },
      });
    });
  }
}
