const { getIo, users } = require("./socket");

const sendNotification = (userId, notification) => {
  const io = getIo();
  for (let i = 0; i < userId.length; i++) {
    if (users[userId[i]]) {
      io.to(users[userId[i]]).emit(notification.type, notification);
    }
  }
};

module.exports = { sendNotification };
