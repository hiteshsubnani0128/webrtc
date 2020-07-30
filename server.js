const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid');
const bodyParser = require('body-parser');

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  res.render('home');
})
.post('/', (req, res)=>res.redirect(req.body.room));

app.get('/adddata', (req, res)=>{
  console.log(req.query);
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userId)
    
    socket.on('hitesh',(msg, roomId)=>{
      console.log(msg);
      // io.emit('hitesh', msg);
      socket.to(roomId).broadcast.emit('hitesh', msg);
    });

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
      console.log(userId, "Disconnected");
    })
  })
})

server.listen(3000,()=> console.log('Server started on 3000'));