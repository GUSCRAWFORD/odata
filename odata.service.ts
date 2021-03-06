import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
@Injectable()
export class ODataService {

  constructor(private http:Http) { }
  resource<TModel>(name:string, model$odata:any=null) :ODataResource<TModel> {
    if (this.resourceCache[name] instanceof ODataResource) return this.resourceCache[name];
    return new ODataResource<TModel>(name, this.http, model$odata);
  }
  private resourceCache = {};

  api() {
    return this.http.get(ODataService.apiRoot)
      .map(i=>{
        return i.json().value
      });
  }
  static apiRoot = "";
}
export class ODataApiMetadata {
    "name": string;
    "kind": string;
    "url":  string;
}
export class ODataResource<TModel> {
  constructor(public name:string, private http: Http, public model$odata=null) {
    if (!model$odata) this.model$odata = {};
  }
  registerItemAction(method:string, action:string) {
    this.model$odata[action] = (key:((d:TModel)=>any)|any='_id', query?:any, data?:TModel)=>{
      let keyId = data?data[typeof key === 'function'?key(data):key]:typeof key==='function'?key(query):key,
          url = "@api/@resource('@key')/@action"
                  .replace(/@api/g,ODataService.apiRoot)
                  .replace(/@resource/g, this.name)
                  .replace(/@action/g,action)
                  .replace(/@key/g, keyId.toString());
      return this.http[method.toLowerCase()](url, data, {
          withCredentials:true
        })
        .map(rs=>rs.json());
    }
  }
  $count(query:ODataQuery): Observable<number> {
    let url = "@api/@resource/$count"
                .replace(/@api/g,ODataService.apiRoot)
                .replace(/@resource/g, this.name);
    if (query) url += '?'+serialize(query);
    return this.http
      .get(url, {
        withCredentials:true
      })
      .map(rs=>rs.json())
      .take(1);
  }
  create(data:TModel) {
    let url = "@api/@resource"
                .replace(/@api/g,ODataService.apiRoot)
                .replace(/@resource/g, this.name);
    return this.http
      .post(url, filterStoredData(data), {
        withCredentials:true
      })
      .map(rs=>rs.json());
  }
  update(data:TModel, key:((d:TModel)=>any)|any='_id') {
    let keyId = data[typeof key === 'function'?key(data):key],
        url = "@api/@resource('@key')"
                .replace(/@api/g,ODataService.apiRoot)
                .replace(/@resource/g, this.name)
                .replace(/@key/g, keyId.toString());
    return this.http
      .put(url, filterStoredData(data), {
        withCredentials:true
      })
      .map(rs=>rs.json());
  }
  single(key:any, query?:ODataQuery): Observable<TModel> {
    let url = "@api/@resource('@key')"
                .replace(/@api/g,ODataService.apiRoot)
                .replace(/@resource/g, this.name)
                .replace(/@key/g, key.toString());
    if (query) url += '?'+serialize(query);
    return this.http
      .get(url, {
        withCredentials:true
      })
      .map(rs=>rs.json()).take(1)
      .map(rs=>{
        rs.$ = this.model$odata;
        //rs.forEach(r=>r.$ = this.model$odata);
        return rs;
      });
  }
  query(query?:ODataQuery): Observable<TModel[]> {
    let url = "@api/@resource"
                .replace(/@api/g,ODataService.apiRoot)
                .replace(/@resource/g, this.name);
    if (query) url += '?'+serialize(query);
    return this.http
      .get(url, {
        withCredentials:true
      })
      .map(rs=>rs.json().value)
      .map(rs=>{
        rs.forEach(r=>r.$=this.model$odata);
        return rs;
      })
      .take(1);
  }
  remove(key:any) {
    let url = "@api/@resource('@key')"
                .replace(/@api/g,ODataService.apiRoot)
                .replace(/@resource/g, this.name)
                .replace(/@key/g, key.toString());
    return this.http
      .delete(url, {
        withCredentials:true
      })
      .map(rs=>rs.json()).take(1);
  }
}
//https://stackoverflow.com/questions/1714786/query-string-encoding-of-a-javascript-object
function serialize (obj, prefix?) {
  var str = [], p;
  for(p in obj) {
    if (obj.hasOwnProperty(p)) {
      var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
      str.push((v !== null && typeof v === "object") ?
        serialize(v, k) :
        encodeURIComponent(k) + "=" + encodeURIComponent(v));
    }
  }
  return str.join("&");
}
function filterStoredData<TModel>(data:TModel) {
  var clone = JSON.parse(JSON.stringify(data));
  if (clone.$) delete clone.$;
  return clone;
}
export class ODataQuery {
  $top?:number;
  $skip?:number;
  $filter?:string;
  $orderBy?:string;
  $select?:string;
}