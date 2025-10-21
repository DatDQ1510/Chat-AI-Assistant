@echo off
echo ========================================
echo  Testing Settings API
echo ========================================
echo.

set /p TOKEN="Paste your JWT token: "
echo.

echo Testing GET /api/user/settings...
echo.
curl -X GET http://localhost:5000/api/user/settings ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json"

echo.
echo.
echo ========================================
echo.
echo Testing PATCH /api/user/settings...
echo.
curl -X PATCH http://localhost:5000/api/user/settings ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"language\":\"vi\",\"writing_style\":\"friendly\"}"

echo.
echo.
echo ========================================
echo Test completed!
echo.
pause
