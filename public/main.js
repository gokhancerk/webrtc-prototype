let selectRoom = document.getElementById('room');
let cRoom = document.getElementById('cRoom');
let inputRoom = document.getElementById('roomNum');
let btnEnter = document.getElementById('enter');
let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');

let roomNumber, localStream, remoteStream, rtcPeerConnection, isCaller;

const iceServers = {    
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' }
    ]
}

const streamConstraints = {
    audio: true,
    video: true
}

btnEnter.addEventListener('click', () => {
    if (inputRoom.value === '') {
        alert('Please enter a room number');
    } else {
        navigator.mediaDevices.getUserMedia(streamConstraints)
            .then(stream => {
                localStream = stream;
                localVideo.srcObject = stream;
                // localVideo.muted = true;
                // remoteVideo.muted = true;
                // remoteVideo.autoplay = true;
            })
            .catch(error => {
                console.error('Error accessing media devices.', error);
            });
        selectRoom.style.display = 'none';
        cRoom.style.display = 'block';
    }
});