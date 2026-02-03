<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom" class="modern-tab-bar">
        <ion-tab-button tab="home" href="/tabs/home" class="modern-tab-button">
          <ion-icon aria-hidden="true" :icon="homeOutline" class="tab-icon" />
          <ion-label class="tab-label">Accueil</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="cars" href="/tabs/cars" class="modern-tab-button">
          <ion-icon aria-hidden="true" :icon="carOutline" class="tab-icon" />
          <ion-label class="tab-label">Mes voitures</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="repairs" href="/tabs/repairs" class="modern-tab-button">
          <ion-icon aria-hidden="true" :icon="buildOutline" class="tab-icon" />
          <ion-label class="tab-label">Réparations</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/tabs/profile" class="modern-tab-button">
          <ion-icon aria-hidden="true" :icon="personOutline" class="tab-icon" />
          <ion-label class="tab-label">Profil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { homeOutline, carOutline, buildOutline, personOutline } from 'ionicons/icons';
</script>

<style scoped>
.modern-tab-bar {
  --background: linear-gradient(to top, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.95));
  --border-top: 1px solid rgba(0, 0, 0, 0.08);
  --backdrop-filter: blur(20px);
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.08);
  padding: 8px 0;
  backdrop-filter: blur(20px);
}

.modern-tab-button {
  --color: #6b7280;
  --color-selected: #3b82f6;
  --background: transparent;
  --background-selected: transparent;
  --ripple-color: rgba(59, 130, 246, 0.1);
  transition: all 0.3s ease;
  position: relative;
  margin: 0 4px;
  border-radius: 16px;
  padding: 8px 12px;
}

.modern-tab-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  background: linear-gradient(135deg, #3b82f6, #1b2174);
  border-radius: 12px;
  transition: all 0.3s ease;
  z-index: -1;
}

.modern-tab-button.tab-selected::before {
  width: 100%;
  height: 100%;
}

.modern-tab-button.tab-selected {
  --color: #ffffff;
  transform: translateY(-2px);
}

.tab-icon {
  font-size: 1.4rem;
  transition: all 0.3s ease;
}

.modern-tab-button.tab-selected .tab-icon {
  transform: scale(1.1);
}

.tab-label {
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 4px;
  transition: all 0.3s ease;
}

.modern-tab-button.tab-selected .tab-label {
  font-weight: 600;
}

/* Responsive adjustments */
@media (max-width: 380px) {
  .modern-tab-button {
    margin: 0 2px;
    padding: 6px 8px;
  }
  
  .tab-icon {
    font-size: 1.2rem;
  }
  
  .tab-label {
    font-size: 0.7rem;
  }
}
</style>
