const micToggle = document.getElementById('mic-toggle');
const textInput = document.getElementById('text_input');
const speakButton = document.getElementById('speak-button');
const formContainer = document.getElementById('form-container');
const sWave = document.querySelector('.s-wave'); // Select the s-wave element
const Wave = document.querySelector('.video-container'); // Select the s-wave element
const nav = document.querySelector('.header'); // Select the s-wave element
const con = document.querySelector('.bottom-con'); // Select the s-wave element
const res = document.querySelector('.response'); // Select the s-wave element
const mic = document.querySelector('.mic'); // Select the s-wave element
const status = document.getElementById('status');


// Get both the 'write' and 'edit' buttons
const writeButton = document.getElementById('write');
const editButton = document.getElementById('edit');

let recognition;
let isRecognitionOn = false;

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = function(event) {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
            finalTranscript += result[0].transcript;
        } else {
            interimTranscript += result[0].transcript;
        }
    }

    // Update the textarea with the recognized text
    textInput.value = finalTranscript + interimTranscript;
    textInput.scrollTop = textInput.scrollHeight;

    // Keep bottom-con hidden while the mic is on, even when updating text
    if (isRecognitionOn) {
        con.style.display = 'none'; // Keep hidden while mic is on
    }
};

// When mic stops recognizing (onend), show the bottom-con
recognition.onend = function() {
    micToggle.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
    isRecognitionOn = false;
    sWave.style.display = 'none'; // Hide s-wave
    Wave.style.display = 'block'; // Show Wave
    nav.style.display = 'flex'; // Show nav
    con.style.display = 'flex'; // Show bottom-con
    res.style.display = 'flex'; // Show response
    status.textContent = 'Transcribing...';
};

// Mic toggle logic
micToggle.addEventListener('mousedown', function() {
    if (!isRecognitionOn) {
        recognition.start();
        micToggle.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        isRecognitionOn = true;
        sWave.style.display = 'block'; // Show s-wave
        Wave.style.display = 'none';
        nav.style.display = 'none';
        con.style.display = 'none'; // Hide bottom-con when mic is on
        status.textContent = 'Transcribing...';
        micToggle.style.zIndex = '999';

    }
});

micToggle.addEventListener('mouseup', function() {
    if (isRecognitionOn) {
        recognition.stop();
    }
});


} else {
    micToggle.style.display = 'none';
}

// Prevent form submission when the "Speak" button is clicked
speakButton.addEventListener('click', function(event) {
    event.preventDefault();
    const text = textInput.value;
    if (text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;

        utterance.onstart = function() {
            document.querySelector('.spectrum').style.display = 'block';
            document.querySelector('.video-container').style.display = 'none';
        };

        utterance.onend = function() {
            document.querySelector('.spectrum').style.display = 'none';
            document.querySelector('.video-container').style.display = 'block';
        };

        speechSynthesis.speak(utterance);
    }
});


// Function to toggle between write and read-only mode, and clear text input
// Function to toggle between write and read-only mode without affecting visibility
function toggleWriteMode() {
    textInput.value = ''; // Clear the textarea content
    textInput.readOnly = !textInput.readOnly; // Toggle read-only state

    if (!textInput.readOnly) {
        textInput.placeholder = 'Write here your response'; // Update placeholder for writing
    } else {
        textInput.placeholder = 'Make a sound'; // Update placeholder for microphone input
    }

    // Keep formContainer, response, and bottom-con visible
    formContainer.style.display = 'block';
    con.style.display = 'flex';
    res.style.display = 'flex';
}

// Attach event listeners to both write and edit buttons
writeButton.addEventListener('click', toggleWriteMode);
editButton.addEventListener('click', toggleWriteMode);

// Function to toggle form visibility based on input (without closing response and bottom-con)
function toggleFormVisibility() {
    if (textInput.value.trim()) {
        formContainer.style.display = 'block'; // Show the form container when there's input
        con.style.display = 'flex'; // Keep bottom-con visible
        res.style.display = 'flex'; // Keep response visible
    }
}

