
import { Box, Heading, Text, VStack, HStack, Button, Image, Container, Divider, Alert, AlertIcon, useClipboard, SimpleGrid, Badge, useColorModeValue } from '@chakra-ui/react';
import { ExternalLinkIcon, DownloadIcon, CopyIcon, CheckIcon, EmailIcon, PhoneIcon, AtSignIcon } from '@chakra-ui/icons';

const MobileAppPage = () => {
  const { hasCopied, onCopy } = useClipboard('https://pro-app-storage.s3.amazonaws.com/builds/9ae358b3-041c-4b29-a4dd-633b07e1d051-debug.apk?AWSAccessKeyId=ASIAUUWEHETW3WJGTZDX&Signature=1rAdEBxmCLUzJuvQfRJn271mx1E%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEMr%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQCWZVtHTXZJ8YMplfDoGnr%2B4o%2BlFaDe5Ccinn%2BOsnccRAIhALJpYcuM6H3QWKtU66Jn6zBKH27HtNFjNVKW7ZTp7ezaKqQECJP%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMMzE5MzEyODMxNzI1IgxMwsKosr9j3%2FNh6jYq%2BAPklMvbJ1aSvKS4Byf5LqHD6PLp7L1%2BY%2F3U8tF2CVE3RAV1FZ2tJIYC%2BFIEf5zqQcvFrx7AlrHaWGWj%2BESEjJNDnhyygqFtKVgMVjTv2K%2BPBxtI0FB%2FHF3sox6fPd%2F33gDWZr8c3NRFYhQv4XuKT0VnHR68%2Bn3RFyQCnEsczn9rjUY%2FWlQFZYt3ONgpGyG%2BD99kHFBH6wiBojD0mavRJsI0TPGoD1gvTuhZD9lwWaIj5CTeBJH2EBaAR4CWeFTlmiuvVUzt%2FJbianwvgGgzQKTYNn0ooRCyiT0wm0Wrm7AqHdn%2FIEpCtbN7TFJ0HY%2BiykB17f7iw9WCLBuSrEU2RnJu3EpDUoVQCPsiEvdvUt1qDmrjgFG%2FGP9S8ELkljh4OntjAIwt5oHuyvZhBipNBYofY4Z%2Bwi3aJ3TDpWSHP04GTgnJuEghx0rhsG25ciTULSfyVyBzwTB3FfWT6rWDiK7Vlpw7DwgYh08L3PtCdoa1cgPlscTT3C4HOzsZ6ebvUlK8F0bjRvIGhFdPZMSLqora7Y4xZkWs7HHKLVrLJe2nFZi8oLWhKnywPDDVUbhIFOPG9EjIokwtlGhZpQ68rsnGha9xCf9i6T%2Bu6j1Zl%2B73Lr%2FhGRwQumooBbJbNpdmwph0PvAhxPFeR4oX1II3hiPEdl%2Bf%2F9AjusAwxsCozAY6pQG%2FBcLOqpBs2SprM6ZqdPII37HyMueiNepPIUDA5EZARExJU7kRO3vb0xIV85hovU1ggcjNiOrC%2BRfrw3BrTotHuwFe7kXjIIW9sp2jwBkde7zbsbpyWG%2Bx1ztEjX0u3DvV%2FJ3vCMryJA4PfFYohg6Id%2Bte6zX%2B2WLPHuVjXwiSxVsYrb678DToDGxTfytmbizld5Zu%2BVggNfhRbiywfTRLNC0xhcI%3D&Expires=1770678204');

  const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://pro-app-storage.s3.amazonaws.com/builds/9ae358b3-041c-4b29-a4dd-633b07e1d051-debug.apk?AWSAccessKeyId=ASIAUUWEHETW3WJGTZDX&Signature=1rAdEBxmCLUzJuvQfRJn271mx1E%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEMr%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQCWZVtHTXZJ8YMplfDoGnr%2B4o%2BlFaDe5Ccinn%2BOsnccRAIhALJpYcuM6H3QWKtU66Jn6zBKH27HtNFjNVKW7ZTp7ezaKqQECJP%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMMzE5MzEyODMxNzI1IgxMwsKosr9j3%2FNh6jYq%2BAPklMvbJ1aSvKS4Byf5LqHD6PLp7L1%2BY%2F3U8tF2CVE3RAV1FZ2tJIYC%2BFIEf5zqQcvFrx7AlrHaWGWj%2BESEjJNDnhyygqFtKVgMVjTv2K%2BPBxtI0FB%2FHF3sox6fPd%2F33gDWZr8c3NRFYhQv4XuKT0VnHR68%2Bn3RFyQCnEsczn9rjUY%2FWlQFZYt3ONgpGyG%2BD99kHFBH6wiBojD0mavRJsI0TPGoD1gvTuhZD9lwWaIj5CTeBJH2EBaAR4CWeFTlmiuvVUzt%2FJbianwvgGgzQKTYNn0ooRCyiT0wm0Wrm7AqHdn%2FIEpCtbN7TFJ0HY%2BiykB17f7iw9WCLBuSrEU2RnJu3EpDUoVQCPsiEvdvUt1qDmrjgFG%2FGP9S8ELkljh4OntjAIwt5oHuyvZhBipNBYofY4Z%2Bwi3aJ3TDpWSHP04GTgnJuEghx0rhsG25ciTULSfyVyBzwTB3FfWT6rWDiK7Vlpw7DwgYh08L3PtCdoa1cgPlscTT3C4HOzsZ6ebvUlK8F0bjRvIGhFdPZMSLqora7Y4xZkWs7HHKLVrLJe2nFZi8oLWhKnywPDDVUbhIFOPG9EjIokwtlGhZpQ68rsnGha9xCf9i6T%2Bu6j1Zl%2B73Lr%2FhGRwQumooBbJbNpdmwph0PvAhxPFeR4oX1II3hiPEdl%2Bf%2F9AjusAwxsCozAY6pQG%2FBcLOqpBs2SprM6ZqdPII37HyMueiNepPIUDA5EZARExJU7kRO3vb0xIV85hovU1ggcjNiOrC%2BRfrw3BrTotHuwFe7kXjIIW9sp2jwBkde7zbsbpyWG%2Bx1ztEjX0u3DvV%2FJ3vCMryJA4PfFYohg6Id%2Bte6zX%2B2WLPHuVjXwiSxVsYrb678DToDGxTfytmbizld5Zu%2BVggNfhRbiywfTRLNC0xhcI%3D&Expires=1770678204';

  const appUrl = 'https://pro-app-storage.s3.amazonaws.com/builds/9ae358b3-041c-4b29-a4dd-633b07e1d051-debug.apk?AWSAccessKeyId=ASIAUUWEHETW3WJGTZDX&Signature=1rAdEBxmCLUzJuvQfRJn271mx1E%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEMr%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQCWZVtHTXZJ8YMplfDoGnr%2B4o%2BlFaDe5Ccinn%2BOsnccRAIhALJpYcuM6H3QWKtU66Jn6zBKH27HtNFjNVKW7ZTp7ezaKqQECJP%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMMzE5MzEyODMxNzI1IgxMwsKosr9j3%2FNh6jYq%2BAPklMvbJ1aSvKS4Byf5LqHD6PLp7L1%2BY%2F3U8tF2CVE3RAV1FZ2tJIYC%2BFIEf5zqQcvFrx7AlrHaWGWj%2BESEjJNDnhyygqFtKVgMVjTv2K%2BPBxtI0FB%2FHF3sox6fPd%2F33gDWZr8c3NRFYhQv4XuKT0VnHR68%2Bn3RFyQCnEsczn9rjUY%2FWlQFZYt3ONgpGyG%2BD99kHFBH6wiBojD0mavRJsI0TPGoD1gvTuhZD9lwWaIj5CTeBJH2EBaAR4CWeFTlmiuvVUzt%2FJbianwvgGgzQKTYNn0ooRCyiT0wm0Wrm7AqHdn%2FIEpCtbN7TFJ0HY%2BiykB17f7iw9WCLBuSrEU2RnJu3EpDUoVQCPsiEvdvUt1qDmrjgFG%2FGP9S8ELkljh4OntjAIwt5oHuyvZhBipNBYofY4Z%2Bwi3aJ3TDpWSHP04GTgnJuEghx0rhsG25ciTULSfyVyBzwTB3FfWT6rWDiK7Vlpw7DwgYh08L3PtCdoa1cgPlscTT3C4HOzsZ6ebvUlK8F0bjRvIGhFdPZMSLqora7Y4xZkWs7HHKLVrLJe2nFZi8oLWhKnywPDDVUbhIFOPG9EjIokwtlGhZpQ68rsnGha9xCf9i6T%2Bu6j1Zl%2B73Lr%2FhGRwQumooBbJbNpdmwph0PvAhxPFeR4oX1II3hiPEdl%2Bf%2F9AjusAwxsCozAY6pQG%2FBcLOqpBs2SprM6ZqdPII37HyMueiNepPIUDA5EZARExJU7kRO3vb0xIV85hovU1ggcjNiOrC%2BRfrw3BrTotHuwFe7kXjIIW9sp2jwBkde7zbsbpyWG%2Bx1ztEjX0u3DvV%2FJ3vCMryJA4PfFYohg6Id%2Bte6zX%2B2WLPHuVjXwiSxVsYrb678DToDGxTfytmbizld5Zu%2BVggNfhRbiywfTRLNC0xhcI%3D&Expires=1770678204';

  const bgGradient = useColorModeValue(
    'linear(to-br, gray.900, gray.800, gray.900)',
    'linear(to-br, gray.900, gray.800, gray.900)'
  );
  const cardBg = useColorModeValue('gray.800', 'gray.800');
  const borderColor = useColorModeValue('gray.700', 'gray.700');
  const textColor = useColorModeValue('gray.100', 'gray.100');
  const mutedColor = useColorModeValue('gray.400', 'gray.400');

  return (
    <Box bg={bgGradient} minH="100vh" py={12}>
      <Container maxW="6xl" px={4}>
      <VStack spacing={8} align="center">
        {/* Header */}
        <Box textAlign="center" mb={12}>
          <VStack spacing={6}>
            <Box
              bg="linear(135deg, blue.600, purple.600)"
              p={6}
              borderRadius="2xl"
              boxShadow="0 20px 40px rgba(0,0,0,0.3)"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="-50%"
                right="-50%"
                w="200%"
                h="200%"
                bg="linear(45deg, transparent, rgba(255,255,255,0.1), transparent)"
                animation="shimmer 2s infinite"
              />
              <Heading size="3xl" color="white" fontWeight="bold" position="relative" zIndex={1}>
                🚗 Garage Manager Pro
              </Heading>
              <Text fontSize="xl" color="gray.200" mt={2} position="relative" zIndex={1}>
                Application Mobile Professionnelle
              </Text>
            </Box>
            <Text fontSize="lg" color={mutedColor} maxW="2xl" mx="auto">
              Gérez votre garage comme jamais auparavant. Scannez le QR code pour accéder à l'application mobile.
            </Text>
          </VStack>
        </Box>

        {/* QR Code Section */}
        <Box 
          bg={cardBg} 
          p={10} 
          borderRadius="2xl" 
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          borderWidth={2}
          borderColor={borderColor}
          mb={12}
          position="relative"
          overflow="hidden"
        >
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            h="2px"
            bg="linear(90deg, blue.500, purple.500, blue.500)"
            bgSize="200% 100%"
            animation="gradient 3s ease infinite"
          />
          <VStack spacing={8}>
            <Box textAlign="center">
              <Badge 
                colorScheme="blue" 
                fontSize="md" 
                px={4} 
                py={2} 
                borderRadius="full"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                QR Code de Téléchargement
              </Badge>
            </Box>
            
            <Box 
              position="relative"
              p={4}
              bg="white"
              borderRadius="xl"
              boxShadow="0 10px 30px rgba(0,0,0,0.2)"
            >
              <Image 
                src={qrCodeUrl}
                alt="QR Code pour télécharger l'application mobile"
                boxSize="280px"
                objectFit="contain"
                borderRadius="lg"
              />
              <Box
                position="absolute"
                top="-2px"
                left="-2px"
                right="-2px"
                bottom="-2px"
                bg="linear(45deg, blue.500, purple.500)"
                borderRadius="xl"
                zIndex="-1"
                opacity="0.8"
              />
            </Box>
            
            <Alert 
              status="info" 
              borderRadius="lg" 
              bg="gray.700"
              border="1px solid"
              borderColor="blue.500"
            >
              <AlertIcon color="blue.400" />
              <Text color={textColor} fontSize="md">
                Scannez ce QR code avec votre téléphone pour télécharger l'application
              </Text>
            </Alert>
          </VStack>
        </Box>

        {/* Download Options */}
        <Box w="full" mb={12}>
          <VStack spacing={8}>
            <Box textAlign="center">
              <Heading size="2xl" color="white" fontWeight="bold">
                Options de Téléchargement
              </Heading>
              <Text color={mutedColor} mt={2}>
                Choisissez la méthode qui vous convient le mieux
              </Text>
            </Box>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
              <Button
                leftIcon={<DownloadIcon />}
                bg="linear(135deg, blue.600, blue.700)"
                color="white"
                size="lg"
                py={6}
                borderRadius="xl"
                fontWeight="bold"
                fontSize="md"
                boxShadow="0 10px 25px rgba(59, 130, 246, 0.3)"
                _hover={{ 
                  bg: 'linear(135deg, blue.700, blue.800)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 15px 35px rgba(59, 130, 246, 0.4)'
                }}
                _active={{ transform: 'translateY(0)' }}
                onClick={() => window.open(appUrl, '_blank')}
                transition="all 0.3s ease"
              >
                Télécharger Directement
              </Button>
              
              <Button
                leftIcon={hasCopied ? <CheckIcon /> : <CopyIcon />}
                bg={hasCopied ? "linear(135deg, green.600, green.700)" : "linear(135deg, gray.600, gray.700)"}
                color="white"
                size="lg"
                py={6}
                borderRadius="xl"
                fontWeight="bold"
                fontSize="md"
                boxShadow={hasCopied ? "0 10px 25px rgba(34, 197, 94, 0.3)" : "0 10px 25px rgba(107, 114, 128, 0.3)"}
                _hover={{ 
                  bg: hasCopied ? "linear(135deg, green.700, green.800)" : "linear(135deg, gray.700, gray.800)",
                  transform: 'translateY(-2px)',
                  boxShadow: hasCopied ? "0 15px 35px rgba(34, 197, 94, 0.4)" : "0 15px 35px rgba(107, 114, 128, 0.4)"
                }}
                _active={{ transform: 'translateY(0)' }}
                onClick={onCopy}
                transition="all 0.3s ease"
              >
                {hasCopied ? '✓ Lien Copié!' : 'Copier le Lien'}
              </Button>
              
              <Button
                leftIcon={<ExternalLinkIcon />}
                bg="linear(135deg, purple.600, purple.700)"
                color="white"
                size="lg"
                py={6}
                borderRadius="xl"
                fontWeight="bold"
                fontSize="md"
                boxShadow="0 10px 25px rgba(147, 51, 234, 0.3)"
                _hover={{ 
                  bg: 'linear(135deg, purple.700, purple.800)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 15px 35px rgba(147, 51, 234, 0.4)'
                }}
                _active={{ transform: 'translateY(0)' }}
                onClick={() => window.open(appUrl, '_blank')}
                transition="all 0.3s ease"
              >
                Ouvrir dans le Navigateur
              </Button>
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Instructions */}
        <Box w="full" mb={12}>
          <VStack spacing={8}>
            <Box textAlign="center">
              <Heading size="2xl" color="white" fontWeight="bold">
                📋 Guide d'Installation
              </Heading>
              <Text color={mutedColor} mt={2}>
                Suivez ces étapes simples pour installer l'application
              </Text>
            </Box>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} w="full">
              <StepCard 
                number="1" 
                title="Scanner" 
                description="Scannez le QR code avec l'appareil photo de votre téléphone"
              />
              <StepCard 
                number="2" 
                title="Télécharger" 
                description="Cliquez sur le lien qui apparaît pour télécharger le fichier .apk"
              />
              <StepCard 
                number="3" 
                title="Autoriser" 
                description="Autorisez l'installation d'applications provenant de sources inconnues"
              />
              <StepCard 
                number="4" 
                title="Installer" 
                description="Installez l'application et profitez de toutes les fonctionnalités !"
              />
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Features */}
        <Box w="full" mb={12}>
          <VStack spacing={8}>
            <Box textAlign="center">
              <Heading size="2xl" color="white" fontWeight="bold">
                ✨ Fonctionnalités Premium
              </Heading>
              <Text color={mutedColor} mt={2}>
                Tout ce dont vous avez besoin pour gérer votre garage efficacement
              </Text>
            </Box>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="full">
              <FeatureCard 
                icon="🚗" 
                title="Gestion des Véhicules" 
                description="Suivez tous les véhicules clients avec informations détaillées"
              />
              <FeatureCard 
                icon="🔧" 
                title="Réparations" 
                description="Suivi en temps réel des réparations et interventions"
              />
              <FeatureCard 
                icon="💰" 
                title="Paiements" 
                description="Gestion complète des paiements et facturation"
              />
              <FeatureCard 
                icon="📅" 
                title="Rendez-vous" 
                description="Prise de rendez-vous simplifiée et automatisée"
              />
              <FeatureCard 
                icon="🔔" 
                title="Notifications" 
                description="Alertes automatiques pour clients et techniciens"
              />
              <FeatureCard 
                icon="📊" 
                title="Statistiques" 
                description="Rapports détaillés et analyses de performance"
              />
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Support */}
        <Box w="full" mb={12}>
          <Box 
            bg="linear(135deg, green.600, green.700)"
            p={8} 
            borderRadius="2xl"
            boxShadow="0 20px 40px rgba(0,0,0,0.3)"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top="-50%"
              right="-50%"
              w="200%"
              h="200%"
              bg="linear(45deg, transparent, rgba(255,255,255,0.1), transparent)"
              animation="shimmer 2s infinite"
            />
            <VStack spacing={4} position="relative" zIndex={1}>
              <Heading size="xl" color="white" textAlign="center">
                🎯 Support Technique
              </Heading>
              <Text color="gray.200" textAlign="center" fontSize="lg">
                Notre équipe est là pour vous aider à chaque étape
              </Text>
              <HStack spacing={8} justify="center" mt={4}>
                <VStack>
                  <PhoneIcon color="white" boxSize={6} />
                  <Text color="white" fontWeight="bold">Téléphone</Text>
                  <Text color="gray.200">+261 34 12 345 67</Text>
                </VStack>
                <VStack>
                  <EmailIcon color="white" boxSize={6} />
                  <Text color="white" fontWeight="bold">Email</Text>
                  <Text color="gray.200">support@garagepro.com</Text>
                </VStack>
                <VStack>
                  <AtSignIcon color="white" boxSize={6} />
                  <Text color="white" fontWeight="bold">Localisation</Text>
                  <Text color="gray.200">Antananarivo, MG</Text>
                </VStack>
              </HStack>
            </VStack>
          </Box>
        </Box>

        <Divider borderColor={borderColor} />
        
        <VStack spacing={4}>
          <HStack spacing={4}>
            <Badge colorScheme="blue" fontSize="sm">Version Debug</Badge>
            <Badge colorScheme="purple" fontSize="sm">Build 2024.02.09</Badge>
            <Badge colorScheme="green" fontSize="sm">Production Ready</Badge>
          </HStack>
          <Text fontSize="sm" color={mutedColor} textAlign="center">
            © 2024 Garage Manager Pro. Tous droits réservés.
          </Text>
        </VStack>
      </VStack>
      </Container>
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </Box>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => {
  return (
    <Box
      bg="gray.800"
      p={6}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.700"
      boxShadow="0 10px 25px rgba(0,0,0,0.2)"
      transition="all 0.3s ease"
      _hover={{ 
        transform: 'translateY(-5px)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        borderColor: 'blue.500'
      }}
    >
      <VStack spacing={4} align="start">
        <Text fontSize="3xl">{icon}</Text>
        <Heading size="md" color="white" fontWeight="bold">
          {title}
        </Heading>
        <Text color="gray.400" fontSize="sm" lineHeight="tall">
          {description}
        </Text>
      </VStack>
    </Box>
  );
};

// Step Card Component
const StepCard = ({ number, title, description }: { number: string; title: string; description: string }) => {
  return (
    <VStack spacing={4} align="center" textAlign="center">
      <Box
        w="60px"
        h="60px"
        bg="linear(135deg, blue.600, purple.600)"
        borderRadius="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
        boxShadow="0 10px 25px rgba(59, 130, 246, 0.3)"
      >
        <Text fontSize="2xl" fontWeight="bold" color="white">
          {number}
        </Text>
      </Box>
      <VStack spacing={2}>
        <Heading size="sm" color="white" fontWeight="bold">
          {title}
        </Heading>
        <Text color="gray.400" fontSize="sm" lineHeight="tall">
          {description}
        </Text>
      </VStack>
    </VStack>
  );
};

export default MobileAppPage;
