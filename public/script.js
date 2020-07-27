const socket = io('wss://35.192.21.18:3000', {transports: ['websocket']});
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer({host:'peerjs-server.herokuapp.com', secure:true, port:3001})
// const myPeer = new Peer(undefined, {
//   host: '/',
//   port: '3001'
// })

let muted = false,  userVideoStream11;


socket.on('hitesh', (msg)=>{
  console.log(msg);
});

const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  userVideoStream11 = stream;
  addVideoStream(myVideo, stream)

  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
      
    })
  })

  socket.on('user-connected', userId => {
    console.log("USER CONNECTED", userId);
    connectToNewUser(userId, stream)
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video);
}


function muteMe(){
  userVideoStream11.getAudioTracks()[0].enabled = !userVideoStream11.getAudioTracks()[0].enabled;
  console.log(userVideoStream11.getAudioTracks()[0].enabled);
  socket.emit('hitesh', 'asd',ROOM_ID);
}

function hideMe(){
  userVideoStream11.getVideoTracks()[0].enabled= !userVideoStream11.getVideoTracks()[0].enabled;
}
