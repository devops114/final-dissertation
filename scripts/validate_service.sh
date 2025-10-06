
#!/bin/bash
echo "=== Validate Service Hook Started ==="

# Give the application time to start
sleep 30

# Check if backend is running
if curl -f http://localhost:5000/api/health; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Check if frontend files are served
if curl -f http://localhost/ | grep -q "html"; then
    echo "✅ Frontend is being served"
else
    echo "❌ Frontend is not being served"
    exit 1
fi

echo "=== Validate Service Hook Completed ==="
