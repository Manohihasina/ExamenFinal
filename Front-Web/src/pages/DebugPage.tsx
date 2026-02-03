import { useState, useEffect } from 'react';

const DebugPage = () => {
  const [apiData, setApiData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testDirectApi = async () => {
      try {
        console.log('🔍 Debug: Testing direct API call...');
        
        // Test direct avec fetch
        const response = await fetch('http://127.0.0.1:8000/api/clients');
        console.log('🔍 Debug: Response status:', response.status);
        console.log('🔍 Debug: Response headers:', response.headers);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🔍 Debug: Raw API data:', data);
        setApiData(data);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('🔍 Debug: Error:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    testDirectApi();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🔍 Page de débogage API</h2>
      
      {loading && <p>Chargement...</p>}
      
      {error && (
        <div style={{ backgroundColor: '#ffebee', padding: '10px', margin: '10px 0', borderRadius: '5px' }}>
          <strong>Erreur:</strong> {error}
        </div>
      )}
      
      {apiData && (
        <div>
          <h3>✅ Données reçues:</h3>
          <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
            <pre>{String(JSON.stringify(apiData, null, 2))}</pre>
          </div>
          
          <h3>📊 Statistiques:</h3>
          <ul>
            <li>Type de données: {Array.isArray(apiData) ? 'Array' : typeof apiData}</li>
            <li>Nombre d'éléments: {Array.isArray(apiData) ? apiData.length : 'N/A'}</li>
            <li>Premier élément: {Array.isArray(apiData) && apiData.length > 0 ? String(JSON.stringify(apiData[0], null, 2)) : 'N/A'}</li>
          </ul>
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>Ouvrez la console (F12) pour voir les logs détaillés</p>
      </div>
    </div>
  );
};

export default DebugPage;
