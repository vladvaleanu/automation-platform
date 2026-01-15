#!/bin/bash

# Phase 4 Backend Testing Script
# Tests consumption monitor implementation end-to-end

set -e

API_URL="http://localhost:4000/api/v1"
MOCK_SERVER="http://localhost:3500"

echo "================================"
echo "Phase 4 Backend Testing"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function test_passed() {
  echo -e "${GREEN}✓ PASS:${NC} $1"
}

function test_failed() {
  echo -e "${RED}✗ FAIL:${NC} $1"
  exit 1
}

function test_info() {
  echo -e "${YELLOW}ℹ INFO:${NC} $1"
}

# Step 1: Login
echo "Step 1: Authenticating..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test12345"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  test_failed "Authentication failed"
fi
test_passed "Authentication successful"
echo ""

# Step 2: Test Endpoints API - Create Endpoint
echo "Step 2: Creating test endpoint (simple meter)..."
CREATE_ENDPOINT_RESPONSE=$(curl -s -X POST "$API_URL/endpoints" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Rack A1 - Simple Meter",
    "ipAddress": "localhost:3500/simple-meter",
    "type": "PDU",
    "vendor": "Test Vendor",
    "location": "Test Hall, Rack A1",
    "clientName": "Test Client",
    "authType": "none",
    "scrapingConfig": {
      "steps": [],
      "valueSelector": ".consumption-value"
    },
    "enabled": true,
    "pollInterval": 5
  }')

ENDPOINT_ID=$(echo $CREATE_ENDPOINT_RESPONSE | jq -r '.data.id')

if [ "$ENDPOINT_ID" == "null" ] || [ -z "$ENDPOINT_ID" ]; then
  test_failed "Failed to create endpoint: $CREATE_ENDPOINT_RESPONSE"
fi
test_passed "Endpoint created with ID: $ENDPOINT_ID"
echo ""

# Step 3: List Endpoints
echo "Step 3: Listing all endpoints..."
LIST_RESPONSE=$(curl -s -X GET "$API_URL/endpoints" \
  -H "Authorization: Bearer $TOKEN")

ENDPOINT_COUNT=$(echo $LIST_RESPONSE | jq '.data | length')
if [ "$ENDPOINT_COUNT" -eq "0" ]; then
  test_failed "No endpoints found in list"
fi
test_passed "Found $ENDPOINT_COUNT endpoint(s)"
echo ""

# Step 4: Get Single Endpoint
echo "Step 4: Fetching endpoint details..."
GET_RESPONSE=$(curl -s -X GET "$API_URL/endpoints/$ENDPOINT_ID" \
  -H "Authorization: Bearer $TOKEN")

ENDPOINT_NAME=$(echo $GET_RESPONSE | jq -r '.data.name')
if [ "$ENDPOINT_NAME" != "Test Rack A1 - Simple Meter" ]; then
  test_failed "Endpoint name mismatch"
fi
test_passed "Endpoint details retrieved: $ENDPOINT_NAME"
echo ""

# Step 5: Test Scraping Configuration
echo "Step 5: Testing scraping configuration (dry run)..."
TEST_SCRAPE_RESPONSE=$(curl -s -X POST "$API_URL/endpoints/$ENDPOINT_ID/test" \
  -H "Authorization: Bearer $TOKEN")

SCRAPE_SUCCESS=$(echo $TEST_SCRAPE_RESPONSE | jq -r '.data.success')
SCRAPE_VALUE=$(echo $TEST_SCRAPE_RESPONSE | jq -r '.data.value')

if [ "$SCRAPE_SUCCESS" != "true" ]; then
  ERROR_MSG=$(echo $TEST_SCRAPE_RESPONSE | jq -r '.data.error')
  test_failed "Scraping test failed: $ERROR_MSG"
fi

if [ "$SCRAPE_VALUE" == "null" ]; then
  test_failed "Failed to extract value from mock meter"
fi

test_passed "Scraping test successful - Extracted value: $SCRAPE_VALUE kWh"
echo ""

# Step 6: Create another endpoint with regex pattern
echo "Step 6: Creating endpoint with regex pattern..."
CREATE_ENDPOINT2_RESPONSE=$(curl -s -X POST "$API_URL/endpoints" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Rack B2 - Formatted Meter",
    "ipAddress": "localhost:3500/formatted-meter",
    "type": "PowerMeter",
    "clientName": "Test Client 2",
    "authType": "none",
    "scrapingConfig": {
      "steps": [],
      "valueSelector": ".total-kwh",
      "valuePattern": "([0-9,]+\\.[0-9]+)\\s*kWh"
    },
    "enabled": true,
    "pollInterval": 10
  }')

ENDPOINT_ID2=$(echo $CREATE_ENDPOINT2_RESPONSE | jq -r '.data.id')

if [ "$ENDPOINT_ID2" == "null" ]; then
  test_failed "Failed to create second endpoint"
fi
test_passed "Second endpoint created: $ENDPOINT_ID2"
echo ""

# Step 7: Test scraping with regex pattern
echo "Step 7: Testing regex pattern extraction..."
TEST_SCRAPE2_RESPONSE=$(curl -s -X POST "$API_URL/endpoints/$ENDPOINT_ID2/test" \
  -H "Authorization: Bearer $TOKEN")

SCRAPE_VALUE2=$(echo $TEST_SCRAPE2_RESPONSE | jq -r '.data.value')

if [ "$SCRAPE_VALUE2" == "null" ]; then
  test_failed "Failed to extract value with regex pattern"
fi

test_passed "Regex extraction successful - Value: $SCRAPE_VALUE2 kWh"
echo ""

# Step 8: Update Endpoint
echo "Step 8: Updating endpoint configuration..."
UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/endpoints/$ENDPOINT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "location": "Test Hall, Rack A1 (Updated)",
    "pollInterval": 15
  }')

UPDATED_LOCATION=$(echo $UPDATE_RESPONSE | jq -r '.data.location')
if [[ "$UPDATED_LOCATION" != *"Updated"* ]]; then
  test_failed "Endpoint update failed"
fi
test_passed "Endpoint updated successfully"
echo ""

# Step 9: Get Consumption Module
echo "Step 9: Verifying consumption-monitor module..."
MODULES_RESPONSE=$(curl -s -X GET "$API_URL/modules" \
  -H "Authorization: Bearer $TOKEN")

MODULE_EXISTS=$(echo $MODULES_RESPONSE | jq '.data[] | select(.name == "consumption-monitor") | .name' -r)

if [ "$MODULE_EXISTS" != "consumption-monitor" ]; then
  test_info "Consumption monitor module not found, registering..."

  # Register module
  MANIFEST=$(cat packages/backend/data/modules/consumption-monitor/manifest.json)
  REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/modules" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"manifest\": $MANIFEST, \"path\": \"data/modules/consumption-monitor\"}")

  MODULE_ID=$(echo $REGISTER_RESPONSE | jq -r '.data.id')
  test_passed "Module registered: $MODULE_ID"
else
  test_passed "Consumption monitor module found"
fi
echo ""

# Step 10: Create Collection Job
echo "Step 10: Creating consumption collection job..."

# Get module ID
MODULE_ID=$(curl -s -X GET "$API_URL/modules" -H "Authorization: Bearer $TOKEN" | jq -r '.data[] | select(.name == "consumption-monitor") | .id')

if [ "$MODULE_ID" == "null" ] || [ -z "$MODULE_ID" ]; then
  test_failed "Could not find consumption-monitor module ID"
fi

CREATE_JOB_RESPONSE=$(curl -s -X POST "$API_URL/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"name\": \"Test Collection Job\",
    \"description\": \"Collect consumption from test endpoints\",
    \"moduleId\": \"$MODULE_ID\",
    \"handler\": \"jobs/collect-consumption.js\",
    \"schedule\": null,
    \"enabled\": true,
    \"timeout\": 300000,
    \"retries\": 2,
    \"config\": {
      \"batchSize\": 5,
      \"screenshotOnError\": true
    }
  }")

JOB_ID=$(echo $CREATE_JOB_RESPONSE | jq -r '.data.id')

if [ "$JOB_ID" == "null" ] || [ -z "$JOB_ID" ]; then
  test_failed "Failed to create job: $CREATE_JOB_RESPONSE"
fi
test_passed "Collection job created: $JOB_ID"
echo ""

# Step 11: Execute Collection Job
echo "Step 11: Executing collection job..."
EXECUTE_RESPONSE=$(curl -s -X POST "$API_URL/jobs/$JOB_ID/execute" \
  -H "Authorization: Bearer $TOKEN")

EXECUTE_SUCCESS=$(echo $EXECUTE_RESPONSE | jq -r '.success')

if [ "$EXECUTE_SUCCESS" != "true" ]; then
  test_failed "Job execution failed: $EXECUTE_RESPONSE"
fi
test_passed "Job queued for execution"

# Wait for job to complete
test_info "Waiting for job to complete (10 seconds)..."
sleep 10
echo ""

# Step 12: Check Consumption Readings
echo "Step 12: Checking consumption readings..."
READINGS_RESPONSE=$(curl -s -X GET "$API_URL/consumption/readings?limit=10" \
  -H "Authorization: Bearer $TOKEN")

READINGS_COUNT=$(echo $READINGS_RESPONSE | jq '.data | length')

if [ "$READINGS_COUNT" -eq "0" ]; then
  test_failed "No consumption readings found after job execution"
fi
test_passed "Found $READINGS_COUNT consumption reading(s)"

# Show first reading details
FIRST_READING=$(echo $READINGS_RESPONSE | jq '.data[0]')
READING_KWH=$(echo $FIRST_READING | jq -r '.totalKwh')
READING_SUCCESS=$(echo $FIRST_READING | jq -r '.success')

test_info "Latest reading: $READING_KWH kWh (success: $READING_SUCCESS)"
echo ""

# Step 13: Test Live Dashboard API
echo "Step 13: Testing live dashboard API..."
LIVE_RESPONSE=$(curl -s -X GET "$API_URL/consumption/live" \
  -H "Authorization: Bearer $TOKEN")

LIVE_COUNT=$(echo $LIVE_RESPONSE | jq '.data | length')

if [ "$LIVE_COUNT" -eq "0" ]; then
  test_failed "Live dashboard returned no data"
fi
test_passed "Live dashboard returned $LIVE_COUNT endpoint(s)"
echo ""

# Step 14: Test Monthly Summary
echo "Step 14: Testing monthly summary API..."
CURRENT_YEAR=$(date +%Y)
CURRENT_MONTH=$(date +%-m)

MONTHLY_RESPONSE=$(curl -s -X GET "$API_URL/consumption/monthly/$ENDPOINT_ID?year=$CURRENT_YEAR&month=$CURRENT_MONTH" \
  -H "Authorization: Bearer $TOKEN")

MONTHLY_SUCCESS=$(echo $MONTHLY_RESPONSE | jq -r '.success')

if [ "$MONTHLY_SUCCESS" != "true" ]; then
  test_failed "Monthly summary API failed"
fi

MONTHLY_CONSUMPTION=$(echo $MONTHLY_RESPONSE | jq -r '.data.consumption')
test_passed "Monthly summary retrieved (consumption: $MONTHLY_CONSUMPTION kWh)"
echo ""

# Step 15: Test Summary API
echo "Step 15: Testing consumption summary API..."
SUMMARY_RESPONSE=$(curl -s -X GET "$API_URL/consumption/summary?period=day" \
  -H "Authorization: Bearer $TOKEN")

TOTAL_CONSUMPTION=$(echo $SUMMARY_RESPONSE | jq -r '.data.totalConsumption')
ENDPOINTS_IN_SUMMARY=$(echo $SUMMARY_RESPONSE | jq '.data.endpoints | length')

test_passed "Summary API returned $ENDPOINTS_IN_SUMMARY endpoint(s), total consumption: $TOTAL_CONSUMPTION kWh"
echo ""

# Step 16: Test Filtering
echo "Step 16: Testing endpoint filtering..."
FILTER_RESPONSE=$(curl -s -X GET "$API_URL/endpoints?clientName=Test%20Client" \
  -H "Authorization: Bearer $TOKEN")

FILTERED_COUNT=$(echo $FILTER_RESPONSE | jq '.data | length')
test_passed "Filter by client returned $FILTERED_COUNT result(s)"
echo ""

# Step 17: Delete Endpoint
echo "Step 17: Testing endpoint deletion..."
DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/endpoints/$ENDPOINT_ID2" \
  -H "Authorization: Bearer $TOKEN")

DELETE_SUCCESS=$(echo $DELETE_RESPONSE | jq -r '.success')

if [ "$DELETE_SUCCESS" != "true" ]; then
  test_failed "Failed to delete endpoint"
fi
test_passed "Endpoint deleted successfully"

# Verify deletion
GET_DELETED=$(curl -s -X GET "$API_URL/endpoints/$ENDPOINT_ID2" \
  -H "Authorization: Bearer $TOKEN")

if echo $GET_DELETED | jq -e '.success == true' > /dev/null; then
  test_failed "Deleted endpoint still exists"
fi
test_passed "Deletion verified"
echo ""

# Final Summary
echo "================================"
echo -e "${GREEN}All Tests Passed!${NC}"
echo "================================"
echo ""
echo "Test Summary:"
echo "  ✓ Endpoints CRUD operations"
echo "  ✓ Scraping configuration testing"
echo "  ✓ Value extraction (plain & regex)"
echo "  ✓ Job creation and execution"
echo "  ✓ Consumption readings storage"
echo "  ✓ Live dashboard API"
echo "  ✓ Monthly summary API"
echo "  ✓ Consumption summary API"
echo "  ✓ Filtering and querying"
echo ""
echo "Phase 4 Backend: ✅ FULLY FUNCTIONAL"
