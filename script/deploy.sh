#!/bin/bash
nvm use
npm ci

# Define the name of the PM2 process
PM2_PROCESS_NAME="rosendofun.service"

# Check if the PM2 process exists
pm2 pid $PM2_PROCESS_NAME &>/dev/null

if [ $? -eq 0 ]; then
    # If the process exists, reload it
    echo "Reloading PM2 process: $PM2_PROCESS_NAME"
    pm2 reload $PM2_PROCESS_NAME --update-env
else
    # If the process doesn't exist, start it
    echo "Starting PM2 process: $PM2_PROCESS_NAME"
    npm run prod
fi
