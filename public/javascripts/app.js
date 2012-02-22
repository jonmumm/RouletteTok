(function() {

  var socket = io.connect();

  socket.on('initial', function(data) {
    RouletteApp.init(data.sessionId, data.token);				
  });

  socket.on('subscribe', function(data) {
    RouletteApp.subscribe(data.sessionId, data.token);
  });

  socket.on('empty', function(data) {
    RouletteApp.wait();
  });

  window.Socket = socket;

  var SocketProxy = function() {

    var findPartner = function(mySessionId) {
      socket.send(JSON.stringify({
        event: "next",
        args: { sessionId: mySessionId }
      }));
    };

    return {
      findPartner: findPartner
    };
  }();

  var RouletteApp = function() {

    var apiKey = 413302;

    var mySession;
    var partnerSession;

    var partnerConnection;

    // Get view elements
    var ele = {};

    TB.setLogLevel(TB.DEBUG);

    var init = function(sessionId, token) {			
      ele.publisherContainer = document.getElementById('publisherContainer');
      ele.subscriberContainer = document.getElementById('subscriberContainer');
      ele.notificationContainer = document.getElementById('notificationContainer');
      ele.nextButton = document.getElementById('nextButton');

      ele.notificationContainer.innerHTML = "Connecting...";

      ele.nextButton.onclick = function() {
        RouletteApp.next();
      };

      mySession = TB.initSession(sessionId);			
      mySession.addEventListener('sessionConnected', sessionConnectedHandler);	
      mySession.addEventListener('streamCreated', streamCreatedHandler);
      mySession.addEventListener('connectionCreated', connectionCreatedHandler);	
      mySession.addEventListener('connectionDestroyed', connectionDestroyedHandler);	
      mySession.connect(apiKey, 'moderator_token');

      function sessionConnectedHandler(event) {
        ele.notificationContainer.innerHTML = "Connected, press allow.";

        var div = document.createElement('div');
        div.setAttribute('id', 'publisher');
        ele.publisherContainer.appendChild(div);

        var publisher = mySession.publish(div.id);
      };

      function streamCreatedHandler(event) {
        var stream = event.streams[0];
        if (mySession.connection.connectionId == stream.connection.connectionId) {
          SocketProxy.findPartner(mySession.sessionId);
        }
      };

      function connectionCreatedHandler(event) {
        partnerConnection = event.connections[0];
      };

      function connectionDestroyedHandler(event) {
        partnerConnection = null;
      }
    };

    var next = function() {			
      if (partnerConnection) {
        mySession.forceDisconnect(partnerConnection);				
      }

      if (partnerSession) {
        partnerSession.disconnect();
      }			
    };

    var subscribe = function(sessionId, token) {
      ele.notificationContainer.innerHTML = "Have fun !!!!";

      partnerSession = TB.initSession(sessionId);

      partnerSession.addEventListener('sessionConnected', sessionConnectedHandler);
      partnerSession.addEventListener('sessionDisconnected', sessionDisconnectedHandler);
      partnerSession.addEventListener('streamDestroyed', streamDestroyedHandler);

      partnerSession.connect(apiKey, token);

      function sessionConnectedHandler(event) {
        var div = document.createElement('div');
        div.setAttribute('id', 'subscriber');
        ele.subscriberContainer.appendChild(div);

        partnerSession.subscribe(event.streams[0], div.id);
      }

      function sessionDisconnectedHandler(event) {
        partnerSession.removeEventListener('sessionConnected', sessionConnectedHandler);
        partnerSession.removeEventListener('sessionDisconnected', sessionDisconnectedHandler);
        partnerSession.removeEventListener('streamDestroyed', streamDestroyedHandler);

        SocketProxy.findPartner(mySession.sessionId);
        partnerSession = null;
      }

      function streamDestroyedHandler(event) {
        partnerSession.disconnect();
      }
    };

    var wait = function() {
      ele.notificationContainer.innerHTML = "Nobody to talk to :(.  When someone comes, you'll be the first to know :).";
    };

    return {
      init: init,
      next: next,
      subscribe: subscribe,
      wait: wait
    };

  }();

})();
