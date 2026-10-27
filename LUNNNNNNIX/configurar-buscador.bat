@echo off
cd /d "%~dp0"
setlocal EnableExtensions
if not exist ".env" copy /Y ".env.example" ".env" >nul

echo =============================================
echo   CONFIGURAR BUSCADOR DE LITERARY UNIVERSE
echo =============================================
echo.
set /p BRAVE_API_KEY="Brave Search API key: "
powershell -NoProfile -Command "(Get-Content '.env') -replace '^BRAVE_API_KEY=.*','BRAVE_API_KEY=' + $env:BRAVE_API_KEY | Set-Content '.env'"
set /p YOUTUBE_API_KEY="YouTube Data API v3 key: "
powershell -NoProfile -Command "(Get-Content '.env') -replace '^YOUTUBE_API_KEY=.*','YOUTUBE_API_KEY=' + $env:YOUTUBE_API_KEY | Set-Content '.env'"
echo.
echo Listo. Ahora ejecuta iniciar-buscador.bat
pause
