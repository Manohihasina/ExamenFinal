import { useState, useEffect } from 'react';
import apiService from '../services/api';
import './RepairsGroupedView.css';

interface Repair {
  id: string;
  interventionId: number;
  interventionName: string;
  interventionPrice: number;
  interventionDuration: number;
  status: string;
  userId: string | null;
  completedNotified: boolean;
  halfwayNotified: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface CarWithRepairs {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  client_id?: string;
  client?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
  repairs: Repair[];
}

const RepairsGroupedView = () => {
  const [carsData, setCarsData] = useState<CarWithRepairs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCars, setExpandedCars] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCarsWithRepairs = async () => {
      console.log('🚗🔧 RepairsGrouped: Starting fetch...');
      try {
        const data = await apiService.getCarsWithGroupedRepairs();
        console.log('🚗🔧 RepairsGrouped: Data received:', data);
        setCarsData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('❌ RepairsGrouped: Error fetching cars with repairs:', err);
        setError(`Erreur lors du chargement des voitures avec réparations: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCarsWithRepairs();
  }, []);

  const toggleCarExpansion = (carId: string) => {
    setExpandedCars(prev => {
      const newSet = new Set(prev);
      if (newSet.has(carId)) {
        newSet.delete(carId);
      } else {
        newSet.add(carId);
      }
      return newSet;
    });
  };

  const filteredCars = carsData.filter(car => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      car.make?.toLowerCase().includes(searchLower) ||
      car.model?.toLowerCase().includes(searchLower) ||
      car.license_plate?.toLowerCase().includes(searchLower) ||
      car.repairs.some(repair => 
        repair.interventionName?.toLowerCase().includes(searchLower) ||
        repair.status?.toLowerCase().includes(searchLower)
      )
    );
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#28a745';
      case 'in_progress': return '#ffc107';
      case 'pending': return '#6c757d';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return status || 'Inconnu';
    }
  };

  if (loading) {
    return (
      <div className="repairs-grouped">
        <h2>Vue groupée des réparations</h2>
        <div className="loading">Chargement des voitures et réparations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="repairs-grouped">
        <h2>Vue groupée des réparations</h2>
        <div className="error">{error}</div>
      </div>
    );
  }

  const totalCars = filteredCars.length;
  const totalRepairs = filteredCars.reduce((sum, car) => sum + car.repairs.length, 0);
  const carsWithRepairs = filteredCars.filter(car => car.repairs.length > 0).length;

  return (
    <div className="repairs-grouped">
      <div className="page-header">
        <h2>Vue groupée des réparations</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher par voiture, plaque, intervention ou statut..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="stats-summary">
        <div className="stat-card">
          <span className="stat-number">{totalCars}</span>
          <span className="stat-label">Voitures totales</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{carsWithRepairs}</span>
          <span className="stat-label">Voitures avec réparations</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{totalRepairs}</span>
          <span className="stat-label">Réparations totales</span>
        </div>
      </div>

      <div className="cars-list">
        {filteredCars.map((car) => (
          <div key={car.id} className="car-card">
            <div 
              className="car-header" 
              onClick={() => toggleCarExpansion(car.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="car-info">
                <h3>
                  {car.make} {car.model} ({car.year})
                </h3>
                <p className="license-plate">Immatriculation: {car.license_plate}</p>
                {car.client && (
                  <div className="client-info">
                    <p className="client-name">
                      <strong>Client:</strong> {car.client.name}
                    </p>
                    <p className="client-email">
                      <strong>Email:</strong> {car.client.email}
                    </p>
                    <p className="client-id">
                      <strong>ID Client:</strong> {car.client_id}
                    </p>
                  </div>
                )}
              </div>
              <div className="car-repairs-summary">
                <span className="repairs-count">{car.repairs.length} réparation{car.repairs.length > 1 ? 's' : ''}</span>
                <span className="expand-icon">
                  {expandedCars.has(car.id) ? '▼' : '▶'}
                </span>
              </div>
            </div>

            {expandedCars.has(car.id) && car.repairs.length > 0 && (
              <div className="repairs-list">
                {car.repairs.map((repair) => (
                  <div key={repair.id} className="repair-item">
                    <div className="repair-header">
                      <h4>{repair.interventionName || 'Intervention inconnue'}</h4>
                      <span 
                        className="repair-status" 
                        style={{ backgroundColor: getStatusColor(repair.status) }}
                      >
                        {getStatusText(repair.status)}
                      </span>
                    </div>
                    
                    <div className="repair-details">
                      <div className="repair-price">
                        <strong>Prix:</strong> {repair.interventionPrice.toFixed(2)} €
                      </div>
                      <div className="repair-duration">
                        <strong>Durée:</strong> {Math.round(repair.interventionDuration / 60)} minutes
                      </div>
                      {repair.created_at && (
                        <div className="repair-date">
                          <strong>Créé le:</strong> {new Date(repair.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                      {repair.userId && (
                        <div className="repair-user">
                          <strong>ID Utilisateur:</strong> {repair.userId}
                        </div>
                      )}
                    </div>

                    <div className="repair-notifications">
                      <span className={`notification ${repair.completedNotified ? 'sent' : 'pending'}`}>
                        Notification fin: {repair.completedNotified ? 'Envoyée' : 'En attente'}
                      </span>
                      <span className={`notification ${repair.halfwayNotified ? 'sent' : 'pending'}`}>
                        Notification mi-parcours: {repair.halfwayNotified ? 'Envoyée' : 'En attente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {expandedCars.has(car.id) && car.repairs.length === 0 && (
              <div className="no-repairs">
                <p>Aucune réparation pour cette voiture</p>
              </div>
            )}
          </div>
        ))}

        {filteredCars.length === 0 && (
          <div className="no-results">
            {searchTerm 
              ? `Aucune voiture trouvée pour "${searchTerm}".`
              : 'Aucune voiture trouvée.'
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default RepairsGroupedView;
