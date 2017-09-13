"use strict"

const getChatPreview = (api, thread) => {
    const { threadID, participantIDs, snippet, name } = thread;
    return new Promise((resolve, reject) => {
        api.getUserInfo(participantIDs, (err, users) => {
            if (err) {
                return reject(err);
            }

            let res = {
                users,
                threadID,
                snippet,
                chatName: name,
            };
            resolve(res);
        });
    });
}

const getInboxChats = (api, number) => {
    return new Promise((resolve, reject) => {
        let chats = [];
        console.log('getting chats');
        api.getThreadList(0, number, 'inbox', (err, threads) => {
            console.log('got thread list');
            if (err) {
                reject(err);
            } else {
                const promises = threads.map(thread => {
                    return getChatPreview(api, thread);
                });

                Promise.all(promises).then(result => {
                    resolve(result);
                }, err => {
                    reject(err);
                });

            }
        });
    });
}

module.exports = getInboxChats;