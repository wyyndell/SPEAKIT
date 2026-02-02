const video = document.getElementById('video');
const translateButton = document.getElementById('translateButton');
const backspaceButton = document.getElementById('backspaceButton');
const clearButton = document.getElementById('clearButton');
const speakButton = document.getElementById('speakButton');
const switchCamButton = document.getElementById('switchCamButton');
const cameraSelect = document.getElementById('cameraSelect');
const status = document.getElementById('status');
const translation = document.getElementById('translation');
const suggestionsContainer = document.getElementById('suggestions');
const sound = document.getElementById('sound');
let translating = false;
let translationInterval = null;
let lastTranslation = "";
let currentFormingWord = "";
let currentStream = null;
let currentDeviceId = null;
let lastUpdateTime = 0;

// Access the user's camera
async function getCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    cameraSelect.innerHTML = '';
    videoDevices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `Camera ${cameraSelect.length + 1}`;
        cameraSelect.appendChild(option);
    });
}

async function startCamera(deviceId) {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    const constraints = {
        video: {
            deviceId: deviceId ? { exact: deviceId } : undefined
        }
    };
    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = currentStream;
}

cameraSelect.addEventListener('change', () => {
    const selectedDeviceId = cameraSelect.value;
    startCamera(selectedDeviceId);
});

switchCamButton.addEventListener('click', () => {
    const currentIndex = Array.from(cameraSelect.options).findIndex(option => option.value === cameraSelect.value);
    const nextIndex = (currentIndex + 1) % cameraSelect.options.length;
    cameraSelect.selectedIndex = nextIndex;
    startCamera(cameraSelect.value);
});

translateButton.addEventListener('click', () => {
    translating = !translating;
    if (translating) {
        translateButton.textContent = 'Stop';
        translateButton.style.backgroundColor = 'red';
        status.textContent = 'Translation is on';
        startTranslation();
    } else {
        translateButton.textContent = 'Start';
        translateButton.style.backgroundColor = '#007bff';
        status.textContent = 'Translation is off';
        stopTranslation();
    }
});

backspaceButton.addEventListener('click', () => {
    const text = translation.value;
    translation.value = text.slice(0, -1);
    currentFormingWord = translation.value.trim();
    updateSuggestions(currentFormingWord);
});

clearButton.addEventListener('click', () => {
    translation.value = '';
    suggestionsContainer.innerHTML = '';
    currentFormingWord = '';
});

speakButton.addEventListener('click', () => {
    const textToSpeak = translation.value;
    if (textToSpeak) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        window.speechSynthesis.speak(utterance);
    }
});

function startTranslation() {
    if (!translationInterval) {
        translationInterval = setInterval(captureFrame, 1000);
    }
}

function stopTranslation() {
    clearInterval(translationInterval);
    translationInterval = null;
}

function captureFrame() {
    if (translating) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        sendFrame(dataUrl);
    }
}

function sendFrame(dataUrl) {
    fetch('/process_frame', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: dataUrl })
    })
    .then(response => response.json())
    .then(data => {
        const currentTranslation = data.translation || '';
        const now = Date.now();

        // Allow the same translation to be appended if it appears within 2 seconds
        if (currentTranslation && (currentTranslation !== lastTranslation || now - lastUpdateTime > 2000)) {
            // If the translation is a space (from "hello"), append it
            translation.value += currentTranslation;
            lastTranslation = currentTranslation;
            lastUpdateTime = now;
            currentFormingWord = translation.value.trim();
            playSound();
            updateSuggestions(currentFormingWord);
        }
    })
    .catch(error => console.error('Error processing frame:', error));
}

function playSound() {
    sound.currentTime = 0;
    sound.play();
}

function updateSuggestions(currentFormingWord) {
    const apiUrl = `https://api.datamuse.com/words?sp=${currentFormingWord}*`;
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            suggestionsContainer.innerHTML = '';
            const suggestions = data.slice(0, 3);
            suggestions.forEach(suggestion => {
                const suggestionButton = document.createElement('button');
                suggestionButton.className = 'suggestion-button';
                suggestionButton.textContent = suggestion.word;
                suggestionButton.addEventListener('click', () => {
                    translation.value += suggestion.word.substring(currentFormingWord.length);
                    currentFormingWord = '';
                    updateSuggestions(currentFormingWord);
                });
                suggestionsContainer.appendChild(suggestionButton);
            });
        })
        .catch(error => console.error('Error fetching suggestions:', error));
}

// Initialize cameras on load
getCameras().then(() => {
    if (cameraSelect.options.length > 0) {
        startCamera(cameraSelect.value);
    }
});