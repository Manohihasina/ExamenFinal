<template>
  <div class="car-loading-container">
    <div class="car-loading-animation">
      <svg class="car-svg" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Route -->
        <line x1="0" y1="60" x2="200" y2="60" stroke="#e5e7eb" stroke-width="2" stroke-dasharray="10,5" opacity="0.5"/>
        
        <!-- Voiture -->
        <g class="car-body">
          <!-- Carrosserie -->
          <rect x="50" y="35" width="60" height="20" rx="4" fill="#2563eb"/>
          <rect x="65" y="25" width="30" height="15" rx="3" fill="#3b82f6"/>
          
          <!-- Fenêtres -->
          <rect x="68" y="28" width="12" height="10" rx="2" fill="#60a5fa"/>
          <rect x="82" y="28" width="10" height="10" rx="2" fill="#60a5fa"/>
          
          <!-- Roues -->
          <circle cx="60" cy="58" r="6" fill="#1f2937"/>
          <circle cx="60" cy="58" r="3" fill="#6b7280"/>
          <circle cx="100" cy="58" r="6" fill="#1f2937"/>
          <circle cx="100" cy="58" r="3" fill="#6b7280"/>
          
          <!-- Phares -->
          <circle cx="112" cy="45" r="2" fill="#fbbf24"/>
        </g>
        
        <!-- Lignes de mouvement -->
        <g class="motion-lines">
          <line x1="20" y1="40" x2="35" y2="40" stroke="#cbd5e1" stroke-width="2" opacity="0.6"/>
          <line x1="25" y1="50" x2="40" y2="50" stroke="#cbd5e1" stroke-width="2" opacity="0.4"/>
          <line x1="15" y1="45" x2="30" y2="45" stroke="#cbd5e1" stroke-width="2" opacity="0.5"/>
        </g>
      </svg>
    </div>
    <p class="loading-text">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string;
}

withDefaults(defineProps<Props>(), {
  message: 'Chargement en cours...'
});
</script>

<style scoped>
.car-loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.car-loading-animation {
  margin-bottom: 20px;
}

.car-svg {
  width: 120px;
  height: 48px;
}

.car-body {
  animation: carMove 2s ease-in-out infinite;
}

.motion-lines line {
  animation: motionLines 1.5s ease-in-out infinite;
}

.motion-lines line:nth-child(2) {
  animation-delay: 0.2s;
}

.motion-lines line:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes carMove {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(10px);
  }
}

@keyframes motionLines {
  0% {
    opacity: 0;
    transform: translateX(0);
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
    transform: translateX(-20px);
  }
}

.loading-text {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  margin: 0;
  text-align: center;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

/* Variante pour les petits écrans */
@media (max-width: 380px) {
  .car-svg {
    width: 100px;
    height: 40px;
  }
  
  .loading-text {
    font-size: 0.8rem;
  }
}

/* Variante sombre */
@media (prefers-color-scheme: dark) {
  .motion-lines line {
    stroke: #4b5563;
  }
  
  .loading-text {
    color: var(--ion-color-medium-tint);
  }
}
</style>
