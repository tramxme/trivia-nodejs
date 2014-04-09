var io = require('./../node_modules/socket.io/node_modules/socket.io-client');
    assert = require('assert');
    socketURL = 'http://localhost:3000';
    options = {
      transports: ['websocket'],
      'force new connection': true
    };
    user1 = {name: "YOLO"};
    user2 = {name: "YOLOSWAG"};


describe("Test suit", function(){
  this.timeout(10000);

  //When a user logs on, his name and score should be set!!!
  it("should set user's name and score to 0 upon connecting",function(done){
    var client1;
    client1 = io.connect(socketURL, options);
    client1.on('connect', function(data){
      client1.emit('set_user_name', user1.name);
    });


    client1.on('ready', function(name, users){
      assert.equal(user1.name, name);
      assert.equal(users.hasOwnProperty(user1.name),true);
      assert.equal(users[user1.name], 0);
      client1.disconnect();
      done();
    });
  });

  //when a new user logs on, a hash containing users' names and scores got updated
  it("should get an updated list with new user's name", function(done){
    var client1, client2;

    client1 = io.connect(socketURL, options);
    client1.on('connect', function(data){
      client1.emit('set_user_name', user1.name);

      client2 = io.connect(socketURL, options);
      client2.on('connect',function(data){
        client2.emit('set_user_name', user2.name);
      });

      client2.on('ready',function(name, users){
        assert.equal(Object.keys(users).length, 2);
        client1.disconnect();
        client2.disconnect();
        done();
      });
    });

  });

  //When a user disconnects, his name should be removed
  it('should remove disconnected user', function(done){
    var client1, client2;
    client1 = io.connect(socketURL, options);
    client1.on('connect',function(data){
      client1.emit('set_user_name', user1.name);

      client2 = io.connect(socketURL, options);
      client2.on('connect',function(data){
        client2.emit('set_user_name', user2.name);
        client2.on('ready', function(name, users){
          assert.equal(Object.keys(users).length,2);
        });
        client1.disconnect();
        client2.on('user_disconnect', function(name,users){
          client2.disconnect();
          done();
        });
      });
    })
  });

  //When a user answers a question right, score increases by 1
  it("should update a user's score if he answers a question correctly", function(done){
    var client1;
    client1 = io.connect(socketURL, options);
    client1.on('connect',function(data){
      client1.emit('set_user_name', user1.name);
      client1.emit('question_1', {attempt: '30'});
      client1.on('correct_1',function(answer,name,score){
        assert.equal(score, 1);
        client1.disconnect();
        done();
      });
    });
  });

  //When a user answers a question wrong, score remains 0
  it("should keep the user's old score if he answers a question wrong", function(done){
    var client1;
    client1 = io.connect(socketURL, options);
    client1.on('connect',function(data){
      client1.emit('set_user_name', user1.name);
      client1.emit('question_1', {attempt: 'I dont know'});
      client1.on('wrong',function(users){
        assert.equal(users[user1.name],0);
        client1.disconnect();
        done();
      });
    });
  });
})
