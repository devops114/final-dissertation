
#!/bin/bash
echo "=== Starting AWS Deployment ==="

# Get EC2 instance details
INSTANCE_IP=$(aws ec2 describe-instances \
  --filters "Name=tag:Project,Values=dissertation" \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --output text)

if [ "$INSTANCE_IP" = "None" ]; then
    echo "ERROR: Could not find EC2 instance"
    exit 1
fi

echo "Target EC2 Instance: $INSTANCE_IP"
echo "Deployment package contents:"
ls -la

# Copy files to EC2
echo "Copying application files to EC2..."
scp -o StrictHostKeyChecking=no -r ./* ec2-user@$INSTANCE_IP:/home/ec2-user/deployment/

# Run deployment script on EC2
echo "Running deployment on EC2..."
ssh -o StrictHostKeyChecking=no ec2-user@$INSTANCE_IP 'bash -s' << 'EOF'
cd /home/ec2-user/deployment

# Stop existing backend
pm2 delete all 2>/dev/null || true

# Deploy backend
echo "Deploying backend..."
cp -r backend /home/ec2-user/
cd /home/ec2-user/backend
npm install --production

# Deploy frontend
echo "Deploying frontend..."
sudo cp -r frontend-build/* /var/www/frontend/

# Start backend with PM2
echo "Starting backend..."
pm2 start src/app.js --name "ecommerce-backend"
pm2 save
pm2 startup

# Reload nginx
sudo systemctl reload nginx

echo "Deployment completed successfully!"
EOF

echo "=== AWS Deployment Completed ==="
echo "Application URL: http://$INSTANCE_IP"
echo "Backend API: http://$INSTANCE_IP/api"
echo "Health Check: http://$INSTANCE_IP/health"
