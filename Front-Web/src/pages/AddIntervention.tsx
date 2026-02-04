import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Switch,
  useToast,
  Heading,
  VStack,
  HStack,
  Text,
} from '@chakra-ui/react';
import { ref, set, get } from 'firebase/database';
import { database } from '../firebase/config';

interface InterventionFormData {
  name: string;
  price: number;
  duration_seconds: number;
  description: string;
  is_active: boolean;
}

const AddIntervention: React.FC = () => {
  const [formData, setFormData] = useState<InterventionFormData>({
    name: '',
    price: 0,
    duration_seconds: 3600, // 1 heure par défaut
    description: '',
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleChange = (field: keyof InterventionFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom de l\'intervention est requis',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      // Créer l'intervention directement dans Firebase
      const interventionsRef = ref(database, 'interventions');
      const snapshot = await get(interventionsRef);
      
      let newId: string;
      if (snapshot.exists()) {
        const interventions = snapshot.val();
        const maxId = Math.max(...Object.keys(interventions).map(key => parseInt(key)));
        newId = (maxId + 1).toString();
      } else {
        newId = '1';
      }

      const interventionData = {
        name: formData.name,
        price: formData.price,
        duration: formData.duration_seconds,
        description: formData.description,
        is_active: formData.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin' // Admin par défaut
      };

      await set(ref(database, `interventions/${newId}`), interventionData);

      toast({
        title: 'Succès',
        description: 'Intervention créée avec succès dans Firebase',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Réinitialiser le formulaire
      setFormData({
        name: '',
        price: 0,
        duration_seconds: 0,
        description: '',
        is_active: true,
      });

    } catch (error) {
      console.error('Erreur création intervention:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'intervention',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  return (
    <Container maxW="container.md" py={8}>
      <Box bg="white" p={8} borderRadius="lg" boxShadow="md">
        <Heading size="lg" mb={6} color="gray.800">
          Ajouter une nouvelle intervention
        </Heading>

        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            {/* Nom de l'intervention */}
            <FormControl isRequired>
              <FormLabel>Nom de l'intervention</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Vidange, Changement de pneus..."
                size="lg"
              />
            </FormControl>

            {/* Prix */}
            <FormControl isRequired>
              <FormLabel>Prix (€)</FormLabel>
              <NumberInput
                value={formData.price}
                onChange={(value) => handleChange('price', parseFloat(value) || 0)}
                min={0}
                precision={2}
                step={5}
              >
                <NumberInputField placeholder="0.00" size="lg" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            {/* Durée */}
            <FormControl isRequired>
              <FormLabel>
                Durée estimée: <Text as="span" color="blue.600" fontWeight="bold">
                  {formatDuration(formData.duration_seconds)}
                </Text>
              </FormLabel>
              <NumberInput
                value={formData.duration_seconds}
                onChange={(value) => handleChange('duration_seconds', parseInt(value) || 60)}
                min={60}
                step={300} // 5 minutes
              >
                <NumberInputField placeholder="3600" size="lg" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Text fontSize="sm" color="gray.600" mt={1}>
                Durée en secondes (minimum: 60 secondes)
              </Text>
            </FormControl>

            {/* Description */}
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Description détaillée de l'intervention..."
                rows={4}
                resize="vertical"
              />
            </FormControl>

            {/* Statut actif */}
            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Intervention active</FormLabel>
              <Switch
                isChecked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                colorScheme="green"
              />
            </FormControl>

            {/* Boutons d'action */}
            <HStack spacing={4} pt={4}>
              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                isLoading={loading}
                loadingText="Création..."
                flex={1}
              >
                Créer l'intervention
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setFormData({
                  name: '',
                  price: 0,
                  duration_seconds: 3600,
                  description: '',
                  is_active: true,
                })}
                disabled={loading}
              >
                Réinitialiser
              </Button>
            </HStack>
          </VStack>
        </form>
      </Box>

      {/* Informations supplémentaires */}
      <Box mt={6} p={4} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
        <Text fontSize="sm" color="blue.800">
          <strong>Information:</strong> Cette intervention sera automatiquement synchronisée 
          avec Firebase Firestore après sa création dans la base de données MySQL.
        </Text>
      </Box>
    </Container>
  );
};

export default AddIntervention;
