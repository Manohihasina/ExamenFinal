<template>
  <ion-card>
    <ion-card-header>
      <ion-card-title>Bonjour {{ displayName || 'Utilisateur' }} !</ion-card-title>
      <ion-card-subtitle>Bienvenue dans votre application de réparation automobile</ion-card-subtitle>
    </ion-card-header>
  </ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle } from '@ionic/vue'

interface Props {
  displayName?: string
}

defineProps<Props>()
</script>
