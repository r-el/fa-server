#!/bin/bash

# Events API Test Script
# This script tests the Events API endpoints

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:12113"
TOKEN=""

echo -e "${BLUE}🚀 Events API Test Script${NC}"
echo "=================================="

# Check if server is running
echo -e "\n${YELLOW}📡 Checking server status...${NC}"
if curl -s --max-time 5 "$BASE_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running. Please start the server first.${NC}"
    exit 1
fi

# Check if token is provided
if [ -z "$TOKEN" ]; then
    echo -e "\n${YELLOW}🔑 Please set your JWT token in the script or provide it as argument${NC}"
    echo "Usage: $0 [JWT_TOKEN]"
    
    if [ ! -z "$1" ]; then
        TOKEN="$1"
        echo -e "${GREEN}✅ Token provided as argument${NC}"
    else
        echo -e "${RED}❌ No token provided${NC}"
        exit 1
    fi
fi

# Headers
HEADERS="Authorization: Bearer $TOKEN"

echo -e "\n${BLUE}🧪 Testing Events API Endpoints${NC}"
echo "=================================="

# Test 1: Get Events (basic)
echo -e "\n${YELLOW}Test 1: GET /events${NC}"
response=$(curl -s -H "$HEADERS" "$BASE_URL/events")
if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ GET /events - SUCCESS${NC}"
    echo "$response" | jq '.pagination // "No pagination info"' 2>/dev/null || echo "Response: $response"
else
    echo -e "${RED}❌ GET /events - FAILED${NC}"
    echo "Response: $response"
fi

# Test 2: Get Events with pagination
echo -e "\n${YELLOW}Test 2: GET /events?page=1&limit=5${NC}"
response=$(curl -s -H "$HEADERS" "$BASE_URL/events?page=1&limit=5")
if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ GET /events with pagination - SUCCESS${NC}"
    echo "$response" | jq '.pagination // "No pagination info"' 2>/dev/null || echo "Response: $response"
else
    echo -e "${RED}❌ GET /events with pagination - FAILED${NC}"
    echo "Response: $response"
fi

# Test 3: Get Events Statistics
echo -e "\n${YELLOW}Test 3: GET /events/stats${NC}"
response=$(curl -s -H "$HEADERS" "$BASE_URL/events/stats")
if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ GET /events/stats - SUCCESS${NC}"
    echo "$response" | jq '.data // "No data"' 2>/dev/null || echo "Response: $response"
else
    echo -e "${RED}❌ GET /events/stats - FAILED${NC}"
    echo "Response: $response"
fi

# Test 4: Get Events Count
echo -e "\n${YELLOW}Test 4: GET /events/count${NC}"
response=$(curl -s -H "$HEADERS" "$BASE_URL/events/count")
if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ GET /events/count - SUCCESS${NC}"
    echo "$response" | jq '.data.count // "No count"' 2>/dev/null || echo "Response: $response"
else
    echo -e "${RED}❌ GET /events/count - FAILED${NC}"
    echo "Response: $response"
fi

# Test 5: Get Events with level filter
echo -e "\n${YELLOW}Test 5: GET /events?level=high${NC}"
response=$(curl -s -H "$HEADERS" "$BASE_URL/events?level=high")
if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ GET /events with level filter - SUCCESS${NC}"
    count=$(echo "$response" | jq '.data | length' 2>/dev/null || echo "0")
    echo "High level events found: $count"
else
    echo -e "${RED}❌ GET /events with level filter - FAILED${NC}"
    echo "Response: $response"
fi

# Test 6: Get specific event (if we have events)
echo -e "\n${YELLOW}Test 6: GET /events/:id${NC}"
first_event_id=$(curl -s -H "$HEADERS" "$BASE_URL/events?limit=1" | jq -r '.data[0]._id // empty' 2>/dev/null)

if [ ! -z "$first_event_id" ] && [ "$first_event_id" != "null" ]; then
    response=$(curl -s -H "$HEADERS" "$BASE_URL/events/$first_event_id")
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ GET /events/:id - SUCCESS${NC}"
        echo "Event ID: $first_event_id"
    else
        echo -e "${RED}❌ GET /events/:id - FAILED${NC}"
        echo "Response: $response"
    fi
else
    echo -e "${YELLOW}⚠️  No events found to test specific event endpoint${NC}"
fi

# Test 7: Test invalid endpoint
echo -e "\n${YELLOW}Test 7: GET /events/invalid-id (should fail)${NC}"
response=$(curl -s -H "$HEADERS" "$BASE_URL/events/invalid-id")
if echo "$response" | grep -q '"success":false'; then
    echo -e "${GREEN}✅ Invalid ID rejection - SUCCESS${NC}"
else
    echo -e "${YELLOW}⚠️  Invalid ID test - Unexpected response${NC}"
    echo "Response: $response"
fi

# Test 8: Test without authentication
echo -e "\n${YELLOW}Test 8: GET /events (without auth - should fail)${NC}"
response=$(curl -s "$BASE_URL/events")
if echo "$response" | grep -q -E '"error"|"message"'; then
    echo -e "${GREEN}✅ Authentication check - SUCCESS${NC}"
else
    echo -e "${RED}❌ Authentication check - FAILED${NC}"
    echo "Response: $response"
fi

echo -e "\n${BLUE}📊 Test Summary${NC}"
echo "=================================="
echo -e "✅ ${GREEN}Successful tests completed${NC}"
echo -e "❌ ${RED}Failed tests need attention${NC}"
echo -e "⚠️  ${YELLOW}Warnings or skipped tests${NC}"

echo -e "\n${BLUE}🎉 Events API testing completed!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Check server logs for any errors"
echo "2. Test image endpoints if you have event data with images"
echo "3. Test with different user roles and permissions"
echo "4. Run the create-sample-events script if you need test data"
