nvm use
unzip -o app.zip -d ./
npm ci
pm2 restart rosendofun.service
