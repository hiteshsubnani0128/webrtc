
const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer({host:'peerjs-server.herokuapp.com', secure:true, port:443})
// const myPeer = new Peer(undefined, {
//   host: '/',
//   port: '3001'
// })

let muted = false,  userVideoStream11, ovideo;

socket.on('hitesh', (msg)=>{
  let lok = document.createElement('p');
  lok.setAttribute('class','rightMe');
  lok.append(msg);
  document.getElementById('msgBox').append(lok);
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
      ovideo = video;
    })
  })

  socket.on('user-connected', userId => {
    console.log("USER CONNECTED", userId);
    alert('newUser joined the chat');
    connectToNewUser(userId, stream)
  })
})

socket.on('user-disconnected', userId => {
  peers[userId].close();
  console.log('user disconnected', userId);
  if (peers[userId]) peers[userId].close();
  alert('A user has left the chat');
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
  
  if(userVideoStream11.getAudioTracks()[0].enabled){
    document.getElementById('muteMe').innerText='Mute Me'
  } else {
    document.getElementById('muteMe').innerText='Un Mute'
  }
}

function hideMe(){
  if(userVideoStream11.getVideoTracks()[0].enabled){
    document.getElementById('videoOff').innerText='Video Off'
  } else {
    document.getElementById('videoOff').innerText='Video On'
  } 
}

function sendChat(){
  chatBox = document.getElementById('chat');
  if(chatBox.value==""){
    alert('Enter Something');
  } else{
    let lok = document.createElement('p');
    console.log(chatBox.value);
    socket.emit('hitesh', chatBox.value ,ROOM_ID);
    lok.append(chatBox.value);
    document.getElementById('msgBox').append(lok);
    chatBox.value='';
  }
  console.log();
}

