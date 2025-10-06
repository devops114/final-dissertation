
#!/bin/bash
echo "=== Application Start Hook Started ==="

# Stop any existing backend process
echo "Stopping any existing backend processes..."
pm2 delete all 2>/dev/null || true
sleep 5

# Start the backend with PM2
cd /home/ec2-user/backend
echo "Starting backend application..."
export NODE_ENV=production
pm2 start src/app.js --name "ecommerce-backend"
pm2 save

# Restart nginx
echo "Restarting nginx..."
sudo systemctl restart nginx

echo "=== Application Start Hook Completed ==="
