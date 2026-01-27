#!/bin/sh
set -e

# Replace environment variables in JavaScript files
if [ -n "$REACT_APP_API_URL" ]; then
    echo "Setting API URL to: $REACT_APP_API_URL"
    find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|http://localhost:8000|$REACT_APP_API_URL|g" {} \;
    find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|http://127.0.0.1:8000|$REACT_APP_API_URL|g" {} \;
fi

echo "Starting Nginx..."
exec "$@"
