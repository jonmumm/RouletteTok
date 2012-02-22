// Require and initialize OpenTok SDK
var opentok = require('opentok');
var ot = new opentok.OpenTokSDK('413302', 'fc512f1f3c13e3ec3f590386c986842f92efa7e7');

// An array of users that do not have a chat partner
var soloUsers = [];
var clients = {}

// Sets up the socket server
exports.start = function(sockets) {
  sockets.on('connection', function(socket) {	
    clients[socket.id] = socket;

    ot.createSession('localhost', {}, function(session) {

      // Each user should be a moderator
      var data = {
        sessionId: session.sessionId,
        token: ot.generateToken({ 
          sessionId: session.sessionId,
          role: opentok.Roles.MODERATOR
        })
      };

      // Send initialization data back to the client
      socket.emit('initial', data);
    });

    socket.on('next', function (data) {
      // Create a "user" data object for me
      var me = {
        sessionId: data.sessionId,
        socketId: socket.id
      };

      var partner;
      var partnerSocket;
      // Look for a user to partner with in the list of solo users
      for (var i = 0; i < soloUsers.length; i++) {
        var tmpUser = soloUsers[i];
        console.log(tmpUser);

        // Make sure our last partner is not our new partner
        if (socket.partner != tmpUser) {							
          // Get the socket client for this user
          partnerSocket = clients[tmpUser.socketId];

          // Remove the partner we found from the list of solo users
          soloUsers.splice(i, 1);

          // If the user we found exists...
          if (partnerSocket) {
            // Set as our partner and quit the loop today
            partner = tmpUser;
            break;
          }
        }
      }

      // If we found a partner...
      if (partner) {

        // Tell myself to subscribe to my partner
        socket.emit('subscribe', {
          sessionId: partner.sessionId,
          token: ot.generateToken({ 
            sessionId: partner.sessionId,
            role: opentok.Roles.SUBSCRIBER
          })
        });

        // Tell my partner to subscribe to me
        partnerSocket.emit('subscribe', {
          sessionId: me.sessionId,
          token: ot.generateToken({ 
            sessionId: me.sessionId,
            role: opentok.Roles.SUBSCRIBER
          })
        });

        // Mark that my new partner and me are partners
        socket.partner = partner;
        partnerSocket.partner = me;

        // Mark that we are not in the list of solo users anymore
        socket.inlist = false;
        partnerSocket.inlist = false;

      } else {

        // delete that i had a partner if i had one				
        if (socket.partner) {							
          delete socket.partner;
        }

        // add myself to list of solo users if i'm not in the list
        if (!socket.inlist) {
          socket.inlist = true;
          soloUsers.push(me);
        }

        // tell myself that there is nobody to chat with right now
        socket.emit('empty');
      }	
    });

    socket.on('disconnect', function() {
      delete clients[socket.id];
    });
  });
};
