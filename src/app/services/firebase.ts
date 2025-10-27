import { Injectable,inject } from '@angular/core';
import { Database, get, onValue, ref, remove, set, update } from '@angular/fire/database';
import { unsubscribe } from 'diagnostics_channel';
import { resourceUsage } from 'process';
import { Observable } from 'rxjs';
import { rxResource }   from '@angular/core/rxjs-interop';

export enum PATHFireBase{
  Usuarios='users',
  Salones='salones',
  Clientes='clientes',
}

@Injectable({
  providedIn: 'root'
})
export class Firebase {
  private db =  inject(Database);
  async getAll(path:PATHFireBase){
    const dbref = ref(this.db,path);
    const snapshot = await get(dbref);
    return snapshot.exists()? snapshot.val():[];
  }

  createResource(path:PATHFireBase){
    return rxResource({
      stream:()=>{
        return new Observable<{data:any,error:string}>(observer=>{
          const dbref = ref(this.db,path);
          const unsubscribe = onValue(
            dbref,
            (snapshot) => {
              if(snapshot.exists()){
                let data_ = snapshot.val();
                let array_ = Object.keys(data_)
                  .map(key =>({
                    id:key,
                    ...data_[key]
                  }));
                observer.next({ data:array_,error:''})
              }else{
                observer.next({data:[],error:''});
              }
            },
            (error) => {
              observer.error(error);
            }
          );
          return ()=> unsubscribe();
        })
      }
    });
  }

  async add(path:PATHFireBase,id:string,data:any){
    const dbref = ref(this.db,path+'/'+id);
    return set(dbref,data);
  }
  async edit(path:PATHFireBase,id:string,data:any){
    const dbref = ref(this.db,path+'/'+id)
    return update(dbref,data);
  }
  async delete(path:PATHFireBase,id:string){
    const dbref = ref(this.db,path+'/'+id)
    return remove(dbref);
  }
}
