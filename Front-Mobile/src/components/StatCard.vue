<template>
  <ion-card class="stat-card">
    <ion-card-content class="ion-text-center">
      <ion-icon :icon="icon" size="large" :color="color"></ion-icon>
      <h2>{{ value }}</h2>
      <p>{{ label }}</p>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardContent, IonIcon } from '@ionic/vue'

interface Props {
  value: number
  label: string
  icon: string
  color?: string
}

withDefaults(defineProps<Props>(), {
  color: 'primary'
})
</script>
<style scoped>
.stat-card {
  text-align: center;
  padding: 16px; /* Augmenté pour plus d'espace */
  margin: 10px 0; /* Espacement entre cartes */
  border-radius: 12px; /* Plus doux */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Ombre subtile */
  transition: transform 0.3s ease; /* Animation sur hover */
}

.stat-card:hover {
  transform: scale(1.02);
}

.stat-card h2 {
  margin: 12px 0 8px 0; /* Plus d'espace autour du titre */
  font-size: 24px;
  font-weight: bold;
}

.stat-card p {
  margin: 0;
  color: var(--ion-color-medium);
}

/* Animation pour chargement (si utilisé avec v-if) */
.stat-card {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>