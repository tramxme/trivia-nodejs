var express = require('express');
var http = require('http');
var port = process.env.PORT || 3000
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
// all environments

app.use(express.static(__dirname + '/views'));

server.listen(port, function(){
  console.log('Starting server');
});

// Heroku won't actually allow WebSockets
// have to setup polling instead.
// https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

var users = {};

io.sockets.on('connection', function(socket){
  socket.on('set_user_name',function(name){
    if(users.hasOwnProperty(name)){
      socket.emit('choose_diff_name');
    }else{
      socket.set('username', name);
      socket.get('username', function(err,name){
        users[name] = 0;
        socket.emit('ready', name, users);
        socket.broadcast.emit('add',{name: name, score: 0});
      });
    }
  });

  //Server response when a question is answered
  function question(question, answer, emitEvent){
    socket.on(question, function(data){
      if(data.attempt == answer){
        socket.get('username', function(err,name){
          users[name] += 1;
          io.sockets.emit(emitEvent, answer, name, users[name]);
        });
      }else{
        socket.emit('wrong', users);
      };
    });
  };

  question('question_1', '30', 'correct_1');
  question('question_2', '25/48', 'correct_2');
  question('question_3', '9', 'correct_3');
  question('question_4', '1', 'correct_4');
  question('question_5', 'a googol', 'correct_5');



  socket.on('disconnect',function(){
    socket.get('username',function(err,name){
      delete users[name];
      io.sockets.emit('user_disconnect',name, users);
    });
  });
});

