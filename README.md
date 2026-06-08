# Puzzle Maker

A web-based jigsaw puzzle game. Drag and drop pieces to reassemble images, race against the clock, and compete on the leaderboard.

## Quick Start

You could either run run.bat in windows environment or open a bash terminal and run setup.sh

```bash
git clone <repository-url>
cd PuzzleGame
./setup.sh
```

That's it. Open the URL printed in the terminal (typically `http://localhost:5000`) in your browser and start playing.

## Features

- Adaptive grid that matches the image's aspect ratio so the whole picture is preserved
- Device-aware piece counts: fewer on phones and tablets, more on desktops and large screens
- Validates each connection so wrong pieces won't snap together
- Per-image leaderboards with player names and completion times
- Click sound feedback on correct connections
- Image gallery for switching between puzzles

## Adding New Puzzles

Drop any image into the `static/` folder. Supported formats:

- `.jpg`
- `.jpeg`
- `.png`

The image will appear in the gallery automatically the next time the page loads. No code changes needed.

For best results, use images that are at least 1200px on the longest side and roughly landscape or square. Very large images (over 5000px) will work but may feel sluggish on older devices.

## Persisting the Leaderboard

The leaderboard is stored in `leaderboard.json` at the top level of the `PuzzleGame` directory.

To preserve scores across restarts or redeployments:

1. Before stopping the app, copy `leaderboard.json` somewhere safe.
2. After restarting, place the file back in the `PuzzleGame` directory before users start playing.

If `leaderboard.json` doesn't exist, a fresh one will be created on the first save.

## Project Structure

```
PuzzleGame/
├── setup.sh              # One-shot setup and launch script
├── leaderboard.json      # Persistent scores (auto-created)
├── static/
│   ├── puzzle.js         # Game logic
│   ├── puzzle.css        # Styling
│   ├── click.wav         # Connection sound
│   └── *.jpg / *.png     # Puzzle images
├── templates/
│   └── index.html        # Main page
└── app.py                # Flask backend
```

## How It Works

The game uses [headbreaker.js](https://flbulgarelli.github.io/headbreaker/) for jigsaw piece geometry and connection detection. Each piece is validated against its original solved position, so pieces only stay connected if they were truly neighbours in the source image.

The Flask backend handles two endpoints:

- `POST /save` — record a new score for a given puzzle
- `GET /scores?puzzle_id=...` — fetch the top scores for a specific puzzle

## Troubleshooting

**No sound when connecting pieces?**
Browsers block audio until you've interacted with the page. Click anywhere first, then try again. Also check that `static/click.wav` is present.

**Puzzle pieces look squashed or stretched?**
Use images closer to a 16:9 or 4:3 aspect ratio. The grid auto-adjusts but extreme aspect ratios (very tall or very wide) get less natural pieces.

**Game feels slow?**
Resize very large images to about 1500px on the longest side. The drag-and-drop calculations scale with image size.

**Leaderboard not showing?**
Check that `leaderboard.json` is readable and that the Flask server has write permissions in the `PuzzleGame` directory.

## Requirements

These are installed automatically by `setup.sh`:

- Python 3.8+
- Flask
