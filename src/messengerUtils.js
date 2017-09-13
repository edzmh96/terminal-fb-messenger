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
        this.listening = false;
    }

    listen(callback) {
        this.listening = true;
        this.api.setOptions({
            selfListen: true,
            logLevel: 'silent',
        });
        const stopListening = this.api.listen((err, event) => {
            // weird hack, not sure why calling stopListening doesn't work outside of callback
            if (!this.listening) return stopListening();
            if (err) return console.log(err);
            const { senderID, body, threadID } = event;

            if (threadID != this.currentChatId) return;

            if (this.getUserFullname(senderID)) {
                _.printMessage(this.getUserFullname(senderID), body);
            } else {
                this.getUserInfo(senderID).then(user => {
                    this.cacheUser(senderID, user);
                    _.printMessage(this.getUserFullname(senderID), body);
                }, err => {
                    console.log(err);
                });
            }
        });
    }

    replyMessage(message) {
        this.api.sendMessage(message, this.currentChatId);
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

    openChat(messages) {
        messages.forEach(message => {
            const { senderID, body } = message;
            _.printMessage(this.getUserFullname(senderID), body);
        });
        this.listen();
    }

    exitChat() {
        this.listening = false;
        this.currentChatId = null;
        this.getInboxHistory(10);
    }

    getThreadHistory(threadID, amount) {
        this.currentChatId = threadID;
        this.api.getThreadHistory(threadID, amount, undefined, (err, history) => {
            if (err) return console.log(err);

            // check if user info is loaded
            if (this.chats[threadID]) {
                const usersToLoad = [];
                const users = this.chats[threadID].users;
                Object.keys(users).forEach(userId => {
                    if (!this.friends[userId]) {
                        usersToLoad.push(userId);
                    }
                });

                // if there's a user that's not already loaded, load the user
                if (usersToLoad.length > 0) {
                    console.log('loading more users ');
                    this.getUserInfo(usersToLoad).then(users => {
                        Object.keys(users).forEach(userId => {
                            this.cacheUser(userId, users[userId]);
                        });

                        // display messages
                        this.openChat(history);
                        this.rl.prompt();
                    }, err => {
                        console.log(err);
                    })
                } else {
                    console.log('displaying messages');
                    // display messages
                    this.openChat(history);
                    this.rl.prompt();
                }

            }
        });
    }

}
module.exports = MessengerManager;
