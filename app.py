from flask import Flask, request, jsonify, render_template_string, send_from_directory
from werkzeug.utils import secure_filename
import json
from pathlib import Path

app = Flask(__name__, static_url_path='/static', static_folder='static')

SCORE_FILE_PATH = 'leaderboard.json'
STATIC_DIR = Path(app.root_path) / 'static'
ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg'}

def load_leaderboard():
    if not Path(SCORE_FILE_PATH).exists():
        return {}
    with open(SCORE_FILE_PATH, 'r') as f:
        return json.load(f)

def save_leaderboard(data):
    with open(SCORE_FILE_PATH, 'w') as f:
        json.dump(data, f, indent=4)

@app.route('/')
def index():
    # This serves your index.html file from the current folder
    return send_from_directory('.', 'index.html')
# This saves a new score to our text file
@app.route('/save', methods=['POST'])
def save_score():
    data = request.json
    # Expecting: {"puzzle_id": "image1.jpg", "name": "Alice", "time": 45.5}
    
    leaderboard = load_leaderboard()
    print(data)
    # Initialize puzzle list if it doesn't exist
    if data['puzzle_id'] not in leaderboard:
        leaderboard[data['puzzle_id']] = []
    
    # Add new score
    leaderboard[data['puzzle_id']].append({
        "name": data['name'],
        "time": float(data['time'])
    })
    
    save_leaderboard(leaderboard)
    return jsonify({"status": "ok"})

# This reads the text file and sends the top 5 to the screen
@app.route('/scores', methods=['GET'])
def get_scores():
    puzzle_id = request.args.get('puzzle_id')
    leaderboard = load_leaderboard()
    
    # Get scores for this specific puzzle, default to empty list if none found
    scores = leaderboard.get(puzzle_id, [])
    
    # Sort by time and take top 5
    sorted_scores = sorted(scores, key=lambda x: x['time'])[:5]
    
    return jsonify(sorted_scores)

@app.route('/get-images', methods=['GET'])
def get_images():
    # Looks in the 'static' folder relative to your app
    static_dir = Path(app.root_path) / 'static'
    
    # Define extensions (using a set is faster for lookups)
    allowed_extensions = {'.png', '.jpg', '.jpeg'}
    
    # Iterate and filter
    # f.name gives you the filename as a string
    # f.suffix.lower() checks the file extension
    images = [
        f.name for f in static_dir.iterdir() 
        if f.is_file() and f.suffix.lower() in allowed_extensions
    ]
    print(images)
    return jsonify(images)

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['image']
    if not file or file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    filename = secure_filename(file.filename)
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": "Only .png, .jpg, .jpeg allowed"}), 400

    STATIC_DIR.mkdir(exist_ok=True)
    dest = STATIC_DIR / filename

    if dest.exists():
        stem, suffix = dest.stem, dest.suffix
        n = 1
        while dest.exists():
            dest = STATIC_DIR / f"{stem}_{n}{suffix}"
            n += 1
        filename = dest.name

    file.save(dest)
    return jsonify({"status": "ok", "filename": filename})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)