import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-invite-dialog',
  imports: [FormsModule, MatDialogModule],
  templateUrl: './invite-dialog.component.html',
  styleUrl: './invite-dialog.component.scss'
})
export class InviteDialogComponent {

  userEmail: string = '';

  constructor(
    private dialogRef: MatDialogRef<InviteDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: any,
    private http: HttpClient
  ) {}

  invited_members: any[] = [];

  getInvitedMemembers(){
    const group_id = Number(this.data.groupId);

    this.http.get<any>(
      `http://localhost:8080/family_life/get_invited_members?group_id=${group_id}`
    ).subscribe({

      next: (res) => {
        // console.log(group_id);
        // console.log(this.data.userId);
        this.invited_members = res.invitedMemberList;

        console.log(group_id, res.invitedMemberList, res);
      },

      error: (err) => {
        console.log(err);
      }

    });
  }

  inviteMember() {
    if(this.userEmail == ""){
      Swal.fire("請輸入使用者Email !!!!!");
    }
    else{
      this.http.post(
        'http://localhost:8080/family_life/invite',
        {
          group_id: Number(this.data.groupId),
          sendUserId: Number(this.data.userId),
          email: this.userEmail,
          publicInventory: 0
        }
      ).subscribe({
        next: (res: any) => {
          console.log(res);
          if(res.message == "this id is exist in this group"){
            Swal.fire({
              icon: 'error',
              title: `該user已在群組`
            });
          }
          else if(res.message == "user_id not exist"){
            Swal.fire({
              icon: 'error',
              title: `該user不存在`
            });
          }
          else if(res.message == "member is invited"){
            Swal.fire({
              icon: 'error',
              title: `無法重複邀請該名成員`
            });
          }
          else{
            Swal.fire({
              icon: 'success',
              title: `已邀請，等對方接受`
            });
          }
        },
        error: (err) => {
          console.log(err);

          Swal.fire({
            icon: 'error',
            title: '建立失敗'
          });
        }
      });
    }


    this.dialogRef.close(true);
  }

  closeDialog() {
    this.dialogRef.close();
  }

}
