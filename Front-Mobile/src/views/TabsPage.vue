<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom" class="custom-tab-bar">
        <ion-tab-button tab="home" href="/tabs/home" class="custom-tab-button">
          <ion-icon aria-hidden="true" :icon="homeOutline" class="custom-tab-icon" />
          <ion-label class="custom-tab-label">Accueil</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="cars" href="/tabs/cars" class="custom-tab-button">
          <ion-icon aria-hidden="true" :icon="carOutline" class="custom-tab-icon" />
          <ion-label class="custom-tab-label">Véhicules</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="repairs" href="/tabs/repairs" class="custom-tab-button">
          <ion-icon aria-hidden="true" :icon="buildOutline" class="custom-tab-icon" />
          <ion-label class="custom-tab-label">Réparations</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="payment" href="/tabs/payment" class="custom-tab-button">
          <ion-icon aria-hidden="true" :icon="cardOutline" class="custom-tab-icon" />
          <ion-label class="custom-tab-label">Paiements</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/tabs/profile" class="custom-tab-button">
          <ion-icon aria-hidden="true" :icon="personOutline" class="custom-tab-icon" />
          <ion-label class="custom-tab-label">Profil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { homeOutline, carOutline, buildOutline, personOutline, notificationsOutline, cardOutline } from 'ionicons/icons';
</script>

<style scoped>
.custom-tab-bar {
  --background: linear-gradient(to top, #1a2332, #243447);
  --border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  padding: 6px 0;
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-evenly;
}

.custom-tab-button {
  --color: #8892a6;
  --color-selected: #ffffff;
  --background: transparent;
  --background-selected: transparent;
  --ripple-color: rgba(59, 130, 246, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  margin: 0;
  border-radius: 12px;
  padding: 8px 4px;
  flex: 1;
  max-width: 80px;
  min-height: 60px;
}

.custom-tab-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  background: linear-gradient(135deg, #2563eb, #1e40af);
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
  opacity: 0.9;
}

.custom-tab-button.tab-selected::before {
  width: 100%;
  height: 100%;
}

.custom-tab-button.tab-selected {
  --color: #ffffff;
  transform: translateY(-1px);
}

.custom-tab-icon {
  font-size: 1.3rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 2px;
}

.custom-tab-button.tab-selected .custom-tab-icon {
  transform: scale(1.05);
  filter: drop-shadow(0 2px 4px rgba(37, 99, 235, 0.3));
}

.custom-tab-label {
  font-size: 0.7rem;
  font-weight: 500;
  margin-top: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.2px;
}

.custom-tab-button.tab-selected .custom-tab-label {
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Contourner le conflit avec .button-inner d'Ionic */
.custom-tab-button .button-inner {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 100% !important;
  gap: 2px !important;
}

/* Effet de survol amélioré */
.custom-tab-button:hover:not(.tab-selected) {
  --color: #cbd5e1;
  transform: translateY(-1px);
}

.custom-tab-button:hover:not(.tab-selected)::before {
  width: 80%;
  height: 80%;
  opacity: 0.3;
}

/* Responsive adjustments */
@media (max-width: 380px) {
  .custom-tab-button {
    padding: 6px 2px;
    max-width: 70px;
    min-height: 55px;
  }
  
  .custom-tab-icon {
    font-size: 1.1rem;
  }
  
  .custom-tab-label {
    font-size: 0.65rem;
  }
}

@media (min-width: 768px) {
  .custom-tab-button {
    max-width: 100px;
    padding: 10px 8px;
  }
  
  .custom-tab-icon {
    font-size: 1.4rem;
  }
  
  .custom-tab-label {
    font-size: 0.75rem;
  }
}
</style>
