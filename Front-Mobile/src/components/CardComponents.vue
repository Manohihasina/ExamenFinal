<template>
<IonCard>

    <ion-card-header>
        <ion-card-title> {{ titre }} </ion-card-title>
    </ion-card-header>

    <IonCardContent> 
     <p>{{ description }} </p>  
    <IonButton color="primary" @click="handleButtonClick" > Cliquez moi </IonButton>
    </IonCardContent>
</IonCard>

</template>



<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/vue';

const props = defineProps({
    titre: {type :String , required: true , default: "Titre par defaut" },
    description: {type :String , required:true ,default: "Description par defaut"}
});

const emit = defineEmits<{
  buttonClicked: [message: string]
}>();

const handleButtonClick = () => {
  const message = `Bouton cliqué sur : ${props.titre}`;
  console.log(message);
  

  emit('buttonClicked', message);
};

</script>

<style scoped>
ion-card {
  margin: 20px; /* Augmenté */
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1); /* Ombre plus douce */
  transition: transform 0.3s ease;
}

ion-card:hover {
  transform: translateY(-5px);
}

ion-card-title {
  font-size: 1.3rem; /* Légèrement plus grand */
  font-weight: bold;
  padding-bottom: 12px; /* Espacement */
}

ion-card-content p {
  color: var(--ion-color-medium);
  margin-bottom: 20px; /* Augmenté */
}

/* Animation fade-in */
ion-card {
  animation: fadeIn 0.6s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>