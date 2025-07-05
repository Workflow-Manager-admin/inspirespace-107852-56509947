#!/bin/bash
cd /home/kavia/workspace/code-generation/inspirespace-107852-56509947/frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

