<template>
  <div id="container">
    <strong>{{ name }}</strong>
    <p>Explore <a target="_blank" rel="noopener noreferrer" href="https://ionicframework.com/docs/components">UI Components</a></p>
  </div>
</template>

<script setup lang="ts">
defineProps({
  name: String,
});
</script>
<style scoped>
#container {
  text-align: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  padding: 20px; /* Espace ajouté */
}

#container strong {
  font-size: 22px; /* Augmenté */
  line-height: 28px;
}

#container p {
  font-size: 16px;
  line-height: 24px; /* Augmenté */
  color: #8c8c8c;
  margin: 12px 0; /* Espacement */
}

#container a {
  text-decoration: none;
  transition: color 0.3s ease;
}

#container a:hover {
  color: var(--ion-color-primary);
}

/* Fade-in */
#container {
  animation: fadeIn 1s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>