#!/bin/bash

# Get auth token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nxforge.local","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get auth token"
  exit 1
fi

echo "Got auth token"

# Register the module
echo "Registering consumption-monitor module..."
curl -X POST http://localhost:4000/api/v1/modules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @modules/consumption-monitor/manifest.json

echo ""
echo "Done!"
