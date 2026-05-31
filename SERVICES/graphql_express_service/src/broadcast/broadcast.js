// broadcaster.js
const { usersSchema } = require('../models/mongodb');
const clients = [];


function getData() {
    return usersSchema.find();
}

function addClient(res) {
  clients.push(res);
}

function sendEvent(data) {
  clients.forEach(res => res.write(`data: ${JSON.stringify(data)}\n\n`));
}

function removeClient(res) {
  const idx = clients.indexOf(res);
  if (idx !== -1) clients.splice(idx, 1);
}

module.exports = { addClient, sendEvent, removeClient };
