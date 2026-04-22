@echo off
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo Starting the Puzzle Game...
python app.py
pause