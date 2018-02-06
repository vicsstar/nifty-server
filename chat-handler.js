const WebSocket = require('ws')

let wsServer;
let users = [];
const channels = [
  { name: 'general', description: '', id: '1001' },
  { name: 'random', description: '', id: '1002' },
  { name: 'polymer', description: '', id: '1003' },
  { name: 'emberjs', description: '', id: '1004' },
  { name: 'ios', description: '', id: '1005' },
  { name: 'angularjs', description: '', id: '1016' },
  { name: 'reactjs', description: '', id: '1017' }
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
          broadcast({
            type: 'USER_LIST',
            users
          }, ws);
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
        // TODO: consider removing this case. Perhaps not useful as the next case (ROOM_JOIN)
        // takes care of user listing as per the front-end chat app model.
        case 'USER_LIST': {
          const users = users // or findUsersInRoom(data.roomId) for members specific to this room.

          send({ type: 'USER_LIST', users }, ws);
          break;
        }
        case 'ROOM_JOIN': {
          const room = findRoom(data.roomId);
          let user = findUser(data.nickname);

          if (room) {
            if (!user) {
              user = { nickname: data.nickname };
              users.push({
                nickname: data.nickname,
                roomId: room.id
              });
            }
            user.roomId = room.id;

            broadcast({
              type: 'USER_LIST',
              users: users // or findUsersInRoom(room.id) for members specific to this room.
            }, ws);
          } else {
            sendError('The room doesn\'t exist.', ws);
          }
          break;
        }
        case 'ROOM_LEAVE': {
          const user = findUser(data.nickname);

          if (user) {
            broadcast({
              type: 'USER_LIST',
              users: users // or findUsersInRoom(user.roomId) for members specific to this room.
            }, ws);
            delete user.roomId;
          }
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
        if (data.type === 'USER_LIST') {
          send(data, client);
        } else if (client !== ws) {
          send(data, client);
        }
      }
    });
  }
}

function sendChannelList(ws) {
  send({
    type: 'CHANNEL_LIST',
    channels
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
