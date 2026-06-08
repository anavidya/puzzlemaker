#!/bin/bash
# 1. Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# 2. Activate
source venv/Scripts/activate

# 3. Install dependencies
echo "Installing dependencies..."
python -m pip install -r requirements.txt

# 4. Run
echo "Starting the Puzzle Game..."
python app.py