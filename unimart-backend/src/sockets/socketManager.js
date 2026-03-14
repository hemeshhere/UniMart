// We export a function that takes the io instance from server.js
module.exports = function (io) {
  
  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // 1. Join a specific "Room" for an active order
    // When a runner accepts an order, both the buyer and runner emit this event to join a private room.
    socket.on('join_mission_room', (orderId) => {
      socket.join(orderId);
      console.log(`[Socket] Socket ${socket.id} joined room: ${orderId}`);
    });

    // 2. The In-Memory GPS Router (Zero Database Load)
    // The runner's phone emits this every 10 seconds.
    socket.on('runner_location_update', (data) => {
      const { orderId, coordinates } = data;
      
      // Instantly broadcast the coordinates ONLY to the buyer sitting in that specific order's room.
      socket.to(orderId).emit('live_location_received', {
        lat: coordinates.lat,
        lng: coordinates.lng,
        timestamp: new Date()
      });
    });

    // 3. Real-time chat passing
    socket.on('send_chat_message', (data) => {
      const { orderId, message, senderId } = data;
      
      // Send the message to the other person in the room
      socket.to(orderId).emit('receive_chat_message', {
        senderId,
        message,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });
};