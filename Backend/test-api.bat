@echo off
echo API Testing with cURL
echo Make sure your server is running on http://localhost:3000
echo.

REM ===========================================
REM ITEMS API ENDPOINTS
REM ===========================================

echo === GET All Items ===
curl -X GET http://localhost:3000/api/items -H "Content-Type: application/json"
echo.
echo.

echo === CREATE New Item ===
curl -X POST http://localhost:3000/api/items -H "Content-Type: application/json" -d "{\"name\": \"Test Item 1\"}"
echo.
echo.

echo === CREATE Another Item ===
curl -X POST http://localhost:3000/api/items -H "Content-Type: application/json" -d "{\"name\": \"Test Item 2\"}"
echo.
echo.

echo === GET All Items (After Creation) ===
curl -X GET http://localhost:3000/api/items -H "Content-Type: application/json"
echo.
echo.

echo === GET Item by ID ===
curl -X GET http://localhost:3000/api/items/1 -H "Content-Type: application/json"
echo.
echo.

echo === UPDATE Item ===
curl -X PUT http://localhost:3000/api/items/1 -H "Content-Type: application/json" -d "{\"name\": \"Updated Test Item 1\"}"
echo.
echo.

echo === GET Updated Item ===
curl -X GET http://localhost:3000/api/items/1 -H "Content-Type: application/json"
echo.
echo.

echo === DELETE Item ===
curl -X DELETE http://localhost:3000/api/items/1 -H "Content-Type: application/json"
echo.
echo.

echo === GET All Items (After Deletion) ===
curl -X GET http://localhost:3000/api/items -H "Content-Type: application/json"
echo.
echo.

echo === TEST: Get Non-existent Item (Should return 404) ===
curl -X GET http://localhost:3000/api/items/999 -H "Content-Type: application/json"
echo.
echo.

echo === TEST: Update Non-existent Item (Should return 404) ===
curl -X PUT http://localhost:3000/api/items/999 -H "Content-Type: application/json" -d "{\"name\": \"Non-existent Item\"}"
echo.
echo.

echo === TEST: Delete Non-existent Item (Should return 404) ===
curl -X DELETE http://localhost:3000/api/items/999 -H "Content-Type: application/json"
echo.
echo.

echo === All tests completed! ===
pause