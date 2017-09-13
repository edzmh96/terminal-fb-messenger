"use strict"
const getInboxChats = require('./utils/getInboxChats');
const _ = require('./utils/outputUtils');

class MessengerManager {
    constructor(api, rl) {
        this.api = api;
        this.rl = rl;
        this.chats = {};
        this.dirty = false;
        this.friends = {};
    }

    listen(callback) {
        this.api.setOptions({
            selfListen: true,
            // logLevel: 'silent',
        });
        this.api.listen((err, event) => {

            if (err) return console.log(err);
            let senderName;
            if (this.friends[event.senderID]) {
                console.log(`${senderName}: ${event.body}`);
            } else {
                this.getUserInfo(event.senderID).then(user => {
                    this.cacheUser(event.senderID, user);
                    console.log(`${getUserFullname(event.senderID)}: ${event.body}`);
                }, err => {
                    console.log(err);
                });
            }
        });
    }

    cacheUser(userId, user) {
        this.friends[userId] = user;
    }

    getUserFullname(userId) {
        // console.log('getting full name');
        return this.friends[userId].name || this.friends[userId].fullname;
    }

    getUserInfo(userIds) {
        return new Promise((resolve, reject) => {
            this.api.getUserInfo(userIds, (err, user) => {
                if (err) reject(err);
                resolve(user);
            });
        });
    }

    loadFriends() {
        return new Promise((resolve, reject) => {
            this.api.getFriendsList((err, friends) => {
                console.log("Friends loaded");
                if (err) reject (err);
                // map userId to friends for easy lookup
                friends.forEach(friend => {
                    this.cacheUser(friend.userID, friend)
                });
                resolve();
            });
        });
    }

    logout(callback) {
        this.api.logout(callback);
    }

    getInboxHistory(numberOfChats) {
        getInboxChats(this.api, numberOfChats).then(chats => {
            chats.forEach(chat => {
                // cache it
                // console.log('caching chats');
                const { threadID, snippet, users, name } = chat;
                this.chats[threadID] = chat;
                // console.log('caching users');
                let userFullnames = [];
                Object.keys(users).forEach(userId => {
                    this.cacheUser(userId, users[userId]);
                    userFullnames.push(this.getUserFullname(userId));
                });
                // console.log('printing chat');
                _.printChatPreview(name, userFullnames, snippet, threadID);
            })
            this.dirty = false;
            this.rl.prompt();
        }, err => {
            console.log(err);
            this.rl.prompt();
        });
    }

    getThreadHistory(threadID, amount) {
        api.getThreadHistory(threadID, amount, undefined, (err, history) => {
            if (err) return console.log(err);

            // check if user info is loaded
            if (this.chats[threadID]) {
                const usersToLoad = [];
                const users = this.chats[threadID].users;
                users.forEach(user => {
                    if (!this.friends[user.id]) {
                        this.toLoad.push(user.id);
                    }
                });

                // if there's a user that's not already loaded, load the user
                if (usersToLoad.length > 0) {
                    this.getUserInfo(usersToLoad).then(users => {
                        Object.keys(users).forEach(userId => {
                            this.cacheUser(userId, users[userId]);
                        });


                    }, err => {
                        console.log(err);
                    })
                } else {

                }

            }
        });
    }

}
module.exports = MessengerManager;
