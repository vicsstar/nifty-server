const WebSocket = require('ws')

let wsServer;
let users = [];
const channels = [
  { name: 'general', description: 'Welcome to Nifty PRO!', id: '1001' },
  { name: 'random', description: 'Here you can post random messages and things that don\'t necessarily matter.', id: '1002' },
  { name: 'polymer', description: 'Polymer library discussions only!', id: '1003' },
  { name: 'emberjs', description: 'Ask and answer questions on the EmberJS framework.', id: '1004' },
  { name: 'ios', description: 'This is the channel for all iOS devs - iOS talks and iOS questions', id: '1005' },
  { name: 'angularjs', description: 'Speak Angular? Contribute - help others or ask questions here.', id: '1016' },
  { name: 'reactjs', description: 'This channel is for you if you work with the ReactJS library.', id: '1017' }
];

function chatConnection(wss) {
  wsServer = wss;

  return function(ws, req) {
    ws.on('message', (message) => {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'USER_ADD': {
          let user = findUser(data.nickname);

          if (!user) {
            users.push({ nickname: data.nickname });
          }
          sendChannelList(ws);
          break;
        }
        case 'USER_LEAVE': {
          users = users.filter(u => u.nickname !== data.nickname);

          broadcast({
            type: 'USER_LIST',
            users
          }, ws);
        }
        case 'CHANNEL_LIST': {
          sendChannelList(ws);
          break;
        }
        case 'MESSAGE_ADD':
          broadcast({
            type: 'NEW_MESSAGE',
            message: data.message,
            author: data.nickname,
            channelId: data.channelId,
            isPrivate: data.isPrivate,
            time: data.time,
            id: data.id
          }, ws);
          break;
        default:
          break;
      }
    });

    ws.on('close', () => {
      // users = users.filter(u => u.nickname !== user.nickname);
      // broadcast({
      //   type: 'USER_LEAVE'
      // }, ws);
    });
  }
}

function broadcast(data, ws) {
  if (wsServer) {
    wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        if (client !== ws) {
          send(data, client);
        }
      }
    });
  }
}

function sendChannelList(ws) {
  send({
    type: 'CHANNEL_LIST',
    channels,
    users
  }, ws);

  broadcast({
    type: 'USER_LIST',
    users
  }, ws);
}

function sendError(message, ws) {
  send({
    error: true,
    message
  }, ws);
}

function send(data, ws) {
  ws.send(JSON.stringify(data));
}

function findRoom(roomId) {
  return rooms.find(room => room.id == roomId);
}

function findUser(nickname) {
  return users.find(user => user.nickname === nickname);
}

function findUsersInRoom(roomId) {
  return users.filter(user => user.roomId == roomId);
}

module.exports = chatConnection;
