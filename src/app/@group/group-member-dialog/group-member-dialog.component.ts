import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import { InviteDialogComponent } from '../invite-dialog/invite-dialog.component';
import { environment } from '../../@models/user.model';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

@Component({
  selector: 'app-group-member-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule
  ],
  templateUrl: './group-member-dialog.component.html',
  styleUrls: ['./group-member-dialog.component.scss']
})
export class GroupMemberDialogComponent {

  user_id!: string;
  avatar = " ";
  constructor(
    private dialogRef: MatDialogRef<GroupMemberDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: any,
    private http: HttpClient,
    private dialog: MatDialog
  ) {
    this.user_id = this.data.userId;
  }

  members: any[] = [];
  invited_members: any[] = [];

  isLoadingMembers = false;
  isLoadingInvited = false;

  selectedTab: 'members' | 'waiting' = 'members';

  ngOnInit(): void {
    this.getGroupMember();
    this.getInvitedMemembers();
  }

  getGroupMember() {
    this.isLoadingMembers = true;

    const group_id = this.data.group.groupId;

    this.http.get<any>(
      `${environment.apiUrl}/family_life/get_members?group_id=${group_id}`
    ).subscribe({

      next: (res) => {
        // console.log(group_id);
        // console.log(this.data.userId);
        this.members = res.groupMembersList;

        console.log(res.groupMembersList);
        this.isLoadingMembers = false;
      },

      error: (err) => {
        console.log(err);
        this.isLoadingMembers = false;
        Swal.fire({
          icon: 'error',
          title: '載入成員失敗'
        });
      }

    });

  }

  getInvitedMemembers(){
    const group_id = this.data.group.groupId;
    this.isLoadingInvited = true;

    this.http.get<any>(
      `${environment.apiUrl}/family_life/get_invited_members?group_id=${group_id}`
    ).subscribe({

      next: (res) => {
        // console.log(group_id);
        // console.log(this.data.userId);
        this.invited_members = res.invitedMembersList;
        this.isLoadingInvited = false;

        console.log(res);
      },

      error: (err) => {
        console.log(err);
        this.isLoadingInvited = false;
      }

    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  copyInviteCode() {

    navigator.clipboard.writeText(
      this.data.group.inviteCode
    );

    Swal.fire({
      icon: 'success',
      title: '邀請碼已複製',
      timer: 1200,
      showConfirmButton: false
    });

  }

  removeMember(member: any) {

    const group_id = this.data.group.groupId;

    const user_id = member.user_id;

    const user_name = member.user_name;

    // 是否為自己
    const isSelf = user_id === Number(this.user_id);

    Swal.fire({
      title: isSelf ? '確定退出群組？' : `確定將 ${user_name} 踢出？`,

      text: isSelf ? '退出後需重新加入' : '該操作無法還原',

      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "確定",
      cancelButtonText: "取消"

    }).then((result) => {

      if (result.isConfirmed) {

        Swal.fire({
          title: '移除中...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.http.delete(
          `${environment.apiUrl}/family_life/delete_group_member/${group_id}/${user_id}`
        ).subscribe({

          next: () => {

            Swal.fire({
              icon: 'success',
              title: '已移除成員'
            });

            if(isSelf){
              this.dialogRef.close({ refreshed: true });
            }
            else{
              this.getGroupMember();
            }

          },

          error: (err) => {

            console.log(err);

            Swal.fire({
              icon: 'error',
              title: '移除失敗'
            });

          }

        });

      }

    });

  }

  openInviteDialog() {

    const dialogRef = this.dialog.open(InviteDialogComponent, {
      width: '400px',
      data: {
        userId: this.user_id,
        groupId: this.data.group.groupId
      }
    });

    dialogRef.afterClosed().subscribe((result) => {

      if (result?.success) {
        this.getInvitedMemembers();
      }

    });

  }
}
