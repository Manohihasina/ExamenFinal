<template>
  <ion-item button @click="handleClick">
    <ion-label>
      <h3>{{ carName }}</h3>
      <p>{{ truncatedDescription }}</p>
      <ion-chip :color="statusColor">
        {{ statusText }}
      </ion-chip>
    </ion-label>
    <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
  </ion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonItem, IonLabel, IonChip, IonIcon } from '@ionic/vue'
import { chevronForwardOutline } from 'ionicons/icons'
import type { Repair } from '@/services/repair.service'
import { RepairStatus } from '@/services/repair.service'

interface Props {
  repair: Repair
  carName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [repair: Repair]
}>()

const truncatedDescription = computed(() => {
  return props.repair.description.substring(0, 50) + '...'
})

const statusColor = computed((): string => {
  switch (props.repair.status) {
    case RepairStatus.PENDING: return 'warning'
    case RepairStatus.IN_PROGRESS: return 'primary'
    case RepairStatus.COMPLETED: return 'success'
    case RepairStatus.CANCELLED: return 'danger'
    default: return 'medium'
  }
})

const statusText = computed((): string => {
  switch (props.repair.status) {
    case RepairStatus.PENDING: return 'En attente'
    case RepairStatus.IN_PROGRESS: return 'En cours'
    case RepairStatus.COMPLETED: return 'Terminée'
    case RepairStatus.CANCELLED: return 'Annulée'
    default: return 'Inconnu'
  }
})

const handleClick = () => {
  emit('click', props.repair)
}
</script>
