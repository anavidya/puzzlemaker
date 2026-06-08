document.addEventListener('DOMContentLoaded', loadGallery);
document.addEventListener('DOMContentLoaded', () => {
    fetch('/get-images')
        .then(response => response.json())
        .then(images => {
            if (images.length > 0) {
                startPuzzle(`/static/${images[0]}`);
            }
        })
        .catch(err => console.error("Error loading initial puzzle:", err));

    const uploadInput = document.getElementById('puzzle-upload');
    if (uploadInput) {
        uploadInput.addEventListener('change', uploadPuzzle);
    }
});
let seconds = 0; 
let timerInterval = null;
let currentPuzzleId = 'map.jpg';
function startPuzzle(imagePath){
    const clickSound = new Audio('/static/click.wav');
    const img = new Image();
    img.src = imagePath;
	currentPuzzleId = imagePath.split('/').pop();

    img.onload = () => {
        const canvasDiv = document.getElementById('canvas');
        canvasDiv.innerHTML = '';

		let dragStartPosition = { x: 0, y: 0 };

		
        // ---- Viewport + device class ----
        const w = window.innerWidth;
        const h = window.innerHeight;
        const isPhone = w < 768;
        let deviceClass;
        if (w < 768)       deviceClass = 'phone';
        else if (w < 1200) deviceClass = 'tablet';
        else if (w < 1920) deviceClass = 'desktop';
        else               deviceClass = 'largescreen';

        const canvasWidth  = isPhone ? w : w - 300;
        const canvasHeight = isPhone ? h - 120 : h;

        // ---- Grid matching image aspect ----
        const imgAspect = img.width / img.height;
        const targetPieces = {
            phone:       6,
            tablet:      12,
            desktop:     20,
            largescreen: 40
        }[deviceClass];

        const verticalPieces   = Math.max(2, Math.round(Math.sqrt(targetPieces / imgAspect)));
        const horizontalPieces = Math.max(2, Math.round(verticalPieces * imgAspect));

        // ---- Piece size ----
        const shuffleMargin = 1.5;
        const pieceSize = Math.floor(Math.min(
            canvasWidth  / (horizontalPieces + shuffleMargin * 2),
            canvasHeight / (verticalPieces   + shuffleMargin * 2)
        ));
        console.log(`Grid: ${horizontalPieces}x${verticalPieces}, pieceSize: ${pieceSize}`);

        // ---- Build puzzle ----
        const canvas = new headbreaker.Canvas('canvas', {
            width:  canvasWidth,
            height: canvasHeight,
            pieceSize: pieceSize,
            proximity: Math.floor(pieceSize * 0.2),
            borderFill: 10,
            strokeWidth: 2,
            strokeColor: '#ffffff',
            lineSoftness: 0.18,
            image: img,
            preventOffstageDrag: true,
            fixed: true
        });
        window.canvas = canvas;

		// Assuming your library has an event for drag start
		if (canvas.figures && canvas.figures.length > 0) {
			canvas.figures.forEach((piece) => {
				// Konva uses .on('dragstart', ...)
				piece.on('dragstart', () => {
					// Save the start position
					dragStartPosition = { x: piece.x(), y: piece.y() };
				});
			});
		} // This will list every function and property available on 'canvas'

        canvas.adjustImagesToPuzzleWidth();
        canvas.autogenerate({
            horizontalPiecesCount: horizontalPieces,
            verticalPiecesCount:   verticalPieces
        });

        // Snapshot solved positions BEFORE shuffle
        // Each piece's centralAnchor right now == its solved position
        const solvedPositions = new Map();
        canvas.puzzle.pieces.forEach((p, i) => {
            solvedPositions.set(p, {
                x: p.centralAnchor.x,
                y: p.centralAnchor.y,
                index: i
            });
        });

        canvas.attachSolvedValidator();
        canvas.shuffle(0.25);
        canvas.draw();
        // ---- Timer ----
        timerInterval = setInterval(() => {
            seconds++;
            const timerElement = document.getElementById('timer');
            if (timerElement) timerElement.innerText = seconds;
        }, 1000);
		loadLeaderboard(currentPuzzleId); 

        // ---- Check if two pieces were originally neighbours ----
        function wereOriginalNeighbours(p1, p2) {
            const sp1 = solvedPositions.get(p1);
            const sp2 = solvedPositions.get(p2);
            if (!sp1 || !sp2) return false;

            const dx = Math.abs(sp1.x - sp2.x);
            const dy = Math.abs(sp1.y - sp2.y);
            const tol = pieceSize * 0.3;  // tolerance for "about one piece apart"

            const horizontalNeighbour = Math.abs(dx - pieceSize) < tol && dy < tol;
            const verticalNeighbour   = Math.abs(dy - pieceSize) < tol && dx < tol;
            return horizontalNeighbour || verticalNeighbour;
        }

        // ---- Connection handler: reject wrong connections ----
        canvas.onConnect((piece, figure, targetPiece, targetFigure) => {
            if (!wereOriginalNeighbours(piece, targetPiece)) {
                // Wrong match — undo the connection silently
                console.log('Wrong connection, disconnecting');
				// 2. Immediate disconnect
				piece.disconnect();

				if (figure.group) {
					figure.group.position({ 
						x: dragStartPosition.x +30, 
						y: dragStartPosition.y +30
					});
				}
				canvas.redraw();
		

                return;
            }

            // Correct connection
            clickSound.currentTime = 0;
            clickSound.play().catch(err => console.log('Sound blocked:', err));

            canvas.puzzle.validate();
        });

        // ---- Win ----
        canvas.onValid(() => {
            clearInterval(timerInterval);
			confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
			const modal = document.getElementById('win-modal');
			document.getElementById('win-message').innerText = `Finished in ${seconds} seconds!`;
			modal.style.display = 'flex';
            //setTimeout(() => {
            //    const name = prompt(
            //        `Great job! You finished in ${seconds} seconds. ` +
            //        `Enter your name for the leaderboard:`
            //    );
            //    if (name) saveScore(name, seconds);
            //}, 500);
        });
    };

    

    
	
	
};
function uploadPuzzle(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    fetch('/upload', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            loadGallery();
            startPuzzle(`/static/${data.filename}`);
            event.target.value = '';
        })
        .catch(err => {
            console.error('Upload failed:', err);
            alert('Upload failed');
        });
}

function loadGallery() {
	fetch('/get-images')
		.then(response => response.json())
		.then(images => {
			const gallery = document.getElementById('thumbnail-gallery');
			gallery.innerHTML = ''; // Clear existing

			images.forEach(imgName => {
				const img = document.createElement('img');
				img.src = `/static/${imgName}`;
				img.alt = imgName;
				
				// Optional: Make the image clickable to load that puzzle
				img.onclick = () => {
					console.log("Selected puzzle:", imgName);
					loadLeaderboard(imgName);
					window.startPuzzle(`/static/${imgName}`);
					// Add your logic here to start the game with this image
				};
				
				gallery.appendChild(img);
			});
		})
		.catch(err => console.error("Error loading images:", err));
}
function loadLeaderboard(puzzleId) {
	const leaderboardList = document.getElementById('score-list');
	fetch(`/scores?puzzle_id=${puzzleId}`)
		.then(response => response.json())
		.then(scores => {
			
			leaderboardList.innerHTML = ''; // Clear current list
			scores.sort((a, b) => parseFloat(a.time) - parseFloat(b.time));
			const htmlString = scores.map((entry, index) => {
				const rankClass = index < 3 ? `rank-${index + 1}` : '';
				return `
				<div class="lb-row">
					<span class="${rankClass}">${index + 1}</span>
					<span>${entry.name}</span>
					<span>${entry.time}s</span>
				</div>
			`;
			}).join('');
			leaderboardList.innerHTML = htmlString
		})
		.catch(err => console.error("Error loading scores:", err));
}

function submitScore() {
    const name = document.getElementById('player-name').value;
    if (name) {
        saveScore(name, seconds);
        document.getElementById('win-modal').style.display = 'none';
        document.getElementById('player-name').value = ''; // Reset
    } else {
        alert("Please enter a name!");
    }
}

function saveScore(name, time) {
	// Get the filename (e.g., "map.jpg") from the image source
	//const puzzleId = img.src.split('/').pop(); 

	fetch('/save', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ 
			puzzle_id: currentPuzzleId, // Matches your Python request.args
			name: name, 
			time: time 
		})
	})
	.then(response => response.json())
	.then(data => {
		console.log("Score saved!");
		// Refresh the leaderboard display after saving
		loadLeaderboard(currentPuzzleId); 
	});
}