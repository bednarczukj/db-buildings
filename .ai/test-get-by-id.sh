#!/bin/bash

# Test script for GET /api/v1/buildings/:id endpoint
# 
# Usage: ./test-get-by-id.sh [port]
# 
# Prerequisites:
# - Server running on http://localhost:PORT (default: 3000)
# - Database with sample buildings
# - Building IDs are UUIDs, not integers

# Default port
DEFAULT_PORT=3000
PORT=${1:-$DEFAULT_PORT}

# Check if server is running on the specified port
if ! curl -s "http://localhost:$PORT/api/v1/buildings" > /dev/null 2>&1; then
    echo "❌ Error: Server not responding on port $PORT"
    echo "💡 Try: ./test-get-by-id.sh 3000"
    echo "💡 Or check if Astro dev server is running: npm run dev"
    exit 1
fi

BASE_URL="http://localhost:$PORT/api/v1/buildings"

echo "========================================"
echo "Testing GET /api/v1/buildings/:id"
echo "========================================"
echo ""
echo "ℹ️  Note: Database has been seeded with test buildings"
echo "ℹ️  Available building IDs:"
echo "ℹ️  - 550e8400-e29b-41d4-a716-446655440001 (Warszawa, active)"
echo "ℹ️  - 550e8400-e29b-41d4-a716-446655440002 (Kraków, active)" 
echo "ℹ️  - 550e8400-e29b-41d4-a716-446655440003 (Gdańsk, deleted)"
echo ""

# Test 1: Valid UUID format (but non-existent)
echo "📝 Test 1: Get building with valid UUID format (non-existent)"
echo "Request: GET $BASE_URL/550e8400-e29b-41d4-a716-446655440000"
echo "Expected: 404 Not Found"
echo ""
curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/550e8400-e29b-41d4-a716-446655440000" | jq '.' 2>/dev/null || curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/550e8400-e29b-41d4-a716-446655440000"
echo "----------------------------------------"
echo ""

# Test 1.5: Get existing building (HTTP 200 test)
echo "📝 Test 1.5: Get existing building (Warszawa)"
echo "Request: GET $BASE_URL/550e8400-e29b-41d4-a716-446655440001"
echo "Expected: 200 OK with building data"
echo ""
curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/550e8400-e29b-41d4-a716-446655440001" | jq '.' 2>/dev/null || curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/550e8400-e29b-41d4-a716-446655440001"
echo "----------------------------------------"
echo ""

# Test 1.6: Get another existing building (HTTP 200 test)
echo "📝 Test 1.6: Get existing building (Kraków)"
echo "Request: GET $BASE_URL/550e8400-e29b-41d4-a716-446655440002"
echo "Expected: 200 OK with building data"
echo ""
curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/550e8400-e29b-41d4-a716-446655440002" | jq '.' 2>/dev/null || curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/550e8400-e29b-41d4-a716-446655440002"
echo "----------------------------------------"
echo ""

# Test 1.7: Get deleted building (HTTP 200 test)
echo "📝 Test 1.7: Get deleted building (Gdańsk)"
echo "Request: GET $BASE_URL/550e8400-e29b-41d4-a716-446655440003"
echo "Expected: 200 OK with building data (status: deleted)"
echo ""
curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/550e8400-e29b-41d4-a716-446655440003" | jq '.' 2>/dev/null || curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/550e8400-e29b-41d4-a716-446655440003"
echo "----------------------------------------"
echo ""

# Test 2: Another valid UUID format (but non-existent)
echo "📝 Test 2: Get building with another valid UUID format (non-existent)"
echo "Request: GET $BASE_URL/123e4567-e89b-12d3-a456-426614174000"
echo "Expected: 404 Not Found"
echo ""
curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/123e4567-e89b-12d3-a456-426614174000" | jq '.' 2>/dev/null || curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/123e4567-e89b-12d3-a456-426614174000"
echo "----------------------------------------"
echo ""

# Test 3: Invalid UUID format - too short
echo "📝 Test 3: Invalid UUID format - too short"
echo "Request: GET $BASE_URL/123"
echo "Expected: 400 Bad Request - 'id must be a valid UUID'"
echo ""
curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/123" | jq '.' 2>/dev/null || curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/123"
echo "----------------------------------------"
echo ""

# Test 4: Invalid UUID format - not a UUID
echo "📝 Test 4: Invalid UUID format - not a UUID (abc)"
echo "Request: GET $BASE_URL/abc"
echo "Expected: 400 Bad Request - 'id must be a valid UUID'"
echo ""
curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/abc" | jq '.' 2>/dev/null || curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/abc"
echo "----------------------------------------"
echo ""

# Test 5: Invalid UUID format - missing hyphens
echo "📝 Test 5: Invalid UUID format - missing hyphens"
echo "Request: GET $BASE_URL/550e8400e29b41d4a716446655440000"
echo "Expected: 400 Bad Request - 'id must be a valid UUID'"
echo ""
curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/550e8400e29b41d4a716446655440000" | jq '.' 2>/dev/null || curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/550e8400e29b41d4a716446655440000"
echo "----------------------------------------"
echo ""

# Test 6: Invalid UUID format - wrong length
echo "📝 Test 6: Invalid UUID format - wrong length"
echo "Request: GET $BASE_URL/550e8400-e29b-41d4-a716-44665544000"
echo "Expected: 400 Bad Request - 'id must be a valid UUID'"
echo ""
curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/550e8400-e29b-41d4-a716-44665544000" | jq '.' 2>/dev/null || curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/550e8400-e29b-41d4-a716-44665544000"
echo "----------------------------------------"
echo ""

# Test 7: Invalid UUID format - non-hex characters
echo "📝 Test 7: Invalid UUID format - non-hex characters"
echo "Request: GET $BASE_URL/550e8400-e29b-41d4-a716-44665544000g"
echo "Expected: 400 Bad Request - 'id must be a valid UUID'"
echo ""
curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/550e8400-e29b-41d4-a716-44665544000g" | jq '.' 2>/dev/null || curl -s -w "\nHTTP Status: %{http_code}\n\n" "$BASE_URL/550e8400-e29b-41d4-a716-44665544000g"
echo "----------------------------------------"
echo ""

echo "========================================"
echo "Tests completed!"
echo "========================================"

