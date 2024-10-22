const sendNotification = (userId, notification, users, io) => {
  if (users[userId]) {
    io.to(users[userId]).emit("receive_notification", notification);
  }
};

module.exports = { sendNotification };
