let selectRoom = document.getElementById("room");
let cRoom = document.getElementById("cRoom");
let inputRoom = document.getElementById("roomNum");
let btnEnter = document.getElementById("enter");
let localVideo = document.getElementById("localVideo");
let remoteVideo = document.getElementById("remoteVideo");

let roomNumber, localStream, remoteStream, rtcPeerConnection, isCaller;

const iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

const streamConstraints = {
  audio: true,
  video: true,
};

const socket = io();

btnEnter.addEventListener("click", () => {
  if (inputRoom.value === "") {
    alert("Please enter a room number");
  } else {
    roomNumber = inputRoom.value;
    socket.emit("create or join", roomNumber);
    selectRoom.style.display = "none";
    cRoom.style.display = "block";
  }
});

socket.on("created", (room) => {
  navigator.mediaDevices
    .getUserMedia(streamConstraints)
    .then((stream) => {
      localStream = stream;
      localVideo.srcObject = stream;
      isCaller = true;
    })
    .catch((err) => {
      console.log("An error occurred", err);
    });
});

socket.on("joined", (room) => {
  navigator.mediaDevices
    .getUserMedia(streamConstraints)
    .then((stream) => {
      localStream = stream;
      localVideo.srcObject = stream;
      socket.emit("ready", roomNumber);
    })
    .catch((err) => {
      console.log("An error occurred", err);
    });
});

socket.on("ready", () => {
  if (isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    rtcPeerConnection
      .createOffer()
      .then((sessionDescription) => {
        console.log("sending offer", sessionDescription);
        rtcPeerConnection.setLocalDescription(sessionDescription);
        socket.emit("offer", {
          type: "offer",
          sdp: sessionDescription,
          room: roomNumber,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

socket.on("offer", (event) => {
  if (!isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    console.log("received offer", event);
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
    rtcPeerConnection
      .createAnswer()
      .then((sessionDescription) => {
        console.log("sending answer", sessionDescription);
        rtcPeerConnection.setLocalDescription(sessionDescription);
        socket.emit("answer", {
          type: "answer",
          sdp: sessionDescription,
          room: roomNumber,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

socket.on("answer", (event) => {
    console.log("received answer", event);
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

socket.on("candidate", (event) => {
  let candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate,
  });
  console.log("received ice candidate", candidate);
  rtcPeerConnection.addIceCandidate(candidate);
});

function onAddStream(event) {
  remoteVideo.srcObject = event.streams[0];
  remoteStream = event.streams[0];
}

function onIceCandidate(event) {
  if (event.candidate) {
    console.log("sending ice candidate", event.candidate);
    socket.emit("candidate", {
      type: "candidate",
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
      room: roomNumber,
    });
  }
}
