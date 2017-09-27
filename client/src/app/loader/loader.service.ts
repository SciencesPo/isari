import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
export class LoaderService {
  private _loader$: BehaviorSubject<boolean>  = new BehaviorSubject(false);
  public loader$: Observable<boolean> = this._loader$.asObservable();

  constructor() { }

  hide() {
    this._loader$.next(false);
  }

  show() {
    this._loader$.next(true);
  }

}
