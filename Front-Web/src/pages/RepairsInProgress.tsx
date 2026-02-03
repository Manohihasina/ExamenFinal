import { useState, useEffect } from 'react';
import apiService from '../services/api';
import type { RepairWithDetails } from '../types';

const RepairsInProgress = () => {
  const [repairs, setRepairs] = useState<RepairWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRepairs = async () => {
      console.log('🔧 Repairs: Starting fetch...');
      try {
        const data = await apiService.getRepairsInProgress();
        console.log('🔧 Repairs: Data received:', data);
        setRepairs(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('❌ Repairs: Error fetching repairs:', err);
        setError(`Erreur lors du chargement des réparations: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRepairs();
  }, []);

  const handleCompleteRepair = async (repairId: number) => {
    try {
      console.log(`🔧 Repairs: Completing repair ${repairId}...`);
      await apiService.completeRepair(repairId);
      console.log(`✅ Repairs: Repair ${repairId} completed successfully`);
      setRepairs(repairs.filter(repair => repair.id !== repairId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ Repairs: Error completing repair:', err);
      alert(`Erreur lors de la finalisation de la réparation: ${errorMessage}`);
    }
  };

  const filteredRepairs = repairs.filter(repair => {
    try {
      return (
        repair.car?.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.car?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.car?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.car?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.intervention?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (err) {
      console.warn('⚠️ Repairs: Error filtering repair:', err);
      return false;
    }
  });

  if (loading) {
    return (
      <div className="repairs">
        <h2>Réparations en cours</h2>
        <div className="loading">Chargement des réparations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="repairs">
        <h2>Réparations en cours</h2>
        <div className="error">{error}</div>
      </div>
    );
  }

  console.log('🔧 Repairs: Rendering with', repairs.length, 'repairs, filtered:', filteredRepairs.length);

  return (
    <div className="repairs">
      <div className="page-header">
        <h2>Réparations en cours</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher par client, voiture, plaque ou intervention..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="repairs-count">
        {filteredRepairs.length} réparation{filteredRepairs.length > 1 ? 's' : ''} en cours
        {searchTerm && ` (sur ${repairs.length} totale${repairs.length > 1 ? 's' : ''})`}
      </div>

      <div className="repairs-grid">
        {filteredRepairs.map((repair) => (
          <div key={repair.id} className="repair-card">
            <div className="repair-header">
              <h3>{repair.intervention?.name || 'Intervention inconnue'}</h3>
              <span className="repair-status in-progress">En cours</span>
            </div>

            <div className="repair-client">
              <strong>Client:</strong> {repair.car?.client?.name || 'Client inconnu'}
            </div>

            <div className="repair-car">
              <strong>Voiture:</strong> {repair.car?.make || 'Marque inconnue'} {repair.car?.model || 'Modèle inconnu'} ({repair.car?.year || 'Année inconnue'})
            </div>

            <div className="repair-plate">
              <strong>Plaque:</strong> {repair.car?.license_plate || 'Plaque inconnue'}
            </div>

            <div className="repair-price">
              <strong>Prix:</strong> {typeof repair.intervention?.price === 'number' ? repair.intervention.price.toFixed(2) : parseFloat(String(repair.intervention?.price || '0')).toFixed(2)} €
            </div>

            <div className="repair-dates">
              <div><strong>Début:</strong> {repair.started_at ? new Date(repair.started_at).toLocaleDateString('fr-FR') : '-'}</div>
              <div><strong>Créé le:</strong> {repair.created_at ? new Date(repair.created_at).toLocaleDateString('fr-FR') : '-'}</div>
            </div>

            {repair.intervention?.description && (
              <div className="repair-description">
                <strong>Description:</strong> {repair.intervention.description}
              </div>
            )}

            {/* <div className="repair-actions">
              <button
                onClick={() => handleCompleteRepair(repair.id)}
                className="btn-complete"
              >
                Marquer comme terminée
              </button>
            </div> */}
          </div>
        ))}

        {filteredRepairs.length === 0 && (
          <div className="no-results">
            {searchTerm 
              ? `Aucune réparation en cours trouvée pour "${searchTerm}".`
              : 'Aucune réparation en cours trouvée.'
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default RepairsInProgress;
