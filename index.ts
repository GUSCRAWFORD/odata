import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { GenericManager } from './GenericManager';
import { ODataApiMetadata, ODataQuery, ODataResource, ODataService} from './odata.service';
export * from './GenericManager';
export * from './odata.service';
@NgModule({
  declarations: [],
  imports: [BrowserModule, HttpModule],
  providers: [ODataService],
  exports:[]
})
export class ODataModule { }