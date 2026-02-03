<template>
  <ion-chip :color="color">
    {{ text }}
  </ion-chip>
</template>

<script setup lang="ts">
import { IonChip } from '@ionic/vue'
import { computed } from 'vue'
import { RepairStatus } from '@/services/repair.service'

interface Props {
  status: RepairStatus
}

const props = defineProps<Props>()

const color = computed((): string => {
  switch (props.status) {
    case RepairStatus.PENDING: return 'warning'
    case RepairStatus.IN_PROGRESS: return 'primary'
    case RepairStatus.COMPLETED: return 'success'
    case RepairStatus.CANCELLED: return 'danger'
    default: return 'medium'
  }
})

const text = computed((): string => {
  switch (props.status) {
    case RepairStatus.PENDING: return 'En attente'
    case RepairStatus.IN_PROGRESS: return 'En cours'
    case RepairStatus.COMPLETED: return 'Terminée'
    case RepairStatus.CANCELLED: return 'Annulée'
    default: return 'Inconnu'
  }
})
</script>
