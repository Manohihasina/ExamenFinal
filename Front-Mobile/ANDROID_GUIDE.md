# 📱 Guide Android - Garage S5

## 🚀 Étapes pour tester sur téléphone Android

### Option 1: Android Studio (Recommandé)

1. **Installer Android Studio**
   - Téléchargez depuis : https://developer.android.com/studio
   - Installez-le sur votre ordinateur

2. **Ouvrir le projet Android**
   ```bash
   # Ouvrir Android Studio
   # File → Open → Sélectionner le dossier : d:\Manohihasina\S5\MrRojo\ExamenFinal\Front-Mobile\android
   ```

3. **Configurer un appareil Android**
   - **Sur téléphone**: Activez "Débogage USB"
     - Paramètres → À propos du téléphone → Appuyer 7x sur "Numéro de build"
     - Retour → Paramètres → Options pour les développeurs → Activer "Débogage USB"
   - **Ou utiliser l'émulateur** inclus dans Android Studio

4. **Lancer l'application**
   - Connectez votre téléphone en USB
   - Dans Android Studio, cliquez sur le bouton "Run" (▶️)
   - Sélectionnez votre téléphone
   - L'application s'installera automatiquement

### Option 2: Ligne de commande (ADB)

1. **Installer ADB** (Android Debug Bridge)
   - Fait partie du SDK Android Studio

2. **Connecter votre téléphone**
   ```bash
   # Vérifier la connexion
   adb devices
   ```

3. **Construire et installer**
   ```bash
   # Depuis le dossier Front-Mobile
   cd android
   ./gradlew assembleDebug
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

### Option 3: Build de production

1. **Générer une APK signée**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **Installer l'APK**
   ```bash
   adb install app/build/outputs/apk/release/app-release.apk
   ```

## 🔧 Configuration supplémentaire

### Permissions Android
Ajoutez ces permissions dans `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### Icône de l'application
Remplacez `android/app/src/main/res/mipmap-*/ic_launcher.png` par votre logo.

### Nom de l'application
Modifiez dans `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Garage S5</string>
```

## 📱 Test sur téléphone

1. **L'application apparaîtra** dans votre liste d'applications
2. **Testez toutes les fonctionnalités**:
   - Connexion Firebase
   - Navigation entre les pages
   - Notifications push
   - Stockage local

## 🐛 Dépannage

### Problèmes courants:
- **"INSTALL_FAILED_INSUFFICIENT_STORAGE"**: Libérez de l'espace sur le téléphone
- **"INSTALL_FAILED_MISSING_SHARED_LIBRARY"**: Mettez à jour Android Studio
- **"Connection refused"**: Vérifiez le débogage USB et les drivers

### Logs de l'application:
```bash
# Voir les logs en temps réel
adb logcat | grep "Garage S5"
```

## 🚀 Déploiement

### Pour la production:
1. Générez une APK signée
2. Créez un compte Google Play Developer
3. Soumettez l'application sur le Play Store

---

**🎉 Votre application Ionic Vue est maintenant prête pour Android !**
