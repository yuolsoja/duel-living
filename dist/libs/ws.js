'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.proto = undefined;
exports.WSServer = WSServer;

var _ws = require('ws');

var _lodash = require('lodash');

const sockets = new Map();
const duels = new Map();
const maxNodePeerNum = 100;

function WSServer(server) {
  const wss = new _ws.Server({
    server,
    path: '/direct'
  });

  wss.on('connection', connection);
  (0, _lodash.merge)(wss, proto);

  return wss;
}

function connectionsCount() {
  return sockets.size;
}

function isAvailable() {
  return connectionsCount() < maxNodePeerNum;
}

function setMaxNodePeerNum(n) {
  maxNodePeerNum = n;
}

function connection(socket) {
  socket.on('message', msg => handleMessage(msg, socket));
}

function handleMessage(msg, socket) {
  const data = JSON.parse(msg);

  switch (data.type) {
    // Hand shaking
    case 0:
      sockets.set(data.id, socket);

      if (!duels.has(data.duel)) duels.set(data.duel, new Set());

      duels.get(data.duel).add(data.id);
      break;

    // Disconnect
    case 2:
      sockets.delete(data.id);

      if (duels.has(data.duel)) {
        duels.get(data.duel).delete(data.id);
      }
      break;
  }
}

function boardcast(data, duelId) {
  if (!duels.has(duelId)) return;

  const socketsIds = duels.get(duelId);

  for (const id of socketsIds) {
    const socket = sockets.get(id);
    socket.send(data);
  }
}

const proto = exports.proto = {
  connectionsCount,
  isAvailable,
  setMaxNodePeerNum,
  boardcast
};