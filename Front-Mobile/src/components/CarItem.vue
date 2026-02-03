<template>
  <ion-item button @click="handleClick">
    <ion-avatar slot="start">
      <img :src="carImage" :alt="car.brand" />
    </ion-avatar>
    <ion-label>
      <h2>{{ car.brand }} {{ car.model }}</h2>
      <p>{{ car.licensePlate }}</p>
      <p v-if="car.year && car.color">{{ car.year }} • {{ car.color }}</p>
    </ion-label>
    <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
  </ion-item>
</template>

<script setup lang="ts">
import { IonItem, IonLabel, IonAvatar, IonIcon } from '@ionic/vue'
import { chevronForwardOutline } from 'ionicons/icons'
import type { Car } from '@/services/car.service'
import { computed } from 'vue';

interface Props {
  car: Car
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [car: Car]
}>()

const carImage = computed(() => {
  return `https://via.placeholder.com/100x100?text=${props.car.brand.charAt(0)}`
})

const handleClick = () => {
  emit('click', props.car)
}
</script>
<style scoped>
ion-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

ion-item {
  --padding-start: 20px;
  --padding-end: 20px;
  margin-bottom: 16px; /* Espacement ajouté */
  border-radius: 8px;
  transition: background 0.3s ease;
}

ion-item:hover {
  background: var(--ion-color-light);
}

/* Animation */
ion-item {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>