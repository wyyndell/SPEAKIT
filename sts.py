from flask import Flask, request, send_from_directory, render_template
import os
import string

app = Flask(__name__)
mp4_directory = r'C:\Users\arade\PycharmProjects\SPEAKiT\static\mp4'


@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        query = request.form['text_input'].strip().lower()
        filenames = [f.lower() for f in os.listdir(mp4_directory)]  # Normalize filenames to lowercase

        # Remove punctuation from the query and filenames
        query = remove_punctuation(query)
        filenames = [remove_punctuation(f.replace('.mp4', '')) + '.mp4' for f in filenames]

        # Debug: Print the list of filenames
        print(f"Available files: {filenames}")

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

        # Debug: Print the video files to be played
        print(f"Video files to be played: {video_files}")

        if video_files:
            return render_template('sts.html', video_files=video_files)
        else:
            return render_template('sts.html', video_files=None)

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
