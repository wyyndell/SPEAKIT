from flask import Flask, render_template, request, jsonify
import cv2
import mediapipe as mp
import numpy as np
import pickle
import base64

app = Flask(__name__)

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

with open('model.pkl', 'rb') as f:
    svm = pickle.load(f)

@app.route('/')
def index():
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
        result = prediction[0]
        return jsonify({'translation': result})
    else:
        return jsonify({'translation': ''})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
