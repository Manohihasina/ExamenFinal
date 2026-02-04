/* eslint-disable @typescript-eslint/no-unused-vars */
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
} from '@chakra-ui/react';
import { useToast } from '@chakra-ui/react';
import { repairSlotService, type RepairSlot, type CarWithRepairs } from '../services/repairSlotService';

const SlotsPage: React.FC = () => {
  const [slots, setSlots] = useState<RepairSlot[]>([]);
  const [carsWithRepairs, setCarsWithRepairs] = useState<CarWithRepairs[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<RepairSlot | null>(null);
  const [selectedCar, setSelectedCar] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [slotRepairs, setSlotRepairs] = useState<{ [key: number]: Repair[] }>({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Charger les réparations pour un slot spécifique
  const loadSlotRepairs = async (slot: RepairSlot) => {
    if (!slot.car_id || slotRepairs[slot.id]) return;
    
    try {
      console.log('🔍 [DEBUG] Chargement réparations pour slot:', slot.id, 'car:', slot.car_id);
      const repairs = await repairSlotService.getCarRepairs(slot.car_id.toString());
      setSlotRepairs(prev => ({ ...prev, [slot.id]: repairs }));
    } catch (error) {
      console.error('❌ Erreur chargement réparations slot:', error);
    }
  };

  // Charger les slots et les voitures avec réparations
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log('🔍 [DEBUG] Début fetchData() dans SlotsPage');
    
    try {
      // Charger les slots depuis Firebase (priorité) ou API Laravel (fallback)
      console.log('🔍 [DEBUG] Appel getRepairSlots()...');
      const slotsData = await repairSlotService.getRepairSlots();
      console.log('🔍 [DEBUG] Slots reçus:', slotsData.length, 'slots');
      setSlots(slotsData);
      
      // Charger les réparations pour les slots occupés
      for (const slot of slotsData) {
        if (slot.status === 'occupied' && slot.car_id) {
          await loadSlotRepairs(slot);
        }
      }

      // Charger les voitures avec réparations depuis API Laravel
      console.log('🔍 [DEBUG] Appel getCarsWithRepairs()...');
      const carsData = await repairSlotService.getCarsWithRepairs();
      console.log('🔍 [DEBUG] Cars reçus:', carsData.length, 'voitures');
      if (carsData.length > 0) {
        console.log('🔍 [DEBUG] Structure des données voitures:', JSON.stringify(carsData[0], null, 2));
        console.log('🔍 [DEBUG] Type de ID:', typeof carsData[0].id);
        console.log('🔍 [DEBUG] Valeur ID:', carsData[0].id);
      }
      setCarsWithRepairs(carsData);

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
  };

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

  const handleStartRepair = async (repairId: string) => {
    try {
      await repairSlotService.startRepair(repairId);
      
      toast({
        title: 'Succès',
        description: 'Réparation démarrée',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchData(); // Recharger les données
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
                            <Badge colorScheme={repair.status === 'pending' ? 'yellow' : 'green'}>
                              {repair.status === 'pending' ? 'En attente' : 'En cours'}
                            </Badge>
                          </Td>
                          <Td>
                            {repair.status === 'pending' && (
                              <Button
                                colorScheme="green"
                                size="xs"
                                onClick={() => handleStartRepair(repair.id)}
                              >
                                Réparer
                              </Button>
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
