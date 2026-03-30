module.exports = function (io) {
  io.on('connection', (socket) => {
    // console.log(`[Socket] User connected: ${socket.id}`);
    // THE RADAR & STATUS ROOMS

    // Buyers join this when they log in to get instant updates on their food
    socket.on('join_personal_room', (userId) => {
      socket.join(userId);
    });

    // Runners join this on their dashboard to see new orders pop up
    socket.on('join_runner_radar', () => {
      socket.join('available_orders_radar');
    });

    // MISSION COMMS & GPS 
    socket.on('join_mission_room', (orderId) => {
      socket.join(orderId);
    });

    socket.on('runner_location_update', (data) => {
      const { orderId, coordinates } = data;
      socket.to(orderId).emit('live_location_received', { lat: coordinates.lat, lng: coordinates.lng, timestamp: new Date() });
    });

    socket.on('send_chat_message', (data) => {
      const { orderId, message, senderId } = data;
      socket.to(orderId).emit('receive_chat_message', { senderId, message, timestamp: new Date() });
    });

    // socket.on('disconnect', () => {
    //   console.log(`[Socket] User disconnected: ${socket.id}`);
    // });
  });
};