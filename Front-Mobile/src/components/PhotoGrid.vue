<template>
  <div v-if="photos.length > 0" class="photo-grid">
    <ion-grid>
      <ion-row>
        <ion-col size="6" v-for="(photo, index) in photos" :key="index">
          <div class="photo-item">
            <img 
              :src="photo" 
              :alt="`Photo ${index + 1}`"
              @click="showPhoto(photo)"
            />
            <ion-button 
              v-if="showRemoveButton"
              size="small" 
              fill="clear" 
              color="danger"
              @click="removePhoto(index)"
              class="remove-photo"
            >
              <ion-icon :icon="closeCircleOutline"></ion-icon>
            </ion-button>
          </div>
        </ion-col>
      </ion-row>
    </ion-grid>
  </div>
</template>

<script setup lang="ts">
import { IonGrid, IonRow, IonCol, IonButton, IonIcon } from '@ionic/vue'
import { closeCircleOutline } from 'ionicons/icons'

interface Props {
  photos: string[]
  showRemoveButton?: boolean
}

withDefaults(defineProps<Props>(), {
  showRemoveButton: false
})

const emit = defineEmits<{
  showPhoto: [photo: string]
  removePhoto: [index: number]
}>()

const showPhoto = (photo: string) => {
  emit('showPhoto', photo)
}

const removePhoto = (index: number) => {
  emit('removePhoto', index)
}
</script>
<style scoped>
.photo-grid {
  margin-top: 24px; /* Augmenté */
}

.photo-item {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.photo-item:hover {
  transform: scale(1.02);
}

.photo-item img {
  width: 100%;
  height: 140px; /* Augmenté */
  object-fit: cover;
  border-radius: 10px;
}

.remove-photo {
  position: absolute;
  top: 8px;
  right: 8px;
  --padding-start: 10px;
  --padding-end: 10px;
  --padding-top: 10px;
  --padding-bottom: 10px;
}

/* Fade-in pour photos */
.photo-item {
  animation: fadeIn 0.4s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>