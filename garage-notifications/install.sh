#!/bin/bash

echo "🚀 Installation des dépendances pour Garage Notifications API..."
echo ""

npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dépendances installées avec succès!"
    echo ""
    echo "🚀 Lancement du serveur de développement..."
    npm run dev
else
    echo ""
    echo "❌ Erreur lors de l'installation des dépendances."
    echo ""
    exit 1
fi
