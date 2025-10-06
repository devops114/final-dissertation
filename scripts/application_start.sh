
#!/bin/bash
echo "=== Application Start Hook Started ==="

# Stop any existing processes
echo "Stopping any existing processes..."
pkill -f node || true
sleep 5

# Start the backend
cd /home/ec2-user/backend
echo "Starting backend application..."
export NODE_ENV=production

# Install PM2 if not present (with error handling)
npm list -g pm2 || npm install -g pm2

# Try different possible entry points with error handling
if [ -f "src/app.js" ]; then
    echo "Starting src/app.js..."
    pm2 stop all 2>/dev/null || true
    pm2 start src/app.js --name "backend" || node src/app.js &
elif [ -f "app.js" ]; then
    echo "Starting app.js..."
    pm2 stop all 2>/dev/null || true
    pm2 start app.js --name "backend" || node app.js &
elif [ -f "server.js" ]; then
    echo "Starting server.js..."
    pm2 stop all 2>/dev/null || true
    pm2 start server.js --name "backend" || node server.js &
elif [ -f "index.js" ]; then
    echo "Starting index.js..."
    pm2 stop all 2>/dev/null || true
    pm2 start index.js --name "backend" || node index.js &
else
    echo "⚠️ No entry point found. Listing backend files:"
    ls -la
    # Start npm start if package.json exists
    if [ -f "package.json" ]; then
        echo "Starting via npm start..."
        npm start &
    fi
fi

# Save PM2 process list
pm2 save 2>/dev/null || true

# Restart nginx
echo "Restarting nginx..."
sudo systemctl restart nginx || echo "Nginx restart failed but continuing"

echo "=== Application Start Hook Completed ==="
