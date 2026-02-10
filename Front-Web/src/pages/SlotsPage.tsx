/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Divider,
  useToast,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { repairSlotService, type RepairSlot, type CarWithRepairs } from '../services/repairSlotService';
import apiService from '../services/api';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { useCallback } from 'react';
import './SlotsPage-dark.css';

// Définir le type Repair localement
// interface Repair {
//   id: string;
//   interventionName: string;
//   interventionPrice: number;
//   interventionId: number;
//   interventionDuration: number;
//   status: 'pending' | 'in_progress' | 'completed';
// }

const SlotsPage: React.FC = () => {
  const [slots, setSlots] = useState<RepairSlot[]>([]);
  const [carsWithRepairs, setCarsWithRepairs] = useState<CarWithRepairs[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<RepairSlot | null>(null);
  const [selectedCar, setSelectedCar] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [repairProgress, setRepairProgress] = useState<Record<string, { progress: number; remaining: number }>>({});
  const [slotRepairs, setSlotRepairs] = useState<Record<number, any[]>>({});
  const [completedCars, setCompletedCars] = useState<Record<string, { carId: string; interventions: any[]; totalPrice: number }>>({});
  const [halfwayNotified, setHalfwayNotified] = useState<Record<string, boolean>>({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Fonction pour créer un nouveau slot
  const createNewSlot = async () => {
    try {
      setSubmitting(true);
      const result = await apiService.createRepairSlot({
        status: 'available'
      });
      
      toast({
        title: 'Succès',
        description: 'Nouveau slot de réparation créé avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      console.log('Nouveau slot créé:', result);
      
      // Recharger les slots depuis Firebase
      setTimeout(() => {
        const slotsRef = ref(database, 'repair_slots');
        onValue(slotsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const slotsArray = Object.keys(data).map(key => ({
              id: parseInt(key),
              slot_number: data[key].slot_number || parseInt(key),
              car_id: data[key].car_id || null,
              status: data[key].status || 'available',
              created_at: data[key].created_at,
              updated_at: data[key].updated_at
            }));
            setSlots(slotsArray.sort((a, b) => a.slot_number - b.slot_number));
          }
        });
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors de la création du slot:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le nouveau slot',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Fonction pour vérifier toutes les voitures dans les slots
  const checkAllCarsInSlots = async () => {
    console.log('🔍 [DEBUG] Vérification manuelle de toutes les voitures dans les slots');
    
    for (const slot of slots) {
      if (slot.car_id) {
        const carId = slot.car_id.toString();
        console.log('🔍 [DEBUG] Vérification slot:', slot.id, 'carId:', carId);
        
        try {
          const allRepairs = await repairSlotService.getCarRepairs(carId);
          console.log('🔍 [DEBUG] Réparations trouvées pour voiture', carId, ':', allRepairs);
          
          const allCompleted = allRepairs.every(repair => repair.status === 'completed');
          console.log('🔍 [DEBUG] Voiture', carId, 'toutes complétées?', allCompleted);
          
          if (allCompleted && allRepairs.length > 0) {
            const totalPrice = allRepairs.reduce((sum: number, repair: any) => sum + repair.interventionPrice, 0);
            
            setCompletedCars(prev => ({
              ...prev,
              [carId]: {
                carId,
                interventions: allRepairs,
                totalPrice
              }
            }));
            
            console.log('✅ [DEBUG] Voiture', carId, 'ajoutée aux complétées!');
          }
        } catch (error) {
          console.error('❌ [DEBUG] Erreur vérification voiture', carId, ':', error);
        }
      }
    }
    
    toast({
      title: 'Vérification terminée',
      description: 'Vérification de toutes les voitures dans les slots complétée',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // Charger les réparations pour un slot spécifique
  const loadSlotRepairs = useCallback(async (slot: RepairSlot) => {
    if (!slot.car_id || slotRepairs[slot.id]) return;
    
    try {
      console.log('🔍 [DEBUG] Chargement réparations pour slot:', slot.id, 'car:', slot.car_id);
      const repairs = await repairSlotService.getCarRepairs(slot.car_id.toString());
      setSlotRepairs(prev => ({ ...prev, [slot.id]: repairs }));
    } catch (error) {
      console.error('❌ Erreur chargement réparations slot:', error);
    }
  }, [slotRepairs]);

  const fetchData = useCallback(async () => {
    console.log('🔍 [DEBUG] Début fetchData() dans SlotsPage');
    
    try {
      // Charger les slots depuis Firebase (priorité) ou API Laravel (fallback)
      console.log('🔍 [DEBUG] Appel getRepairSlots()...');
      const slotsData = await repairSlotService.getRepairSlots();
      console.log('🔍 [DEBUG] Slots reçus:', slotsData.length, 'slots');
      setSlots(slotsData);

      // Charger les voitures avec réparations
      console.log('🔍 [DEBUG] Appel getCarsWithRepairs()...');
      const carsData = await repairSlotService.getCarsWithRepairs();
      console.log('🔍 [DEBUG] Voitures reçues:', carsData.length, 'voitures');
      setCarsWithRepairs(carsData);

      // Charger les réparations pour chaque slot occupé
      for (const slot of slotsData) {
        if (slot.status === 'occupied' && slot.car_id) {
          await loadSlotRepairs(slot);
        }
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erreur globale dans fetchData():', error);
      console.error('🔍 [DEBUG] Type erreur:', typeof error);
      console.error('🔍 [DEBUG] Message:', error instanceof Error ? error.message : String(error));
      
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      console.log('🔍 [DEBUG] fetchData() terminé, setLoading(false)');
      setLoading(false);
    }
  }, [loadSlotRepairs, toast]);

  // Charger les slots et les voitures avec réparations
  useEffect(() => {
    fetchData();
    
    // Écouter les changements en temps réel des réparations
    const repairsRef = ref(database, 'repairs');
    const unsubscribe = onValue(repairsRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log('🔄 [REALTIME] Changements détectés dans les réparations');
        fetchData(); // Recharger les données
      }
    });

    return () => unsubscribe();
  }, [fetchData, toast]);

  const handleAddCarToSlot = async () => {
    console.log('🔍 [DEBUG] handleAddCarToSlot appelé avec:', { selectedSlot, selectedCar });
    
    if (!selectedSlot || !selectedCar) {
      console.error('🔍 [DEBUG] Validation échouée:', { selectedSlot, selectedCar });
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un slot et une voiture',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const carIdStr = selectedCar; // Garder comme string (Firebase ID)
    console.log('🔍 [DEBUG] selectedCar:', selectedCar, 'type:', typeof selectedCar);
    
    if (!carIdStr || carIdStr.trim() === '') {
      console.error('🔍 [DEBUG] carId est vide!');
      toast({
        title: 'Erreur',
        description: 'ID de voiture invalide',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      console.log('🔍 [DEBUG] Appel occupySlot avec:', selectedSlot.id, carIdStr);
      await repairSlotService.occupySlot(selectedSlot.id, carIdStr);
      
      toast({
        title: 'Succès',
        description: 'Voiture ajoutée au slot avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
      setSelectedCar('');
      setSelectedSlot(null);
      fetchData(); // Recharger les données
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter la voiture au slot',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartRepair = async (repairId: string, interventionId: number, duration: number) => {
    try {
      // Mettre à jour immédiatement l'état local pour le statut "en cours"
      setSlotRepairs(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(slotId => {
          updated[parseInt(slotId)] = updated[parseInt(slotId)].map(repair => 
            repair.id === repairId 
              ? { ...repair, status: 'in_progress' as const }
              : repair
          );
        });
        return updated;
      });
      
      // Démarrer la réparation
      await repairSlotService.startRepair(repairId, interventionId, duration);
      
      toast({
        title: 'Succès',
        description: 'Réparation démarrée',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Démarrer le suivi en temps réel
      startRepairTracking(repairId, duration);
      
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de démarrer la réparation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const startRepairTracking = (repairId: string, duration: number) => {
    const startTime = Date.now();
    const halfwayTime = startTime + (duration * 1000) / 2; // Temps à mi-parcours
    const endTime = startTime + (duration * 1000); // Temps de fin

    // Vérifier toutes les secondes
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const remaining = Math.max(0, endTime - currentTime);
      const progress = Math.min(100, (elapsed / (duration * 1000)) * 100);
      
      // Mettre à jour la barre de progression
      setRepairProgress(prev => ({
        ...prev,
        [repairId]: { progress, remaining: Math.ceil(remaining / 1000) }
      }));
      
      // À mi-parcours (afficher la notification une seule fois)
      if (currentTime >= halfwayTime && currentTime < endTime && !halfwayNotified[repairId]) {
        repairSlotService.updateRepairStatus(repairId, {
          status: 'in_progress',
          halfwayNotified: true
        });
        
        setHalfwayNotified(prev => ({ ...prev, [repairId]: true }));
        
        toast({
          title: 'Réparation à mi-parcours',
          description: `Temps restant: ${Math.ceil(remaining / 1000)} secondes`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Réparation terminée
      if (currentTime >= endTime) {
        clearInterval(interval);
        
        // Mettre à jour la progression finale
        setRepairProgress(prev => ({
          ...prev,
          [repairId]: { progress: 100, remaining: 0 }
        }));
        
        // Mettre à jour immédiatement l'état local pour le statut "terminé"
        setSlotRepairs(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(slotId => {
            updated[parseInt(slotId)] = updated[parseInt(slotId)].map(repair => 
              repair.id === repairId 
                ? { ...repair, status: 'completed' as const }
                : repair
            );
          });
          return updated;
        });
        
        repairSlotService.updateRepairStatus(repairId, {
          status: 'completed',
          completedNotified: true
        });
        
        toast({
          title: 'Réparation terminée',
          description: 'La réparation a été complétée avec succès',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Vérifier si toutes les interventions de cette voiture sont terminées
        checkAllRepairsCompleted(repairId);
        
        // Recharger les données en temps réel
        fetchData();
      }
    }, 1000); // Vérifier chaque seconde
  };

  const checkAllRepairsCompleted = async (completedRepairId: string) => {
    try {
      console.log('🔍 [DEBUG] Vérification réparations complétées pour:', completedRepairId);
      
      // Trouver la réparation terminée
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let completedRepair: any = null;
      let carId: string = '';
      
      Object.keys(slotRepairs).forEach(slotId => {
        const repairs = slotRepairs[parseInt(slotId)];
        const repair = repairs.find(r => r.id === completedRepairId);
        if (repair) {
          completedRepair = repair;
          carId = repair.carId?.toString() || '';
          console.log('🔍 [DEBUG] Réparation trouvée:', repair, 'carId:', carId);
        }
      });
      
      if (!completedRepair || !carId) {
        console.log('❌ [DEBUG] Pas de réparation trouvée ou carId vide');
        return;
      }
      
      // Récupérer toutes les réparations de cette voiture
      const allRepairs = await repairSlotService.getCarRepairs(carId);
      console.log('🔍 [DEBUG] Toutes les réparations de la voiture:', allRepairs);
      
      const allCompleted = allRepairs.every(repair => repair.status === 'completed');
      console.log('🔍 [DEBUG] Toutes complétées?', allCompleted);
      
      if (allCompleted) {
        // Calculer le prix total
        const totalPrice = allRepairs.reduce((sum: number, repair: any) => sum + repair.interventionPrice, 0);
        console.log('🔍 [DEBUG] Prix total calculé:', totalPrice);
        
        // Ajouter aux voitures complétées
        setCompletedCars(prev => {
          console.log('🔍 [DEBUG] Ajout voiture complétée:', carId);
          return {
            ...prev,
            [carId]: {
              carId,
              interventions: allRepairs,
              totalPrice
            }
          };
        });
        
    
      } else {
        console.log('🔍 [DEBUG] Pas encore toutes les réparations terminées');
      }
    } catch (error) {
      console.error('Erreur vérification réparations complétées:', error);
    }
  };

  const moveToWaitingSlots = async (carId: string) => {
    try {
      const completedCar = completedCars[carId];
      if (!completedCar) return;
      
      // Récupérer les informations du client depuis les réparations de la voiture
      console.log('🔍 [DEBUG] Récupération du client ID depuis les réparations...');
      
      // Utiliser la même fonction que getCarRepairs pour récupérer les réparations
      const carRepairs = await repairSlotService.getCarRepairs(carId);
      console.log('🔍 [DEBUG] Réparations trouvées pour clientId:', carRepairs);
      
      // Récupérer le userId depuis la première réparation
      const clientId = carRepairs.length > 0 ? carRepairs[0].userId : 'current_user';
      
      console.log('🔍 [DEBUG] Client ID récupéré depuis réparations:', clientId);
      console.log('🔍 [DEBUG] Nombre de réparations trouvées:', carRepairs.length);
      
      // Récupérer les informations détaillées du client
      let clientInfo = { name: 'Client inconnu', email: 'Email inconnu' };
      try {
        // Chercher dans les voitures avec réparations pour trouver les infos du client
        const carWithClient = carsWithRepairs.find(car => car.id === carId);
        if (carWithClient && carWithClient.client) {
          clientInfo = {
            name: carWithClient.client.name || 'Client inconnu',
            email: carWithClient.client.email || 'Email inconnu'
          };
        }
        console.log('🔍 [DEBUG] Infos client trouvées:', clientInfo);
      } catch (error) {
        console.log('🔍 [DEBUG] Erreur récupération infos client:', error);
      }
      
      // Créer l'objet pour waiting_slots
      const waitingSlotData = {
        carId,
        clientId,
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        interventions: completedCar.interventions.map(intervention => ({
          id: intervention.id,
          name: intervention.interventionName,
          price: intervention.interventionPrice
        })),
        totalPrice: completedCar.totalPrice,
        createdAt: new Date().toISOString(),
        status: 'waiting_payment'
      };
      
      // Ajouter à la base de données waiting_slots
      await repairSlotService.addToWaitingSlots(waitingSlotData);
      
      // Retirer de la liste des complétées
      setCompletedCars(prev => {
        const updated = { ...prev };
        delete updated[carId];
        return updated;
      });
      
      // Libérer le slot
      console.log('🔍 [DEBUG] Recherche du slot pour la voiture:', carId);
      console.log('🔍 [DEBUG] Slots disponibles:', slots.map(s => ({ 
        id: s.id, 
        car_id: s.car_id, 
        car_id_str: s.car_id?.toString(),
        status: s.status,
        car_client_id: s.car?.client?.id,
        car_client_name: s.car?.client?.name
      })));
      
      // Essayer différentes méthodes pour trouver le slot
      let slotToFree = slots.find(slot => slot.car_id?.toString() === carId);
      
      if (!slotToFree) {
        console.log('🔍 [DEBUG] Première recherche échouée, essai avec carId comme nombre...');
        slotToFree = slots.find(slot => slot.car_id === parseInt(carId));
      }
      
      if (!slotToFree) {
        console.log('🔍 [DEBUG] Deuxième recherche échouée, essai avec client ID...');
        slotToFree = slots.find(slot => slot.car?.client?.id === completedCar.interventions[0]?.userId);
      }
      
      console.log('🔍 [DEBUG] Slot trouvé:', slotToFree);
      
      if (slotToFree) {
        console.log('🔍 [DEBUG] Libération du slot:', slotToFree.id);
        console.log('🔍 [DEBUG] Statut actuel du slot:', slotToFree.status);
        
        await repairSlotService.updateSlotStatus(slotToFree.id, 'available');
        console.log('✅ [DEBUG] Slot libéré avec succès');
        
        // Vérifier que le slot a bien été mis à jour
        setTimeout(async () => {
          console.log('🔍 [DEBUG] Vérification du statut du slot après mise à jour...');
          // La fonction fetchData devrait recharger et montrer le slot comme disponible
        }, 1000);
      } else {
        console.log('❌ [DEBUG] Aucun slot trouvé pour cette voiture');
        console.log('❌ [DEBUG] CarId recherché:', carId);
        console.log('❌ [DEBUG] Type de carId:', typeof carId);
      }
      
      console.log('🔍 [DEBUG] Affichage du toast de succès');
      toast({
        title: 'Voiture déplacée',
        description: 'La voiture a été déplacée vers les slots d\'attente de paiement',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      console.log('🔍 [DEBUG] Rechargement des données');
      // Recharger les données
      fetchData();
      console.log('✅ [DEBUG] Fonction moveToWaitingSlots terminée');
    } catch (error) {
      console.error('Erreur déplacement vers waiting slots:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de déplacer la voiture vers les slots d\'attente',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Occupé';
      case 'waiting_payment':
        return 'En attente de paiement';
      default:
        return status;
    }
  };

  // Fonction pour formater le temps en MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
          <Spinner size="xl" />
        </Box>
      </Container>
    );
  }

  return (
    <div className="slots-page-container">
      <div className="slots-main-box">
        <h1 className="slots-header">Slots de Réparation</h1>
        
        {/* Bouton de test pour vérifier les voitures complétées */}
        <div className="slots-test-section">
          <button className="slots-test-button" onClick={checkAllCarsInSlots}>
            🔍 Vérifier les voitures complétées
          </button>
          <span className="slots-test-text">
            Test: Cliquez pour vérifier manuellement si des voitures ont toutes leurs réparations terminées
          </span>
        </div>

        {/* Bouton pour créer un nouveau slot */}
        <div className="slots-create-section">
          <button 
            className="slots-create-button" 
            onClick={createNewSlot}
            disabled={submitting}
          >
            {submitting ? 'Création...' : '➕ Ajouter un nouveau slot'}
          </button>
          <span className="slots-create-text">
            Crée un nouveau slot de réparation disponible dans Firebase
          </span>
        </div>

        <div className="slots-grid">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`slot-card ${slot.status}`}
            >
              <div className="slot-header">
                <div className="slot-info">
                  <div className="slot-title">
                    Slot #{slot.slot_number}
                    <span className={`slot-status-badge ${slot.status}`}>
                      {getStatusText(slot.status)}
                    </span>
                  </div>

                  {slot.car && (
                    <div className="car-info-section">
                      <div className="car-info-title">Informations du véhicule</div>
                      <span className="car-info-text">
                        <strong>Marque/Modèle:</strong> {slot.car.brand} {slot.car.model}
                      </span>
                      <span className="car-info-text license-plate">
                        <strong>Plaque:</strong> {slot.car.license_plate || slot.car.license_plate}
                      </span>
                      <span className="car-info-text">
                        <strong>Client:</strong> {slot.car.client?.name || 'Client inconnu'}
                      </span>
                      <span className="car-info-text">
                        <strong>Couleur:</strong> {slot.car.color || 'Inconnue'}
                      </span>
                      <span className="car-info-text">
                        <strong>Année:</strong> {slot.car.year || 'Inconnue'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="slot-actions">
                  {slot.status === 'available' && (
                    <button
                      className="slot-action-button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        onOpen();
                      }}
                    >
                      Ajouter une voiture
                    </button>
                  )}

                  {slot.status === 'occupied' && slotRepairs[slot.id] && slotRepairs[slot.id].length > 0 && (
                    <button className="slot-action-button green small">
                      Voir les réparations ({slotRepairs[slot.id].length})
                    </button>
                  )}
                </div>
              </div>

              {/* Afficher les réparations si elles existent */}
              {slot.status === 'occupied' && slotRepairs[slot.id] && slotRepairs[slot.id].length > 0 && (
                <div className="repairs-section">
                  <div className="repairs-title">Réparations en cours:</div>
                  <table className="repairs-table">
                    <thead>
                      <tr>
                        <th>Intervention</th>
                        <th>Prix</th>
                        <th>Statut</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slotRepairs[slot.id].map((repair) => (
                        <tr key={repair.id}>
                          <td>{repair.interventionName}</td>
                          <td>{repair.interventionPrice}€</td>
                          <td>
                            <span className={`repair-status-badge ${repair.status}`}>
                              {repair.status === 'pending' ? 'En attente' : 
                               repair.status === 'in_progress' ? 'En cours' : 'Terminé'}
                            </span>
                          </td>
                          <td>
                            {repair.status === 'pending' && (
                              <button
                                className="repair-action-button"
                                onClick={() => handleStartRepair(
                                  repair.id, 
                                  repair.interventionId, 
                                  repair.interventionDuration || 60
                                )}
                              >
                                Réparer
                              </button>
                            )}
                            
                            {/* Minuteur pour les réparations en cours */}
                            {repair.status === 'in_progress' && repairProgress[repair.id] && (
                              <div className="timer-container">
                                <div className="timer-display">
                                  {formatTime(repairProgress[repair.id].remaining)}
                                </div>
                                <div className="timer-label">Temps restant</div>
                              </div>
                            )}
                            
                            {/* Badge pour les réparations terminées */}
                            {repair.status === 'completed' && (
                              <span className="completed-badge">
                                ✅ Terminé
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Section des voitures complétées */}
        {Object.keys(completedCars).length > 0 && (
          <div className="completed-cars-section">
            <h2 className="completed-cars-header">
              🎉 Voitures prêtes pour le paiement
            </h2>
            
            {Object.entries(completedCars).map(([carId, carData]) => {
              // Récupérer les informations du client pour cette voiture
              const carWithClient = carsWithRepairs.find(car => car.id === carId);
              const clientName = carWithClient?.client?.name || 'Client inconnu';
              const clientEmail = carWithClient?.client?.email || 'Email inconnu';
              
              return (
              <div key={carId} className="completed-car-card">
                <div className="completed-car-header">
                  <div className="completed-car-title">Voiture: {carId}</div>
                  <span className="completed-car-badge">{carData.interventions.length} interventions</span>
                </div>
                
                {/* Informations du client */}
                <div className="client-info-section">
                  <div className="client-info-title">Informations du client</div>
                  <div className="client-info-grid">
                    <div className="client-info-item">
                      <span className="client-info-label">Nom:</span>
                      <span className="client-info-value">{clientName}</span>
                    </div>
                    <div className="client-info-item">
                      <span className="client-info-label">Email:</span>
                      <span className="client-info-value">{clientEmail}</span>
                    </div>
                  </div>
                </div>
                
                <div className="interventions-list">
                  <div className="interventions-title">Interventions terminées:</div>
                  {carData.interventions.map((intervention: any) => (
                    <div key={intervention.id} className="intervention-item">
                      <span className="intervention-name">• {intervention.interventionName}</span>
                      <span className="intervention-price">{intervention.interventionPrice}€</span>
                    </div>
                  ))}
                </div>
                
                <Divider />
                
                <div className="total-section">
                  <span className="total-label">Total à payer:</span>
                  <span className="total-amount">{carData.totalPrice}€</span>
                </div>
                
                <button
                  className="payment-button"
                  onClick={() => moveToWaitingSlots(carId)}
                >
                  🚗 Mettre en attente de paiement
                </button>
              </div>
              );
            })}
          </div>
        )}

        {/* Modal pour ajouter une voiture */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay className="modal-overlay" />
          <ModalContent className="modal-content">
            <ModalHeader className="modal-header">
              <h2 className="modal-title">
                Ajouter une voiture au Slot #{selectedSlot?.slot_number}
              </h2>
              <ModalCloseButton className="modal-close-button" />
            </ModalHeader>
            <ModalBody className="modal-body">
              <VStack spacing={4}>
                <p className="modal-text">
                  Sélectionnez une voiture avec des réparations en attente:
                </p>
                <select
                  className="modal-select"
                  value={selectedCar}
                  onChange={(e) => setSelectedCar(e.target.value)}
                >
                  <option value="">Choisir une voiture</option>
                  {carsWithRepairs
                    .filter(car => car.repairs.length > 0)
                    .map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.brand} {car.model} ({car.license_plate}) - {car.client_name || (car.client?.name || 'Client inconnu')} - {car.repairs.length} réparations
                      </option>
                    ))}
                </select>
              </VStack>
            </ModalBody>
            <ModalFooter className="modal-footer">
              <button className="modal-button cancel" onClick={onClose}>
                Annuler
              </button>
              <button
                className="modal-button confirm"
                onClick={handleAddCarToSlot}
                disabled={!selectedCar}
              >
                {submitting ? 'Ajout en cours...' : 'Ajouter au slot'}
              </button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default SlotsPage;
