const socket = io();

const qrImage = document.getElementById('qr-image');
const qrBox = document.getElementById('qr-box');
const connectedMessage = document.getElementById('connected-message');

socket.on('qr', (qrDataUrl) => {
    qrImage.src = qrDataUrl;
    qrBox.style.display = 'block';
    connectedMessage.style.display = 'none';
});

socket.on('connected', (status) => {
    if (status) {
        qrBox.style.display = 'none';
        connectedMessage.style.display = 'block';
    } else {
        qrBox.style.display = 'block';
        connectedMessage.style.display = 'none';
    }
});