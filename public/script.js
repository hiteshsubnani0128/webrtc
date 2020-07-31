const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer({
  host: 'peerjs-server.herokuapp.com',
  secure: true,
  port: 443
});
// const myPeer = new Peer(undefined, {
//   host: '/',
//   port: '3001'
// })

let muted = false,
  userVideoStream11, ovideo;

socket.on('hitesh', (msg,userName) => {
  let lok = document.createElement('p');
  lok.setAttribute('class', 'rightMe');

  let div = document.createElement('div');
    div.append(userName);
    div.setAttribute('class', 'smMuted');

  lok.append(div);
  lok.append(msg);
  document.getElementById('msgBox').append(lok);
  if (navigator.vibrate) {
    navigator.vibrate(1000);
  }
});

const myVideo = document.createElement('video');
myVideo.muted = true;


const peers = {}
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: {
      echoCancellation: {
        exact: true
      }
    }
  }).then(stream => {
    console.log("Stream", stream);
    userVideoStream11 = stream;
    addVideoStream(myVideo, stream)

    myPeer.on('call', call => {
      call.answer(stream)
      const video = document.createElement('video')

      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
        console.log("ASD", userVideoStream);
        ovideo = video;
      })
    })

    socket.on('user-connected', userId => {
      console.log("USER CONNECTED", userId);
      alert('newUser joined the chat');
      connectToNewUser(userId, stream)
    })
  })
  .catch(err => {
    if (err) {
      navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      }).then(stream => {
        console.log("Stream", stream);
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
    }
  });

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
  console.log("USER CONNECTED", userId);
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');
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


function muteMe() {
  userVideoStream11.getAudioTracks()[0].enabled = !userVideoStream11.getAudioTracks()[0].enabled;

  if (userVideoStream11.getAudioTracks()[0].enabled) {
    document.getElementById('muteMe').innerText = 'Mute Me'
  } else {
    document.getElementById('muteMe').innerText = 'Un Mute'
  }
}

function hideMe() {
  userVideoStream11.getVideoTracks()[0].enabled = !userVideoStream11.getVideoTracks()[0].enabled;
  if (userVideoStream11.getVideoTracks()[0].enabled) {
    document.getElementById('videoOff').innerText = 'Video Off'
  } else {
    document.getElementById('videoOff').innerText = 'Video On'
  }
}

function sendChat() {
  chatBox = document.getElementById('chat');
  if (chatBox.value == "") {
    alert('Enter Something');
  } else {
    let lok = document.createElement('p');
    console.log(chatBox.value);
    socket.emit('hitesh', chatBox.value, ROOM_ID, userName);

    let div = document.createElement('div');
    div.append(userName);
    div.setAttribute('class', 'smMuted');

    lok.appendChild(div);

    lok.append(chatBox.value);

    document.getElementById('msgBox').append(lok);
    chatBox.value = '';
  }
  console.log();
}

var canvas = document.getElementById('updating-chart'),
    ctx = canvas.getContext('2d'),
    startingData = {
      labels: [0, 2, 4, 6, 8, 10, 12],
      datasets: [
          {   
              label: 'user1',
              fillColor: "rgba(220,220,220,0.2)",
              strokeColor: "rgba(220,220,220,1)",
              pointColor: "rgba(220,220,220,1)",
              pointStrokeColor: "#fff",
              data: [65, 59, 80, 81, 56, 55, 40]
          },
          {
              label: userName,
              fillColor: "rgba(151,187,205,0.2)",
              strokeColor: "rgba(151,187,205,1)",
              pointColor: "rgba(151,187,205,1)",
              pointStrokeColor: "#fff",
              data: [28, 48, 40, 19, 86, 27, 90]
          }
      ]
    };

// Reduce the animation steps for demo clarity.
var myLiveChart = new Chart(ctx,{
  type: 'line',
  data: startingData
});


setInterval(function(){
  // Get a random index point
  var indexToUpdate = Math.round(Math.random() * startingData.labels.length);
  
  // Update one of the points in the second dataset
  myLiveChart.data.datasets[0].data[indexToUpdate] = Math.random() * 100;
  
  myLiveChart.update();
}, 500);