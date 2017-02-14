import { Injectable } from '@angular/core';

@Injectable()
export class StorageService {

  save(value, key, feature) {
    localStorage.setItem(`${feature}.${key}`, JSON.stringify(value));
  }

  get(key, feature) {
    return JSON.parse(localStorage.getItem(`${feature}.${key}`));
  }

}
