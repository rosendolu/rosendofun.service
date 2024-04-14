#!/bin/bash

NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"                   # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # This loads nvm bash_completion

# Check if nvm command is available
if command -v nvm &>/dev/null; then
    # If nvm command is available, execute nvm use
    nvm use
else
    # If nvm command is not available, print a message
    echo "nvm is not installed or not available in the current shell environment."
fi

npm ci

# Define the name of the PM2 process
PM2_PROCESS_NAME="rosendofun.service"

# Check if the PM2 process exists
reloadCode=pm2 list | grep -q "\<$PM2_PROCESS_NAME\>"

if [ $reloadCode -eq 0 ]; then
    # If the process exists, reload it
    echo "Reloading PM2 process: $PM2_PROCESS_NAME"
    pm2 reload $PM2_PROCESS_NAME --update-env
else
    # If the process doesn't exist, start it
    echo "Starting PM2 process: $PM2_PROCESS_NAME"
    npm run prod
fi
