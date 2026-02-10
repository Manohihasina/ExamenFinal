import axios from 'axios';
import { getDatabase, ref, get } from 'firebase/database';
import type { Client, FirebaseAuthUser, Car, Repair, Intervention, RepairSlot, WaitingSlot, DashboardStats, RepairWithDetails, CarWithClient } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 10 seconds timeout
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export const apiService = {
  // Récupérer les repairs depuis Firebase Realtime Database
  async getRepairsFromRealtime(): Promise<Repair[]> {
    try {
      console.log('🔥 [DEBUG] Récupération des repairs depuis Firebase Realtime Database...');
      
      const database = getDatabase();
      const repairsRef = ref(database, 'repairs');
      const snapshot = await get(repairsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const repairs: Repair[] = [];
        
        Object.keys(data).forEach(key => {
          const repair = data[key];
          if (repair && typeof repair === 'object' && key !== 'slots') { // Exclure la clé 'slots'
            repairs.push({
              id: parseInt(key),
              car_id: repair.carId || '',
              intervention_id: repair.interventionId || 0,
              status: repair.status || 'pending',
              started_at: repair.startedAt || null,
              completed_at: repair.completedAt || null,
              created_at: repair.createdAt || new Date().toISOString(),
              updated_at: repair.updatedAt || new Date().toISOString()
            });
          }
        });
        
        console.log('✅ [DEBUG] Repairs récupérés depuis Realtime Database:', repairs.length);
        return repairs;
      } else {
        console.log('🔍 [DEBUG] Aucun repair trouvé dans Realtime Database');
        return [];
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erreur lors de la récupération des repairs depuis Realtime Database:', error);
      return [];
    }
  },

  // Récupérer les interventions depuis Firebase Realtime Database
  async getInterventionsFromRealtime(): Promise<Intervention[]> {
    try {
      console.log('🔥 [DEBUG] Récupération des interventions depuis Firebase Realtime Database...');
      
      const database = getDatabase();
      const interventionsRef = ref(database, 'interventions');
      const snapshot = await get(interventionsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const interventions: Intervention[] = [];
        
        Object.keys(data).forEach(key => {
          const intervention = data[key];
          if (intervention && typeof intervention === 'object') {
            interventions.push({
              id: parseInt(key), // Convertir la clé string en number
              name: intervention.name || '',
              price: typeof intervention.price === 'number' ? intervention.price : parseFloat(String(intervention.price || 0)),
              duration_seconds: typeof intervention.duration_seconds === 'number' ? intervention.duration_seconds : parseInt(String(intervention.duration_seconds || 0)),
              description: intervention.description || '',
              is_active: intervention.is_active !== false, // Par défaut actif
              created_at: intervention.created_at || intervention.createdAt || new Date().toISOString(),
              updated_at: intervention.updated_at || intervention.updatedAt || new Date().toISOString()
            });
          }
        });
        
        console.log('✅ [DEBUG] Interventions récupérées depuis Realtime Database:', interventions.length);
        return interventions;
      } else {
        console.log('🔍 [DEBUG] Aucune intervention trouvée dans Realtime Database');
        return [];
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erreur lors de la récupération des interventions depuis Realtime Database:', error);
      return [];
    }
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('📊 Fetching dashboard stats...');
      
      const [clientsResponse] = await Promise.all([
        api.get<FirebaseAuthUser[]>('/clients/firebase').catch(async (err) => {
          console.warn('⚠️ Failed to fetch clients from Firebase Auth:', err.message);
          try {
            const fallback = await api.get<Client[]>('/clients');
            return fallback;
          } catch (fallbackErr) {
            console.warn('⚠️ Failed to fetch clients from SQL fallback:', fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr));
            return { data: [] };
          }
        })
      ]);

      const clients = clientsResponse.data;

      // Récupérer les repairs et interventions directement depuis Firebase Realtime Database
      const [repairs, interventions] = await Promise.all([
        this.getRepairsFromRealtime(),
        this.getInterventionsFromRealtime()
      ]);
      
      console.log('🔥 [DEBUG] Repairs depuis Realtime Database:', repairs.length);
      console.log('🔥 [DEBUG] Interventions depuis Realtime Database:', interventions.length);

      console.log('📈 Raw data:', { clients: clients.length, repairs: repairs.length, interventions: interventions.length });

      const repairsInProgress = repairs.filter(r => r.status === 'in_progress').length;
      const repairsCompleted = repairs.filter(r => r.status === 'completed').length;
      const repairsPending = repairs.filter(r => r.status === 'pending').length;
      const repairsCancelled = repairs.filter(r => r.status === 'cancelled').length;
      
      const totalInterventionsAmount = interventions.reduce((sum, intervention) => {
        const price = typeof intervention.price === 'number' ? intervention.price : parseFloat(String(intervention.price || '0'));
        return sum + (isNaN(price) ? 0 : price);
      }, 0);

      // Calculate repairs by month for chart
      const repairsByMonth = repairs.reduce((acc: Record<string, number>, repair) => {
        let date: Date;
        
        // Gérer différents formats de date
        if (typeof repair.updated_at === 'string') {
          date = new Date(repair.updated_at);
        } else if (typeof repair.updated_at === 'number') {
          // Convertir timestamp Unix en millisecondes si nécessaire
          const timestamp = repair.updated_at > 1000000000000 ? repair.updated_at : repair.updated_at * 1000;
          date = new Date(timestamp);
        } else {
          // Valeur par défaut
          date = new Date();
        }
        
        // Vérifier si la date est valide
        if (isNaN(date.getTime())) {
          console.warn('⚠️ [DEBUG] Date invalide pour repair:', repair.id, repair.updated_at);
          return acc; // Ignorer ce repair
        }
        
        const month = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      // Calculate interventions by price range
      const interventionsByPrice = interventions.reduce((acc: Record<string, number>, intervention) => {
        const price = typeof intervention.price === 'number' ? intervention.price : parseFloat(String(intervention.price || '0'));
        if (price < 50) acc['Moins de 50€'] = (acc['Moins de 50€'] || 0) + 1;
        else if (price < 100) acc['50-100€'] = (acc['50-100€'] || 0) + 1;
        else if (price < 200) acc['100-200€'] = (acc['100-200€'] || 0) + 1;
        else acc['Plus de 200€'] = (acc['Plus de 200€'] || 0) + 1;
        return acc;
      }, {});

      const stats = {
        total_clients: clients.length,
        repairs_in_progress: repairsInProgress,
        repairs_completed: repairsCompleted,
        repairs_pending: repairsPending,
        repairs_cancelled: repairsCancelled,
        total_interventions_amount: totalInterventionsAmount,
        repairs_by_month: repairsByMonth,
        interventions_by_price: interventionsByPrice
      };

      console.log('📊 Final stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Dashboard stats error:', error);
      throw new Error('Erreur lors de la récupération des statistiques du tableau de bord');
    }
  },

  // Clients
  async getClients(): Promise<FirebaseAuthUser[]> {
    try {
      console.log('👥 Fetching clients...');
      const response = await api.get<FirebaseAuthUser[]>('/clients/firebase');
      console.log(`✅ Found ${response.data.length} clients`);
      return response.data;
    } catch (error) {
      console.error('❌ Clients fetch error:', error);
      throw new Error('Erreur lors du chargement des clients');
    }
  },

  async getFirebaseClients(): Promise<FirebaseAuthUser[]> {
    try {
      console.log('👥 Fetching clients from Firebase Auth...');
      const response = await api.get<FirebaseAuthUser[]>('/clients/firebase');
      console.log(`✅ Found ${response.data.length} firebase users`);
      return response.data;
    } catch (error) {
      console.error('❌ Firebase clients fetch error:', error);
      throw new Error('Erreur lors du chargement des clients Firebase');
    }
  },

  async getClient(id: number): Promise<Client> {
    try {
      const response = await api.get<Client>(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Client ${id} fetch error:`, error);
      throw new Error('Erreur lors du chargement du client');
    }
  },

  async createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    try {
      const response = await api.post<Client>('/clients', client);
      return response.data;
    } catch (error) {
      console.error('❌ Client creation error:', error);
      throw new Error('Erreur lors de la création du client');
    }
  },

  async updateClient(id: number, client: Partial<Client>): Promise<Client> {
    try {
      const response = await api.put<Client>(`/clients/${id}`, client);
      return response.data;
    } catch (error) {
      console.error(`❌ Client ${id} update error:`, error);
      throw new Error('Erreur lors de la mise à jour du client');
    }
  },

  async deleteClient(id: number): Promise<void> {
    try {
      await api.delete(`/clients/${id}`);
    } catch (error) {
      console.error(`❌ Client ${id} deletion error:`, error);
      throw new Error('Erreur lors de la suppression du client');
    }
  },

  // Cars
  async getCars(): Promise<CarWithClient[]> {
    try {
      console.log('🚗 Fetching cars...');
      const response = await api.get<Car[]>('/cars');
      const cars = response.data;
      console.log(`✅ Found ${cars.length} cars`);
      
      // Fetch client details for each car
      const carsWithClients = await Promise.all(
        cars.map(async (car) => {
          try {
            const clientResponse = await api.get<Client>(`/clients/${car.client_id}`);
            return {
              ...car,
              client: clientResponse.data
            };
          } catch (error) {
            console.warn(`⚠️ Failed to fetch client for car ${car.id}:`, error instanceof Error ? error.message : String(error));
            return {
              ...car,
              client: { id: car.client_id, name: 'Unknown', email: '', created_at: '', updated_at: '' }
            };
          }
        })
      );
      
      return carsWithClients;
    } catch (error) {
      console.error('❌ Cars fetch error:', error);
      throw new Error('Erreur lors du chargement des voitures');
    }
  },

  async getCarsByClient(clientId: number): Promise<Car[]> {
    try {
      const response = await api.get<Car[]>(`/cars/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Cars for client ${clientId} fetch error:`, error);
      throw new Error('Erreur lors du chargement des voitures du client');
    }
  },

  async getCarsByStatus(status: string): Promise<Car[]> {
    try {
      const response = await api.get<Car[]>(`/cars/status/${status}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Cars with status ${status} fetch error:`, error);
      throw new Error('Erreur lors du chargement des voitures');
    }
  },

  // Repairs
  async getRepairs(): Promise<RepairWithDetails[]> {
    try {
      console.log('🔧 Fetching repairs...');
      const response = await api.get<Repair[]>('/repairs');
      const repairs = response.data;
      console.log(`✅ Found ${repairs.length} repairs`);
      
      // Fetch car and intervention details for each repair
      const repairsWithDetails = await Promise.all(
        repairs.map(async (repair) => {
          try {
            const [carResponse, interventionResponse] = await Promise.all([
              api.get<Car>(`/cars/${repair.car_id}`),
              api.get<Intervention>(`/interventions/${repair.intervention_id}`)
            ]);
            
            const car = carResponse.data;
            let client;
            try {
              const clientResponse = await api.get<Client>(`/clients/${car.client_id}`);
              client = clientResponse.data;
            } catch (error) {
              console.warn(`⚠️ Failed to fetch client for car ${car.id}:`, error instanceof Error ? error.message : String(error));
              client = { id: car.client_id, name: 'Unknown', email: '', created_at: '', updated_at: '' };
            }
            
            return {
              ...repair,
              car: {
                ...car,
                client
              },
              intervention: interventionResponse.data
            };
          } catch (error) {
            console.warn(`⚠️ Failed to fetch details for repair ${repair.id}:`, error instanceof Error ? error.message : String(error));
            return null;
          }
        })
      );
      
      // Filter out null results
      return repairsWithDetails.filter((repair): repair is RepairWithDetails => repair !== null);
    } catch (error) {
      console.error('❌ Repairs fetch error:', error);
      throw new Error('Erreur lors du chargement des réparations');
    }
  },

  async getRepairsInProgress(): Promise<RepairWithDetails[]> {
    try {
      const repairs = await this.getRepairs();
      const inProgressRepairs = repairs.filter(repair => repair.status === 'in_progress');
      console.log(`🔧 Found ${inProgressRepairs.length} repairs in progress`);
      return inProgressRepairs;
    } catch (error) {
      console.error('❌ Repairs in progress fetch error:', error);
      throw new Error('Erreur lors du chargement des réparations en cours');
    }
  },

  async startRepair(id: number): Promise<Repair> {
    try {
      const response = await api.post<Repair>(`/repairs/${id}/start`);
      return response.data;
    } catch (error) {
      console.error(`❌ Start repair ${id} error:`, error);
      throw new Error('Erreur lors du démarrage de la réparation');
    }
  },

  async completeRepair(id: number): Promise<Repair> {
    try {
      const response = await api.post<Repair>(`/repairs/${id}/complete`);
      return response.data;
    } catch (error) {
      console.error(`❌ Complete repair ${id} error:`, error);
      throw new Error('Erreur lors de la finalisation de la réparation');
    }
  },

  // Interventions
  async getInterventions(): Promise<Intervention[]> {
    try {
      const response = await api.get<Intervention[]>('/interventions');
      return response.data;
    } catch (error) {
      console.error('❌ Interventions fetch error:', error);
      throw new Error('Erreur lors du chargement des interventions');
    }
  },

  async getActiveInterventions(): Promise<Intervention[]> {
    try {
      const response = await api.get<Intervention[]>('/interventions/active');
      return response.data;
    } catch (error) {
      console.error('❌ Active interventions fetch error:', error);
      throw new Error('Erreur lors du chargement des interventions actives');
    }
  },

  // Repair Slots
  async getRepairSlots(): Promise<RepairSlot[]> {
    try {
      const response = await api.get<RepairSlot[]>('/slots');
      return response.data;
    } catch (error) {
      console.error('❌ Repair slots fetch error:', error);
      throw new Error('Erreur lors du chargement des emplacements de réparation');
    }
  },

  async getAvailableSlots(): Promise<RepairSlot[]> {
    try {
      const response = await api.get<RepairSlot[]>('/slots/available');
      return response.data;
    } catch (error) {
      console.error('❌ Available slots fetch error:', error);
      throw new Error('Erreur lors du chargement des emplacements disponibles');
    }
  },

  // Waiting Slots
  async getWaitingSlots(): Promise<WaitingSlot[]> {
    try {
      const response = await api.get<WaitingSlot[]>('/waiting-slots');
      return response.data;
    } catch (error) {
      console.error('❌ Waiting slots fetch error:', error);
      throw new Error('Erreur lors du chargement des emplacements d\'attente');
    }
  },

  async getUnpaidWaitingSlots(): Promise<WaitingSlot[]> {
    try {
      const response = await api.get<WaitingSlot[]>('/waiting-slots/unpaid');
      return response.data;
    } catch (error) {
      console.error('❌ Unpaid waiting slots fetch error:', error);
      throw new Error('Erreur lors du chargement des emplacements non payés');
    }
  },

  // Cars with grouped repairs from Firebase
  async getCarsWithGroupedRepairs(): Promise<unknown[]> {
    try {
      console.log('🚗🔧 Fetching cars with grouped repairs...');
      const response = await api.get<unknown[]>('/clients/cars-with-repairs');
      console.log(`✅ Found ${response.data.length} cars with repairs`);
      return response.data;
    } catch (error) {
      console.error('❌ Cars with grouped repairs fetch error:', error);
      throw new Error('Erreur lors du chargement des voitures avec leurs réparations');
    }
  }
};

export default apiService;
