const MessengerManager = require('./messengerUtils')

"use strict"

const Messenger = (m, rl) => {
    console.log("here");
    rl.setPrompt('>>> ');
    rl.prompt();
    rl.on('line', (line) => {
        const args = line.split(' ');
        const command = args[0]
        switch (command) {
            case 'ls':
                console.log('getting chats...');
                //TODO: move this to separate file
                const numChats = args[1] || 10;
                m.getInboxHistory(numChats);
                break;

            case 'cd':
                console.log(`cd called with ${args[1]}`);
                if (args[1] == '..') {
                    m.exitChat();
                } else {
                    m.getThreadHistory(args[1], 50);
                }

                break;

            case 'r':
                args.shift();
                const message = args.join(' ');
                m.replyMessage(message);
                rl.prompt();
                break;

            case 'remoji':
                const emoji = args[1];
                const emojiSize = args.length > 2 ? args[2] : 'small';
                m.replyMessage({
                    emoji,
                    emojiSize,
                });
                rl.prompt();
                break;

            case 'logout':
                console.log('Logging out...');
                m.logout(process.exit(0))
            default:
                console.log(`Command ${command} not recognized. Type \'help\' for available commands.`);
                rl.prompt();
                break;
        }
    }).on('close', () => {
        rl.close();
        process.exit(0);
    });
}

const initMessenger = (api, rl) => {
    const m = new MessengerManager(api, rl);
    console.log('Loading Friends for current user...');
    m.loadFriends().then(res => Messenger(m, rl), err => console.log(err));
}

module.exports = initMessenger;