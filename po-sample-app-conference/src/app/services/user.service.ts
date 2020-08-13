import { Injectable } from '@angular/core';

import { PoEntity } from '@po-ui/ng-sync';
import { PoStorageService } from '@po-ui/ng-storage';
import { PoSyncService, PoHttpRequestData, PoHttpRequestType } from '@po-ui/ng-sync';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  userModel: PoEntity;

  constructor(private poSync: PoSyncService, private poStorage: PoStorageService) { }

  async addFavoriteLecture(lectureId, loggedUser) {
    this.userModel = this.poSync.getModel('Users');
    const user: any = await this.userModel.findById(loggedUser).exec();
    user.favoriteLectures = user.favoriteLectures || [];

    if (!user.favoriteLectures.includes(lectureId)) {
      user.favoriteLectures.push(lectureId);

      await this.userModel.save(user);

    } else {
      throw new Error();
    }

  }

  async addFavoriteLectureList(lecturesId) {
    const loggedUser = await this.getLoggedUserId();

    if (!(lecturesId instanceof Array)) {
      lecturesId = [lecturesId];
    }

    for (const lectureId of lecturesId) {
      await this.addFavoriteLecture(lectureId, loggedUser);
    }

  }

  createUser(user) {
    user.isSuperUser = false;

    const requestData: PoHttpRequestData = {
      url: 'http://localhost:8080/conference-api/api/v1/users/',
      method: PoHttpRequestType.POST,
      body: user
    };

    this.poSync.insertHttpCommand(requestData, user.username);
  }

  async getFavoriteLectures() {
    this.userModel = this.poSync.getModel('Users');
    const loggedUser = await this.getLoggedUserId();
    const user: any = await this.userModel.findById(loggedUser).exec();
    return 'favoriteLectures' in user ? user.favoriteLectures : undefined;
  }

  async getLoggedUserId() {
    const login = await this.poStorage.get('login');
    return login ? login.userId : undefined;
  }

  getModel() {
    this.userModel = this.poSync.getModel('Users');
    return this.userModel;
  }

  async getLoggedUser() {
    this.userModel = this.poSync.getModel('Users');
    const userid = await this.getLoggedUserId();

    return this.userModel.findById(userid).exec();
  }

  async getUsers() {
    this.userModel = this.poSync.getModel('Users');
    const userData: any = await this.userModel.find().exec();
    return userData.items;
  }

  async onLogin(username, password) {
    const users: any = await this.getUsers();

    const foundUser = users.find(user => {
      return (user.username === username) && (user.password === password);
    });

    return foundUser ? this.logIn(foundUser) : Promise.reject('User not found');
  }

  async removeFavoriteLecture(lectureId) {
    this.userModel = this.poSync.getModel('Users');
    const loggedUser = await this.getLoggedUserId();
    const user: any = await this.userModel.findById(loggedUser).exec();

    user.favoriteLectures = user.favoriteLectures.filter(id => lectureId !== id);
    await this.userModel.save(user);

  }

  synchronize() {
    return this.poSync.sync();
  }

  private logIn(foundUser) {
    return this.poStorage.set('login', { userId: foundUser.id });
  }

}