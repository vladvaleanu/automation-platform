#!/bin/bash

# Register consumption-monitor module

API_URL="http://localhost:4000/api/v1"

# Login to get token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Failed to login. Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "Logged in successfully"

# Register module
echo "Registering consumption-monitor module..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/modules" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "consumption-monitor",
    "path": "data/modules/consumption-monitor"
  }')

echo "Register response: $REGISTER_RESPONSE"

MODULE_ID=$(echo $REGISTER_RESPONSE | jq -r '.data.id')

if [ "$MODULE_ID" == "null" ] || [ -z "$MODULE_ID" ]; then
  echo "Failed to register module"
  exit 1
fi

echo "Module registered successfully with ID: $MODULE_ID"

# Enable module
echo "Enabling module..."
ENABLE_RESPONSE=$(curl -s -X PUT "$API_URL/modules/$MODULE_ID/enable" \
  -H "Authorization: Bearer $TOKEN")

echo "Enable response: $ENABLE_RESPONSE"

echo "Done!"
