<template>
  <ion-card>
    <ion-card-header>
      <ion-card-title>Actions rapides</ion-card-title>
    </ion-card-header>
    <ion-card-content>
      <ion-button 
        v-for="action in actions" 
        :key="action.id"
        expand="block" 
        fill="outline" 
        @click="action.handler"
        :class="action.class"
      >
        <ion-icon :icon="action.icon" slot="start"></ion-icon>
        {{ action.label }}
      </ion-button>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon } from '@ionic/vue'

interface Action {
  id: string
  label: string
  icon: string
  handler: () => void
  class?: string
}

interface Props {
  actions: Action[]
}

defineProps<Props>()
</script>
