
#!/bin/bash
echo "=== After Install Hook Started ==="

# Set proper permissions
chown -R ec2-user:ec2-user /home/ec2-user/backend || echo "Failed to set backend permissions"
chown -R nginx:nginx /var/www/frontend || echo "Failed to set frontend permissions"

# Install backend dependencies
cd /home/ec2-user/backend
echo "Installing backend dependencies..."
npm install --production || echo "npm install failed but continuing"

# Set permissions for frontend
chmod -R 755 /var/www/frontend || echo "Failed to set frontend permissions"

echo "=== After Install Hook Completed ==="
