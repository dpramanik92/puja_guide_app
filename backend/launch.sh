#!/bin/bash
export PYTHONPATH=/Users/dipyaman/Documents/codes/puja_app/backend
export PATH=/Users/dipyaman/Documents/codes/puja_app/backend/venv/bin:$PATH
cd /Users/dipyaman/Documents/codes/puja_app/backend
exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
