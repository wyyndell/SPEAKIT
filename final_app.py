from flask import Flask, render_template, request, jsonify, send_from_directory
import cv2
import mediapipe as mp
import numpy as np
import pickle
import base64
import os
import string

app = Flask(__name__)

# Paths
mp4_directory = r'C:\Users\arade\PycharmProjects\SPEAKiT\static\mp4'

# Load the SVM model
with open('model.pkl', 'rb') as f:
    svm = pickle.load(f)

# Hand gesture processing function
def image_processed(hand_img):
    img_rgb = cv2.cvtColor(hand_img, cv2.COLOR_BGR2RGB)
    img_flip = cv2.flip(img_rgb, 1)

    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(static_image_mode=True, max_num_hands=1, min_detection_confidence=0.7)
    output = hands.process(img_flip)
    hands.close()

    try:
        data = output.multi_hand_landmarks[0]
        data = str(data).strip().split('\n')
        garbage = ['landmark {', '  visibility: 0.0', '  presence: 0.0', '}']
        without_garbage = [i.strip()[2:] for i in data if i not in garbage]
        clean = [float(i) for i in without_garbage]
        return clean
    except:
        return None
@app.route('/')
def landing():
    return render_template('index.html')

@app.route('/index')
def index():
    return render_template('stt.html')

@app.route('/choice')
def choice():
    return render_template('index.html')

@app.route('/stt')
def stt():
    return render_template('stt.html')

@app.route('/sts')
def sts():
    return render_template('sts.html')

@app.route('/tosts')
def tosts():
    return render_template('sts.html')

@app.route('/tostt')
def tostt():
    return render_template('stt.html')

@app.route('/process_frame', methods=['POST'])
def process_frame():
    data = request.json['image']
    header, encoded = data.split(",", 1)
    img_bytes = base64.b64decode(encoded)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    hand_features = image_processed(img)
    if hand_features is not None:
        prediction = svm.predict([hand_features])
        result = prediction[0].lower()  # Normalize result to lowercase

        # If the detected gesture is "hello", return a space
        if result == "hello":
            return jsonify({'translation': ' '})  # Return space for hello
        else:
            return jsonify({'translation': result})
    else:
        return jsonify({'translation': ''})

@app.route('/text_input', methods=['POST'])
def text_input():
    query = request.form['text_input'].strip().lower()
    filenames = [f.lower() for f in os.listdir(mp4_directory)]  # Normalize filenames to lowercase

    # Remove punctuation from the query and filenames
    query = remove_punctuation(query)
    filenames = [remove_punctuation(f.replace('.mp4', '')) + '.mp4' for f in filenames]

    # Split the input text into words
    words = query.split()

    # To store final video files to be played
    video_files = []

    # Track the current index to process words in sequence
    index = 0

    # Check for multi-word phrases and words in order
    while index < len(words):
        found = False
        # Check for multi-word phrases starting from the longest possible
        for i in range(len(words), index, -1):
            phrase = ' '.join(words[index:i])
            phrase_file = f"{phrase}.mp4".lower()
            if phrase_file in filenames:
                video_files.append(phrase_file)
                index = i
                found = True
                break

        # If no phrase is found, add individual word or letter videos
        if not found:
            word = words[index]
            if f"{word}.mp4" in filenames:
                video_files.append(f"{word}.mp4")
            else:
                # Add fingerspelled videos for the word if no direct match is found
                video_files.extend(get_fingerspelled_videos(word, filenames))
            index += 1

    if video_files:
        return render_template('sts.html', video_files=video_files)
    else:
        return render_template('sts.html', video_files=None)


def remove_punctuation(text):
    """Remove punctuation from the text."""
    return text.translate(str.maketrans('', '', string.punctuation))

def get_fingerspelled_videos(text, filenames):
    """Helper function to return finger-spelled videos for given text."""
    video_files = []
    for letter in text:
        letter_file = f"{letter}.mp4".lower()
        if letter_file in filenames:
            video_files.append(letter_file)
        else:
            # Debug: Print missing letter file
            print(f"Missing file for letter: {letter_file}")
    return video_files

@app.route('/static/mp4/<filename>')
def get_mp4(filename):
    return send_from_directory(mp4_directory, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
