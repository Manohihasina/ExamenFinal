import axios from 'axios';
import type { 
  FirebaseUser, 
  FirebaseUserStats, 
  FirebaseUserListResponse, 
  FirebaseUserResponse, 
  FirebaseStatsResponse 
} from '../types/firebase';

const API_BASE_URL = 'http://127.0.0.1:8001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 60000, // 60 seconds timeout
});

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

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
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

export const firebaseApiService = {
  // Get all Firebase users
  async getAllUsers(maxResults = 1000): Promise<FirebaseUser[]> {
    try {
      console.log('👥 Fetching Firebase users...');
      const response = await api.get<FirebaseUserListResponse>('/firebase/clients', {
        params: { max: maxResults }
      });
      
      if (response.data.success && response.data.data) {
        console.log(`✅ Found ${response.data.data.length} Firebase users`);
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch Firebase users');
    } catch (error) {
      console.error('❌ Firebase users fetch error:', error);
      throw new Error('Erreur lors du chargement des utilisateurs Firebase');
    }
  },

  // Get Firebase user by UID
  async getUserByUid(uid: string): Promise<FirebaseUser | null> {
    try {
      console.log(`👤 Fetching Firebase user: ${uid}`);
      const response = await api.get<FirebaseUserResponse>(`/firebase/clients/${uid}`);
      
      if (response.data.success && response.data.data) {
        console.log(`✅ Found Firebase user: ${uid}`);
        return response.data.data;
      }
      
      if (response.data.message?.includes('not found')) {
        return null;
      }
      
      throw new Error(response.data.message || 'Failed to fetch Firebase user');
    } catch (error) {
      console.error(`❌ Firebase user fetch error for ${uid}:`, error);
      throw new Error(`Erreur lors du chargement de l'utilisateur Firebase: ${uid}`);
    }
  },

  // Update Firebase user
  async updateUser(uid: string, data: Partial<FirebaseUser>): Promise<boolean> {
    try {
      console.log(`📝 Updating Firebase user: ${uid}`);
      const response = await api.put<FirebaseUserResponse>(`/firebase/clients/${uid}`, data);
      
      if (response.data.success) {
        console.log(`✅ Firebase user updated: ${uid}`);
        return true;
      }
      
      throw new Error(response.data.message || 'Failed to update Firebase user');
    } catch (error) {
      console.error(`❌ Firebase user update error for ${uid}:`, error);
      throw new Error(`Erreur lors de la mise à jour de l'utilisateur Firebase: ${uid}`);
    }
  },

  // Delete Firebase user
  async deleteUser(uid: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting Firebase user: ${uid}`);
      const response = await api.delete<FirebaseUserResponse>(`/firebase/clients/${uid}`);
      
      if (response.data.success) {
        console.log(`✅ Firebase user deleted: ${uid}`);
        return true;
      }
      
      throw new Error(response.data.message || 'Failed to delete Firebase user');
    } catch (error) {
      console.error(`❌ Firebase user delete error for ${uid}:`, error);
      throw new Error(`Erreur lors de la suppression de l'utilisateur Firebase: ${uid}`);
    }
  },

  // Get Firebase users statistics
  async getStats(): Promise<FirebaseUserStats> {
    try {
      console.log('📊 Fetching Firebase users stats...');
      const response = await api.get<FirebaseStatsResponse>('/firebase/clients/stats');
      
      if (response.data.success && response.data.data) {
        console.log('✅ Firebase users stats retrieved');
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch Firebase users stats');
    } catch (error) {
      console.error('❌ Firebase users stats fetch error:', error);
      throw new Error('Erreur lors du chargement des statistiques des utilisateurs Firebase');
    }
  },

  // Legacy method for backward compatibility
  async getClients(): Promise<FirebaseUser[]> {
    return this.getAllUsers();
  }
};
