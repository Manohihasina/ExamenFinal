import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Alert,
  AlertIcon,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Divider,
  useToast,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import { repairSlotService, type RepairSlot, type CarWithRepairs } from '../services/repairSlotService';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { useCallback } from 'react';

// Définir le type Repair localement
interface Repair {
  id: string;
  interventionName: string;
  interventionPrice: number;
  interventionId: number;
  interventionDuration: number;
  status: 'pending' | 'in_progress' | 'completed';
}

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
      
      // Créer l'objet pour waiting_slots
      const waitingSlotData = {
        carId,
        clientId,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'green';
      case 'occupied':
        return 'blue';
      case 'waiting_payment':
        return 'orange';
      default:
        return 'gray';
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
    <Container maxW="container.xl" py={8}>
      <Box bg="white" p={8} borderRadius="lg" boxShadow="md">
        <Heading size="lg" mb={6} color="gray.800">
          Slots de Réparation
        </Heading>
        
        {/* Bouton de test pour vérifier les voitures complétées */}
        <HStack mb={6}>
          <Button 
            colorScheme="blue" 
            onClick={checkAllCarsInSlots}
            leftIcon={<span>🔍</span>}
          >
            Vérifier les voitures complétées
          </Button>
          <Text fontSize="sm" color="gray.600" ml={3}>
            Test: Cliquez pour vérifier manuellement si des voitures ont toutes leurs réparations terminées
          </Text>
        </HStack>

        <VStack spacing={6} align="stretch">
          {slots.map((slot) => (
            <Box
              key={slot.id}
              p={6}
              border="2px"
              borderColor={getStatusColor(slot.status) + '.200'}
              borderRadius="md"
              bg={getStatusColor(slot.status) + '.50'}
            >
              <HStack justify="space-between" align="start">
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Text fontSize="xl" fontWeight="bold">
                      Slot #{slot.slot_number}
                    </Text>
                    <Badge colorScheme={getStatusColor(slot.status)}>
                      {getStatusText(slot.status)}
                    </Badge>
                  </HStack>

                  {slot.car && (
                    <Box>
                      <Text fontWeight="semibold">
                        {slot.car.make || slot.car.brand} {slot.car.model}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Plaque: {slot.car.licensePlate || slot.car.license_plate}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Client: {slot.car.client?.name || 'Client inconnu'}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Couleur: {slot.car.color || 'Inconnue'}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Année: {slot.car.year || 'Inconnue'}
                      </Text>
                    </Box>
                  )}
                </VStack>

                <VStack spacing={2}>
                  {slot.status === 'available' && (
                    <Button
                      colorScheme="blue"
                      onClick={() => {
                        setSelectedSlot(slot);
                        onOpen();
                      }}
                    >
                      Ajouter une voiture
                    </Button>
                  )}

                  {slot.status === 'occupied' && slotRepairs[slot.id] && slotRepairs[slot.id].length > 0 && (
                    <Button
                      colorScheme="green"
                      size="sm"
                      onClick={() => {
                        // Les réparations sont déjà affichées ci-dessous
                      }}
                    >
                      Voir les réparations ({slotRepairs[slot.id].length})
                    </Button>
                  )}
                </VStack>
              </HStack>

              {/* Afficher les réparations si elles existent */}
              {slot.status === 'occupied' && slotRepairs[slot.id] && slotRepairs[slot.id].length > 0 && (
                <Box mt={4} p={4} bg="white" borderRadius="md" border="1px" borderColor="gray.200">
                  <Text fontWeight="semibold" mb={2}>Réparations en cours:</Text>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Intervention</Th>
                        <Th>Prix</Th>
                        <Th>Statut</Th>
                        <Th>Action</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {slotRepairs[slot.id].map((repair) => (
                        <Tr key={repair.id}>
                          <Td>{repair.interventionName}</Td>
                          <Td>{repair.interventionPrice}€</Td>
                          <Td>
                            <Badge colorScheme={
                              repair.status === 'pending' ? 'yellow' : 
                              repair.status === 'in_progress' ? 'blue' : 'green'
                            }>
                              {repair.status === 'pending' ? 'En attente' : 
                               repair.status === 'in_progress' ? 'En cours' : 'Terminé'}
                            </Badge>
                          </Td>
                          <Td>
                            {repair.status === 'pending' && (
                              <Button
                                colorScheme="green"
                                size="xs"
                                onClick={() => handleStartRepair(
                                  repair.id, 
                                  repair.interventionId, 
                                  repair.interventionDuration || 60
                                )}
                              >
                                Réparer
                              </Button>
                            )}
                            
                            {/* Barre de progression pour les réparations en cours */}
                            {repair.status === 'in_progress' && repairProgress[repair.id] && (
                              <Box w="200px">
                                <Text fontSize="xs" mb={1}>
                                  {repairProgress[repair.id].remaining}s restantes
                                </Text>
                                <Progress 
                                  value={repairProgress[repair.id].progress} 
                                  size="sm" 
                                  colorScheme="blue"
                                  hasStripe
                                  isAnimated
                                />
                              </Box>
                            )}
                            
                            {/* Badge pour les réparations terminées */}
                            {repair.status === 'completed' && (
                              <Badge colorScheme="green" variant="solid">
                                ✅ Terminé
                              </Badge>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </Box>
          ))}
        </VStack>

        {/* Section des voitures complétées */}
        {Object.keys(completedCars).length > 0 && (
          <Box mt={8} p={6} bg="green.50" borderRadius="lg" borderWidth="1px" borderColor="green.200">
            <Heading size="md" color="green.700" mb={4}>
              🎉 Voitures prêtes pour le paiement
            </Heading>
            
            {Object.entries(completedCars).map(([carId, carData]) => (
              <Box key={carId} p={4} bg="white" borderRadius="md" mb={4} shadow="sm">
                <VStack align="start" spacing={3}>
                  <HStack justify="space-between" w="100%">
                    <Text fontWeight="bold" fontSize="lg">Voiture: {carId}</Text>
                    <Badge colorScheme="green">{carData.interventions.length} interventions</Badge>
                  </HStack>
                  
                  <VStack align="start" spacing={2} w="100%">
                    <Text fontWeight="semibold">Interventions terminées:</Text>
                    {carData.interventions.map((intervention: any) => (
                      <HStack key={intervention.id} justify="space-between" w="100%" px={2}>
                        <Text fontSize="sm">• {intervention.interventionName}</Text>
                        <Text fontWeight="bold" color="green.600">{intervention.interventionPrice}€</Text>
                      </HStack>
                    ))}
                  </VStack>
                  
                  <Divider />
                  
                  <HStack justify="space-between" w="100%">
                    <Text fontSize="lg" fontWeight="bold">Total à payer:</Text>
                    <Text fontSize="xl" fontWeight="bold" color="green.600">{carData.totalPrice}€</Text>
                  </HStack>
                  
                  <Button
                    colorScheme="green"
                    size="lg"
                    w="100%"
                    onClick={() => moveToWaitingSlots(carId)}
                    leftIcon={<span>🚗</span>}
                  >
                    Mettre en attente de paiement
                  </Button>
                </VStack>
              </Box>
            ))}
          </Box>
        )}

        {/* Modal pour ajouter une voiture */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Ajouter une voiture au Slot #{selectedSlot?.slot_number}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Text>
                  Sélectionnez une voiture avec des réparations en attente:
                </Text>
                <Select
                  placeholder="Choisir une voiture"
                  value={selectedCar}
                  onChange={(e) => setSelectedCar(e.target.value)}
                >
                  {carsWithRepairs
                    .filter(car => car.repairs.length > 0)
                    .map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.make || car.brand} {car.model} ({car.license_plate}) - {car.client_name || (car.client?.name || 'Client inconnu')} - {car.repairs.length} réparations
                      </option>
                    ))}
                </Select>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" mr={3} onClick={onClose}>
                Annuler
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleAddCarToSlot}
                isLoading={submitting}
                isDisabled={!selectedCar}
              >
                Ajouter au slot
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Container>
  );
};

export default SlotsPage;
