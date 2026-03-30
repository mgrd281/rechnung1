#!/bin/bash

# 1. Create a dummy "bad" PDF file (just text, invalid PDF structure)
echo "This is not a valid PDF content" > bad_test.pdf

# 2. Start the dev server in the background on port 3005
echo "Starting server on port 3005..."
# We use a specific port to avoid conflicts
./node_modules/.bin/next dev -p 3005 > server_test.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# 3. Wait for server to start (give it 15 seconds)
echo "Waiting 15s for server to initialize..."
sleep 15

# 4. Send the request using curl
# We mock the x-user-info header to pass authentication
echo "Sending request with bad PDF..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  -H 'x-user-info: {"id":"test","email":"test@test.com","firstName":"Test","lastName":"User"}' \
  -F "file=@bad_test.pdf;type=application/pdf" \
  http://localhost:3005/api/ocr/analyze)

# 5. Extract status and body
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS")

echo "--------------------------------"
echo "Response Status: $HTTP_STATUS"
echo "Response Body: $BODY"
echo "--------------------------------"

# 6. Cleanup
kill $SERVER_PID
rm bad_test.pdf
# rm server_test.log # Keep log for debugging if needed

# 7. Check if test passed
if [ "$HTTP_STATUS" == "200" ]; then
  echo "✅ TEST PASSED: Server returned 200 OK despite invalid PDF."
else
  echo "❌ TEST FAILED: Server returned $HTTP_STATUS"
  echo "Server Log Tail:"
  tail -n 20 server_test.log
fi
