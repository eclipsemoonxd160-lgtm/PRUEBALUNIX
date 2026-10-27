@echo off
cd /d "%~dp0"
setlocal

echo.
echo =====================================================
echo       LITERARY UNIVERSE - INICIANDO BUSCADOR
echo =====================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js no esta instalado o no esta en PATH.
  echo Instala Node.js 18 o superior y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

if not exist ".env" copy /Y ".env.example" ".env" >nul

if not exist "node_modules" (
  echo No se necesita npm install para esta version.
  echo El servidor usa las funciones nativas de Node.js 18+.
)

echo Iniciando servidor en http://localhost:3000 ...
start "Literary Universe Server" /min cmd /c "cd /d "%~dp0" && node server.js"

timeout /t 2 /nobreak >nul

start "" "http://localhost:3000/"

echo.
echo Literary Universe ya esta abierto.
echo NO cierres la ventana del servidor mientras uses el buscador.
echo.
pause
