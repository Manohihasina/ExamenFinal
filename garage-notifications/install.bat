@echo off
echo Installation des dépendances pour Garage Notifications API...
echo.

npm install
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Dépendances installées avec succès!
    echo.
    echo 🚀 Lancement du serveur de développement...
    npm run dev
) else (
    echo.
    echo ❌ Erreur lors de l'installation des dépendances.
    echo.
    pause
)
