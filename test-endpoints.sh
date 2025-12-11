#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo -e "${YELLOW}=== Testing User Data API Endpoints ===${NC}\n"

# Wait for rate limit to reset (if needed)
wait_for_rate_limit() {
  echo -e "${BLUE}Waiting 65 seconds for rate limit window to reset...${NC}"
  sleep 65
}

# Test 1: Health Check
echo -e "${GREEN}1. Testing GET /health${NC}"
curl -s -X GET "$BASE_URL/health" | jq .
echo ""

# Test 2: Get User by ID (Cache Miss - First Request)
echo -e "${GREEN}2. Testing GET /users/1 (First Request - Cache Miss)${NC}"
echo "Response time should be ~200ms:"
time curl -s -X GET "$BASE_URL/users/1" | jq .
echo ""

# Test 3: Get User by ID (Cache Hit - Second Request)
echo -e "${GREEN}3. Testing GET /users/1 (Second Request - Cache Hit)${NC}"
echo "Response time should be much faster:"
time curl -s -X GET "$BASE_URL/users/1" | jq .
echo ""

# Test 4: Get Another User
echo -e "${GREEN}4. Testing GET /users/2${NC}"
curl -s -X GET "$BASE_URL/users/2" | jq .
echo ""

# Test 5: Get Non-existent User
echo -e "${GREEN}5. Testing GET /users/999 (Non-existent User)${NC}"
curl -s -X GET "$BASE_URL/users/999" | jq .
echo ""

# Wait before testing more endpoints to avoid rate limiting
wait_for_rate_limit

# Test 6: Invalid User ID
echo -e "${GREEN}6. Testing GET /users/invalid (Invalid ID)${NC}"
curl -s -X GET "$BASE_URL/users/invalid" | jq .
echo ""

# Test 7: Create User
echo -e "${GREEN}7. Testing POST /users (Create User)${NC}"
curl -s -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}' | jq .
echo ""

# Test 8: Create User with Invalid Email
echo -e "${GREEN}8. Testing POST /users (Invalid Email)${NC}"
curl -s -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"invalid-email"}' | jq .
echo ""

# Test 9: Create User with Missing Fields
echo -e "${GREEN}9. Testing POST /users (Missing Fields)${NC}"
curl -s -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User"}' | jq .
echo ""

# Test 10: Get Cache Status
echo -e "${GREEN}10. Testing GET /cache-status${NC}"
curl -s -X GET "$BASE_URL/cache-status" | jq .
echo ""

# Test 11: Clear Cache
echo -e "${GREEN}11. Testing DELETE /cache${NC}"
curl -s -X DELETE "$BASE_URL/cache" | jq .
echo ""

# Test 12: Verify Cache Cleared (Cache Miss Again)
echo -e "${GREEN}12. Testing GET /users/1 (After Cache Clear - Cache Miss)${NC}"
time curl -s -X GET "$BASE_URL/users/1" | jq .
echo ""

# Wait before rate limit test
wait_for_rate_limit

# Test 13: Rate Limiting Test
echo -e "${GREEN}13. Testing Rate Limiting (Sending 11 requests quickly)${NC}"
echo "Sending 11 requests:"
for i in {1..11}; do
  echo -n "Request $i: "
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/users/1")
  if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}OK (200)${NC}"
  elif [ "$STATUS" = "429" ]; then
    echo -e "${RED}Rate Limited (429)${NC}"
  else
    echo -e "${YELLOW}Status: $STATUS${NC}"
  fi
  sleep 0.2
done
echo ""

# Wait before final test
wait_for_rate_limit

# Test 14: Final Cache Status
echo -e "${GREEN}14. Final Cache Status${NC}"
curl -s -X GET "$BASE_URL/cache-status" | jq .
echo ""

echo -e "${YELLOW}=== All Tests Completed ===${NC}"
