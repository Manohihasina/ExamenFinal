import { useState } from 'react';
import apiService from '../services/api';

const ApiTest = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setLoading(true);
    setLogs([]);
    
    try {
      addLog('🚀 Début du test de connexion API...');
      
      // Test 1: Clients
      addLog('📡 Test 1: Récupération des clients...');
      const clients = await apiService.getClients();
      addLog(`✅ Clients récupérés: ${clients.length} trouvé(s)`);
      
      // Test 2: Interventions
      addLog('📡 Test 2: Récupération des interventions...');
      const interventions = await apiService.getInterventions();
      addLog(`✅ Interventions récupérées: ${interventions.length} trouvée(s)`);
      
      // Test 3: Repairs
      addLog('📡 Test 3: Récupération des réparations...');
      const repairs = await apiService.getRepairs();
      addLog(`✅ Réparations récupérées: ${repairs.length} trouvée(s)`);
      
      // Test 4: Dashboard
      addLog('📡 Test 4: Récupération des statistiques...');
      const stats = await apiService.getDashboardStats();
      addLog(`✅ Statistiques récupérées:`);
      addLog(`   - Clients: ${stats.total_clients}`);
      addLog(`   - Réparations en cours: ${stats.repairs_in_progress}`);
      addLog(`   - Réparations terminées: ${stats.repairs_completed}`);
      addLog(`   - Montant total: ${stats.total_interventions_amount}€`);
      
      addLog('🎉 Tous les tests réussis !');
      
    } catch (error) {
      addLog(`❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🔧 Test de connexion API</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testConnection} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#4fbf9f',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Test en cours...' : 'Lancer les tests'}
        </button>
        
        <button 
          onClick={clearLogs}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f4a261',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Effacer les logs
        </button>
      </div>

      <div style={{
        backgroundColor: '#1a1a1a',
        color: '#00ff00',
        padding: '15px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px',
        height: '400px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap'
      }}>
        {logs.length === 0 ? 'Cliquez sur "Lancer les tests" pour commencer...' : logs.join('\n')}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>URL de l'API:</strong> http://127.0.0.1:8000/api</p>
        <p><strong>Note:</strong> Ouvrez la console du navigateur (F12) pour voir les logs détaillés</p>
      </div>
    </div>
  );
};

export default ApiTest;
