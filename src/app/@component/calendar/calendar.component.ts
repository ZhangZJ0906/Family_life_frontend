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
import { MatIconModule } from '@angular/material/icon';

import { FormsModule } from '@angular/forms'; // ← 加這個
import { DropDownGroupList } from '../../common/interfaceList';
import { MatDialog } from '@angular/material/dialog';
import { CalendarEventDialogComponent } from '../calendar-event-dialog/calendar-event-dialog.component';

import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import timeGridPlugin from '@fullcalendar/timegrid';
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
    MatIconModule,



  ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent {
  selectedGroupId: any;
  userGroupList: DropDownGroupList[] = [];
  currentGroupId: number = 0;
  userInfo!: any;
  createdBy!: number;
  groupMemberList: any[] = [];
// 滑鼠移到活動時，是否顯示資訊卡
showEventTooltip = false;

// 資訊卡顯示位置
tooltipX = 0;
tooltipY = 0;

// 資訊卡內容
tooltipEvent = {
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  notifyBefore: 0,
  groupName: '',
};
  routeGroupId: number = 0;

  // FullCalendar 的主要設定
  calendarOptions: CalendarOptions = {
  plugins: [
    dayGridPlugin,
    timeGridPlugin,
    interactionPlugin
  ],

  initialView: 'dayGridMonth',

  locale: 'zh-tw',

  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek'
  },

  buttonText: {
    today: 'today',
    month: 'month',
    week: 'week'
  },

  views: {
    timeGridWeek: {
      buttonText: 'week',
      allDayText: 'all-day'
    }
  },

  slotMinTime: '01:00:00',
  slotMaxTime: '24:00:00',
  slotDuration: '01:00:00',
  slotLabelFormat: {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  },

  allDaySlot: true,
  nowIndicator: true,

  editable: true,
  selectable: true,

  dateClick: this.handleDateClick.bind(this),

  // 這裡要改回 handleEventClick
  // 點擊活動後才會跳 SweetAlert：修改 / 刪除 / 取消
  eventClick: this.handleEventClick.bind(this),

  eventDrop: this.handleEventDrop.bind(this),

  // 滑鼠移到活動上顯示資訊卡
  eventMouseEnter: this.handleEventMouseEnter.bind(this),
  eventMouseLeave: this.handleEventMouseLeave.bind(this),

  events: []
};
  constructor(
    private dialog: MatDialog,
    private calendarApiService: CalendarApiService,
    private http: HttpClientService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.userInfo = JSON.parse(
      sessionStorage.getItem('family-life-current-user')!,
    );
    this.createdBy = this.userInfo.user_id;
    this.getUserGroupList(this.createdBy);
  }

  getGroupMembers(groupId: number): void {
    console.log('Getting members for groupId:', groupId);
  if (!groupId || groupId === 0) {
    this.groupMemberList = [];
    return;
  }

  this.http
    .getApi(this.http.basicUrl + `family_life/get_members?group_id=${groupId}`)
    .subscribe({
      next: (res: any) => {
        console.log('Group Members Response:', res);
        this.groupMemberList = res.groupMembersList ?? [];
      },
      error: (err) => {
        console.error(err);
        this.groupMemberList = [];

        Swal.fire({
          icon: 'error',
          title: '群組成員載入失敗',
          text: err.error?.message || '請稍後再試',
          confirmButtonText: '確認',
        });
      },
    });
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

          // 取得網址上的 groupId
          this.routeGroupId = Number(
            this.route.snapshot.paramMap.get('groupId'),
          );

          // 如果網址沒有 groupId 就預設私人
          if (!this.routeGroupId && this.routeGroupId !== 0) {
            this.routeGroupId = 0;
          }

          this.selectedGroupId = this.routeGroupId;
          this.currentGroupId = this.routeGroupId;
          this.getGroupMembers(this.currentGroupId);
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
// 從後端查詢目前登入者在某個群組中的行事曆事件
loadCalendarEvents(groupId: number | null, userId: number): void {
  const realGroupId = groupId == null ? 0 : Number(groupId);

  // 重點：
  // 不要打 calendar/group/1
  // 因為後端目前沒有 @GetMapping("/group/{groupId}")
  const url =
    this.http.basicUrl +
    `calendar/getByGroup?groupId=${realGroupId}&userId=${userId}`;

  this.http.getApi(url).subscribe({
    next: (res: any) => {
      if (res.code !== 200) {
        Swal.fire({
          icon: 'error',
          title: '查詢行事曆失敗',
          text: res.message || '請確認後端是否啟動',
        });
        return;
      }

      const fullCalendarEvents = (res.data ?? []).map((item: any) => ({
        id: String(item.id),
        title: item.title,
        start: item.eventTime,
        end: item.endTime,
        extendedProps: {
          description: item.description,
          notifyBefore: item.notifyBefore,
          createdBy: item.createdBy,
          groupId: item.groupId,
          assignedUserId: item.assignedUserId,

          // 同一批活動的識別碼
          eventBatchId: item.eventBatchId,
        },
      }));

      this.calendarOptions = {
        ...this.calendarOptions,
        events: fullCalendarEvents,
      };
    },

    error: (err) => {
      Swal.fire({
        icon: 'error',
        title: '查詢行事曆失敗',
        text: err.error?.message || '請確認後端 API 路徑是否存在',
      });
    },
  });
}

  onGroupChange(event: MatSelectChange) {
     this.currentGroupId = event.value;
      this.selectedGroupId = event.value;

      this.getGroupMembers(this.currentGroupId);

      this.loadCalendarEvents(this.currentGroupId, this.createdBy);
    this.router.navigate(['/calendar', this.currentGroupId]);
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

  createCalendarEvent(dateStr?: string): void {
    // 後端目前私人活動是 groupId = 0，不是 null
    const groupId =
      this.currentGroupId === undefined || this.currentGroupId === null
        ? 0
        : Number(this.currentGroupId);

    // 找出目前選到的群組名稱，給 Dialog 顯示唯讀欄位用
    const selectedGroup = this.userGroupList.find(
      (group) => Number(group.groupId) === Number(groupId),
    );

    // groupId = 0 代表私人活動
    const groupName =
      groupId === 0 ? '私人活動' : selectedGroup?.groupName || '未選擇群組';

    const ref = this.dialog.open(CalendarEventDialogComponent, {
  width: '760px',
  maxWidth: '95vw',
  maxHeight: '90vh',
  panelClass: 'calendar-event-dialog-panel',
  autoFocus: false,
  data: {
    mode: 'create',
    dateStr,
    groupId,
    groupName,
    members: this.groupMemberList,
    currentUserId: this.createdBy,
  },
});

ref.afterClosed().subscribe((result) => {
  if (!result) {
    return;
  }

const payload = {
  // 活動所屬群組
  // groupId = 0 代表私人活動
  groupId,

  // 建立者 ID
  createdBy: this.createdBy,

  // Dialog 回傳的活動資料
  ...result,

  // 多選指派成員
  // 私人活動：固定指派給自己
  // 群組活動：使用 Dialog 勾選的 assignedUserIds
  assignedUserIds: groupId === 0
    ? [this.createdBy]
    : result.assignedUserIds,

  // 保留舊欄位，避免後端其他地方還在讀 assignedUserId
  assignedUserId: groupId === 0
    ? this.createdBy
    : result.assignedUserIds?.[0],
};
  this.calendarApiService.create(payload).subscribe({
    next: (res: any) => {
      if (res.code !== 200) {
        Swal.fire({
          icon: 'error',
          title: '新增失敗',
          text: res.message || '新增失敗',
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
});}

// 查詢同一批活動目前指派給哪些成員
getBatchAssignedUserIds(
  eventBatchId: string,
  fallbackUserId: number
): Promise<number[]> {
  // 沒有批次 ID 時，退回目前這筆活動的 assignedUserId
  if (!eventBatchId) {
    return Promise.resolve([fallbackUserId]);
  }

  const url =
    this.http.basicUrl +
    `calendar/batchAssignedUsers?eventBatchId=${eventBatchId}`;

  return new Promise((resolve) => {
    this.http.getApi(url).subscribe({
      next: (res: any) => {
        if (res.code !== 200) {
          resolve([fallbackUserId]);
          return;
        }

        resolve((res.data ?? []).map((id: any) => Number(id)));
      },
      error: () => {
        resolve([fallbackUserId]);
      },
    });
  });
}

async openUpdateDialog(info: EventClickArg): Promise<void> {
    const eventBatchId = info.event.extendedProps['eventBatchId'];
const fallbackAssignedUserId =
  info.event.extendedProps['assignedUserId'] ?? this.createdBy;

// 先查出同一批活動有哪些成員
const assignedUserIds = await this.getBatchAssignedUserIds(
  eventBatchId,
  fallbackAssignedUserId
);
    // 後端目前私人活動是 groupId = 0，不是 null
    const groupId =
      this.currentGroupId === undefined || this.currentGroupId === null
        ? 0
        : Number(this.currentGroupId);

    // 找出目前選到的群組名稱
    const selectedGroup = this.userGroupList.find(
      (group) => Number(group.groupId) === Number(groupId),
    );

    // Dialog 顯示用的群組名稱
    const groupName =
      groupId === 0 ? '私人活動' : selectedGroup?.groupName || '未選擇群組';

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
        groupId,
        groupName,
        members: this.groupMemberList,
        currentUserId: this.createdBy,
        // 傳給 Dialog，讓 test001 和 qqqq 都會被勾選
    assignedUserIds,
      },
    });

    console.log("GID:: ", info.event);
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const payload = {
  // 目前群組
  groupId: this.currentGroupId,

  // 修改者 / 建立者
  createdBy: this.createdBy,

  // 同一批活動識別碼
  eventBatchId,

  // Dialog 回傳的活動資料
  ...result,

  // 多選指派成員
  assignedUserIds: groupId === 0
    ? [this.createdBy]
    : result.assignedUserIds,

  // 保留舊欄位，避免後端其他地方還在讀 assignedUserId
  assignedUserId: groupId === 0
    ? this.createdBy
    : result.assignedUserIds?.[0],
};
      this.calendarApiService.update(Number(info.event.id), payload).subscribe({
        next: (res: any) => {
          if (res.code !== 200) {
            Swal.fire({
              icon: 'error',
              title: '更新失敗',
              text: res.message || '更新失敗',
            });
            return;
          }

          Swal.fire({
            icon: 'success',
            title: '修改成功',
            confirmButtonText: '確認',
          });

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

      // 後端目前私人活動是 groupId = 0，不是 null
      const groupId =
        this.currentGroupId === undefined || this.currentGroupId === null
          ? 0
          : Number(this.currentGroupId);

      this.calendarApiService
        .delete(eventId, this.createdBy, groupId)
        .subscribe({
          next: (res: any) => {
            if (res.code !== 200) {
              Swal.fire({
                icon: 'error',
                title: '刪除失敗',
                text: res.message || '刪除失敗',
              });
              return;
            }

            Swal.fire({
              icon: 'success',
              title: '刪除成功',
              confirmButtonText: '確認',
            });

            this.loadCalendarEvents(groupId, this.createdBy);
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
async handleEventDrop(info: any): Promise<void> {
  const eventId = Number(info.event.id);

  const title = info.event.title;
  const description = info.event.extendedProps['description'] || '';
  const notifyBefore = info.event.extendedProps['notifyBefore'] || 60;

  // 取得同一批活動識別碼
  // 同一批活動的 test001 / qqqq 會有相同 eventBatchId
  const eventBatchId = info.event.extendedProps['eventBatchId'];

  // 取得目前這筆活動的指派成員
  const fallbackAssignedUserId =
    info.event.extendedProps['assignedUserId'] ?? this.createdBy;

  // 先查出同一批活動目前指派給哪些成員
  // 例如：[1, 2] 代表 test001 和 qqqq
  const assignedUserIds = await this.getBatchAssignedUserIds(
    eventBatchId,
    fallbackAssignedUserId
  );

  // FullCalendar 拖曳後的新開始時間
  const newDateTime =
    info.event.startStr.length === 10
      ? info.event.startStr + 'T09:00:00'
      : info.event.startStr.substring(0, 19);

  // FullCalendar 拖曳後的新結束時間
  const newEndTime = info.event.endStr
    ? info.event.endStr.substring(0, 19)
    : null;

  // 拖曳後日期早於今天，就還原位置
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
      info.revert();
      return;
    }

    const payload = {
      // 活動所屬群組
      groupId: this.currentGroupId,

      // 修改者
      createdBy: this.createdBy,

      // 同一批活動識別碼
      // 後端會用這個同步修改同批活動
      eventBatchId,

      // 活動資料
      title: title,
      description: description,
      eventTime: newDateTime,
      endTime: newEndTime,
      notifyBefore: notifyBefore,

      // 多選指派成員
      // 私人活動：固定自己
      // 群組活動：使用同批活動原本所有成員
      assignedUserIds:
        this.currentGroupId === 0
          ? [this.createdBy]
          : assignedUserIds,

      // 保留舊欄位，避免後端還有地方讀 assignedUserId
      assignedUserId:
        this.currentGroupId === 0
          ? this.createdBy
          : assignedUserIds[0],
    };

    this.calendarApiService.update(eventId, payload).subscribe({
      next: (res: any) => {
        if (res.code !== 200) {
          info.revert();

          Swal.fire({
            icon: 'error',
            title: '移動失敗',
            text: res.message || '移動失敗',
            confirmButtonText: '確認',
          });

          return;
        }

        Swal.fire({
          icon: 'success',
          title: '移動成功',
          confirmButtonText: '確認',
        });

        this.loadCalendarEvents(this.currentGroupId, this.createdBy);
      },

      error: (err) => {
        info.revert();

        Swal.fire({
          icon: 'error',
          title: '移動失敗',
          text: err.error?.message || '請稍後再試',
          confirmButtonText: '確認',
        });
      },
    });
  });
}
  // 滑鼠移到活動上時，顯示活動資訊卡
handleEventMouseEnter(info: any): void {
  const event = info.event;

  const groupId = event.extendedProps?.groupId ?? this.currentGroupId;

  const group = this.userGroupList.find(
    (g) => Number(g.groupId) === Number(groupId)
  );

  const groupName =
    Number(groupId) === 0
      ? '私人活動'
      : group?.groupName || '未選擇群組';

  this.tooltipEvent = {
    title: event.title || '未命名活動',
    description: event.extendedProps?.description || '無活動描述',
    startTime: this.formatTooltipDateTime(event.start),
    endTime: event.end ? this.formatTooltipDateTime(event.end) : '未設定',
    notifyBefore: event.extendedProps?.notifyBefore ?? 0,
    groupName: groupName,
  };

  // 讓資訊卡出現在滑鼠右下方
  this.tooltipX = info.jsEvent.clientX + 16;
  this.tooltipY = info.jsEvent.clientY + 16;

  this.showEventTooltip = true;
}

// 滑鼠離開活動時，關閉資訊卡
handleEventMouseLeave(): void {
  this.showEventTooltip = false;
}

// 將日期時間格式化成畫面顯示用文字
formatTooltipDateTime(date: Date | null): string {
  if (!date) {
    return '未設定';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}`;
}
}
