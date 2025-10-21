# API Testing with cURL
# Make sure your server is running on http://localhost:3000

# ===========================================
# ITEMS API ENDPOINTS
# ===========================================

# 1. GET all items
echo "=== GET All Items ==="
curl -X GET http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# 2. CREATE a new item
echo "=== CREATE New Item ==="
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Item 1"}' \
  -w "\nStatus: %{http_code}\n\n"

# 3. CREATE another item
echo "=== CREATE Another Item ==="
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Item 2"}' \
  -w "\nStatus: %{http_code}\n\n"

# 4. GET all items (should show the created items)
echo "=== GET All Items (After Creation) ==="
curl -X GET http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# 5. GET item by ID (replace {id} with actual item ID from previous responses)
echo "=== GET Item by ID ==="
curl -X GET http://localhost:3000/api/items/1 \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# 6. UPDATE an item (replace {id} with actual item ID)
echo "=== UPDATE Item ==="
curl -X PUT http://localhost:3000/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Test Item 1"}' \
  -w "\nStatus: %{http_code}\n\n"

# 7. GET item by ID (to verify update)
echo "=== GET Updated Item ==="
curl -X GET http://localhost:3000/api/items/1 \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# 8. DELETE an item
echo "=== DELETE Item ==="
curl -X DELETE http://localhost:3000/api/items/1 \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# 9. GET all items (to verify deletion)
echo "=== GET All Items (After Deletion) ==="
curl -X GET http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# 10. TEST Error cases
echo "=== TEST: Get Non-existent Item (Should return 404) ==="
curl -X GET http://localhost:3000/api/items/999 \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "=== TEST: Update Non-existent Item (Should return 404) ==="
curl -X PUT http://localhost:3000/api/items/999 \
  -H "Content-Type: application/json" \
  -d '{"name": "Non-existent Item"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "=== TEST: Delete Non-existent Item (Should return 404) ==="
curl -X DELETE http://localhost:3000/api/items/999 \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# 11. TEST Invalid JSON (Should return error)
echo "=== TEST: Invalid JSON (Should return error) ==="
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Missing quote}' \
  -w "\nStatus: %{http_code}\n\n"

echo "=== All tests completed! ==="