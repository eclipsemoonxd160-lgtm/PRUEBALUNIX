@echo off
cd /d "%~dp0"
setlocal EnableExtensions

echo.
echo =============================================
echo   LITERARY UNIVERSE - BUSCADOR INTELIGENTE
echo =============================================
echo.

if not exist ".env" (
  echo No existe .env. Vamos a configurarlo una sola vez.
  echo.
  copy /Y ".env.example" ".env" >nul
  echo.
  set /p BRAVE_API_KEY="Pega tu clave de Brave Search API: "
  powershell -NoProfile -Command "(Get-Content '.env') -replace '^BRAVE_API_KEY=.*','BRAVE_API_KEY=' + $env:BRAVE_API_KEY | Set-Content '.env'"
  set /p YOUTUBE_API_KEY="Pega tu clave de YouTube Data API v3: "
  powershell -NoProfile -Command "(Get-Content '.env') -replace '^YOUTUBE_API_KEY=.*','YOUTUBE_API_KEY=' + $env:YOUTUBE_API_KEY | Set-Content '.env'"
  echo.
  echo Configuracion guardada.
  echo Google es opcional y no hace falta para empezar.
  echo.
)

echo Iniciando servidor...
echo Abre: http://localhost:3000
echo.
node server.js
pause
