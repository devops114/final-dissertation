
#!/bin/bash
echo "=== After Install Hook Started ==="

# Set proper permissions
chown -R ec2-user:ec2-user /home/ec2-user/backend
chown -R nginx:nginx /var/www/frontend

# Install backend dependencies
cd /home/ec2-user/backend
echo "Installing backend dependencies..."
npm install --production

# Set permissions for frontend
chmod -R 755 /var/www/frontend

echo "=== After Install Hook Completed ==="
