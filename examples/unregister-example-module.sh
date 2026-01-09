#!/bin/bash
# Unregister the example data-sync-module

API_URL="${API_URL:-http://localhost:4000/api/v1}"

echo "Unregistering data-sync-module example..."

# First, login to get token
echo "Login with your credentials..."
read -p "Email: " EMAIL
read -sp "Password: " PASSWORD
echo ""

# Get access token
TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Login failed. Please check credentials."
  exit 1
fi

echo "✅ Login successful"
echo ""

# Get module details
echo "Fetching module details..."
MODULE_RESPONSE=$(curl -s -X GET "$API_URL/modules" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

# Extract module ID and status
MODULE_ID=$(echo $MODULE_RESPONSE | grep -o '"id":"[^"]*"[^}]*"name":"data-sync-module"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
MODULE_STATUS=$(echo $MODULE_RESPONSE | grep -o '"name":"data-sync-module"[^}]*"status":"[^"]*"' | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ -z "$MODULE_ID" ]; then
  echo "❌ Module not found"
  exit 1
fi

echo "Found module: ID=$MODULE_ID, Status=$MODULE_STATUS"
echo ""

# Handle different statuses
if [ "$MODULE_STATUS" = "ENABLED" ]; then
  echo "Disabling module..."
  DISABLE_RESPONSE=$(curl -s -X POST "$API_URL/modules/data-sync-module/disable" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  DISABLE_SUCCESS=$(echo $DISABLE_RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)

  if [ "$DISABLE_SUCCESS" = "true" ]; then
    echo "✅ Module disabled"
  else
    echo "⚠️  Disable failed: $DISABLE_RESPONSE"
  fi
  echo ""
fi

if [ "$MODULE_STATUS" = "ENABLED" ] || [ "$MODULE_STATUS" = "INSTALLED" ]; then
  echo "Uninstalling module..."
  UNINSTALL_RESPONSE=$(curl -s -X POST "$API_URL/modules/data-sync-module/uninstall" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  UNINSTALL_SUCCESS=$(echo $UNINSTALL_RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)

  if [ "$UNINSTALL_SUCCESS" = "true" ]; then
    echo "✅ Module uninstalled"
  else
    echo "⚠️  Uninstall failed: $UNINSTALL_RESPONSE"
  fi
  echo ""
fi

# Now delete the module (works for any status)
echo "Deleting module registration..."
DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/modules/data-sync-module" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Delete Response:"
echo "$DELETE_RESPONSE"
echo ""

DELETE_SUCCESS=$(echo $DELETE_RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$DELETE_SUCCESS" = "true" ]; then
  echo "✅ Module unregistered successfully!"
  echo ""
  echo "You can now run: bash examples/register-example-module.sh"
else
  echo "❌ Unregistration failed"
  echo "Error details in response above"
  exit 1
fi
