"use strict"

const _ = {};

_.printMessage = (senderName, message) => {
    console.log(`${senderName}: ${message}`);
};

_.printChatPreview = (chatName, fullnames, chatSnippet, threadID) => {
    // console.log("printing chat preview");
    let data = `Chat Name: ${chatName || ""}\n`;
    data += `Users: `;
    fullnames.forEach(fullname => {
        data += `${fullname}, `;
    });
    data += `\nLatest Message: ${chatSnippet}`;
    data += `\nChat id: ${threadID} \n`;
    console.log(data);
}

module.exports = _;