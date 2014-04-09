
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var index = require('./routes/index.js');
var app = express();
var server = http.createServer(app);
var path = require('path');
var fs = require('fs');
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
};

app.get('/', function(req,res){
  res.render('index.html', {title: "Hello world"});
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);

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

