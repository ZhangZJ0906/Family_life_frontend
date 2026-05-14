import { Component } from '@angular/core';
import { TopbarComponent } from '../../shared/topbar/topbar.component';


@Component({
  selector: 'app-home-page',
  imports: [ TopbarComponent],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {

}
