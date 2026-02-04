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

        <ion-tab-button tab="payment" href="/tabs/payment" class="modern-tab-button">
          <ion-icon aria-hidden="true" :icon="cardOutline" class="tab-icon" />
          <ion-label class="tab-label">Paiement</ion-label>
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
import { homeOutline, carOutline, buildOutline, personOutline, notificationsOutline, cardOutline } from 'ionicons/icons';
</script>

<style scoped>
.modern-tab-bar {
  --background: linear-gradient(to top, #0f172a, #1e293b);
  --border-top: 1px solid rgba(255, 255, 255, 0.1);
  --backdrop-filter: blur(20px);
  box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.5);
  padding: 8px 0;
  backdrop-filter: blur(20px);
  display: flex;
  justify-content: space-evenly;
  gap: 2px;
}

.modern-tab-button {
  --color: #94a3b8;
  --color-selected: #ffffff;
  --background: transparent;
  --background-selected: transparent;
  --ripple-color: rgba(59, 130, 246, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  margin: 0 2px;
  border-radius: 12px;
  padding: 8px 6px;
  flex: 1;
  max-width: 70px;
  min-height: 60px;
}

.modern-tab-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  background: linear-gradient(135deg, #1e40af, #1e3a8a);
  border-radius: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
  opacity: 0.95;
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
  font-size: 1.3rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 2px;
}

.modern-tab-button.tab-selected .tab-icon {
  transform: scale(1.05);
  filter: drop-shadow(0 2px 4px rgba(30, 64, 175, 0.4));
}

.tab-label {
  font-size: 0.65rem;
  font-weight: 500;
  margin-top: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.1px;
}

.modern-tab-button.tab-selected .tab-label {
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

/* Responsive adjustments */
/* iPhone 12 Pro: 390px x 844px */
@media (max-width: 420px) {
  .modern-tab-bar {
    padding: 6px 0;
    gap: 1px;
  }
  
  .modern-tab-button {
    margin: 0 1px;
    padding: 6px 4px;
    max-width: 68px;
    min-height: 55px;
    border-radius: 10px;
  }
  
  .tab-icon {
    font-size: 1.2rem;
    margin-bottom: 1px;
  }
  
  .tab-label {
    font-size: 0.6rem;
    margin-top: 1px;
    letter-spacing: 0.05px;
  }
}

/* Très petits écrans */
@media (max-width: 360px) {
  .modern-tab-bar {
    padding: 4px 0;
    gap: 0px;
  }
  
  .modern-tab-button {
    margin: 0 0.5px;
    padding: 4px 2px;
    max-width: 65px;
    min-height: 50px;
  }
  
  .tab-icon {
    font-size: 1.1rem;
  }
  
  .tab-label {
    font-size: 0.55rem;
  }
}

/* Tablettes et grands écrans */
@media (min-width: 768px) {
  .modern-tab-bar {
    padding: 16px 0;
    gap: 8px;
  }
  
  .modern-tab-button {
    margin: 0 8px;
    padding: 14px 20px;
    max-width: 110px;
    min-height: 80px;
  }
  
  .tab-icon {
    font-size: 1.6rem;
    margin-bottom: 4px;
  }
  
  .tab-label {
    font-size: 0.75rem;
    margin-top: 4px;
  }
}

/* Effet de survol amélioré */
.modern-tab-button:hover:not(.tab-selected) {
  --color: #cbd5e1;
  transform: translateY(-1px);
}

.modern-tab-button:hover:not(.tab-selected)::before {
  width: 80%;
  height: 80%;
  opacity: 0.3;
}

/* Contourner le conflit avec .button-inner d'Ionic */
.modern-tab-button .button-inner {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 100% !important;
  gap: 4px !important;
}
</style>
