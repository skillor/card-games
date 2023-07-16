import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevelopComponent } from './develop.component';
import { CustomRouteReuseStrategy, DevelopRoutingModule } from './develop-routing.module';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { FormsModule } from '@angular/forms';
import { InfoComponent } from './info/info.component';
import { RouteReuseStrategy } from '@angular/router';
import { ActionsComponent } from './actions/actions.component';
import { AssetsComponent } from './assets/assets.component';
import { CardsComponent } from './cards/cards.component';
import { DevelopService } from './develop.service';
import { ReactComponentDirective } from './react-component-directive/react-component.directive';
import { SanitizePipe } from './sanitize.pipe';
import { DebugComponent } from './debug/debug.component';



@NgModule({
  declarations: [
    DevelopComponent,
    InfoComponent,
    ActionsComponent,
    AssetsComponent,
    CardsComponent,
    ReactComponentDirective,
    SanitizePipe,
    DebugComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DevelopRoutingModule,
    MonacoEditorModule.forRoot()
  ],
  providers: [
    DevelopService,
    {
      provide: RouteReuseStrategy,
      useClass: CustomRouteReuseStrategy
    }
  ],
})
export class DevelopModule { }
