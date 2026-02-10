import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import type { ClientRepairHistory, ClientRepair } from '../types';
import '../styles/ClientRepairHistory.css';

const ClientRepairHistory = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [repairHistory, setRepairHistory] = useState<ClientRepairHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepairHistory = async () => {
      if (!clientId) {
        setError('ID client non spécifié');
        setLoading(false);
        return;
      }

      try {
        const data = await apiService.getClientRepairHistory(clientId);
        setRepairHistory(data);
      } catch (err) {
        setError('Erreur lors du chargement de l\'historique des réparations');
        console.error('Error fetching repair history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRepairHistory();
  }, [clientId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'status-pending',
      in_progress: 'status-in-progress',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };

    const statusLabels = {
      pending: 'En attente',
      in_progress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };

    return (
      <span className={`status-badge ${statusClasses[status as keyof typeof statusClasses] || ''}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="client-repair-history">
        <div className="page-header">
          <button onClick={() => navigate('/clients')} className="back-button">
            ← Retour à la liste des clients
          </button>
          <h2>Historique des réparations</h2>
        </div>
        <div className="loading">Chargement de l'historique...</div>
      </div>
    );
  }

  if (error || !repairHistory) {
    return (
      <div className="client-repair-history">
        <div className="page-header">
          <button onClick={() => navigate('/clients')} className="back-button">
            ← Retour à la liste des clients
          </button>
          <h2>Historique des réparations</h2>
        </div>
        <div className="error">{error || 'Aucune donnée trouvée'}</div>
      </div>
    );
  }

  return (
    <div className="client-repair-history">
      <div className="page-header">
        <button onClick={() => navigate('/clients')} className="back-button">
          ← Retour à la liste des clients
        </button>
        <h2>Historique des réparations</h2>
      </div>

      {/* Client Information */}
      <div className="client-info-card">
        <h3>Informations du client</h3>
        <div className="client-details">
          <div className="detail-row">
            <span className="label">Nom:</span>
            <span className="value">{repairHistory.client.name}</span>
          </div>
          <div className="detail-row">
            <span className="label">Email:</span>
            <span className="value">{repairHistory.client.email}</span>
          </div>
          {repairHistory.client.phone && (
            <div className="detail-row">
              <span className="label">Téléphone:</span>
              <span className="value">{repairHistory.client.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-card">
        <h3>Statistiques des réparations</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{repairHistory.statistics.total_repairs}</div>
            <div className="stat-label">Total des réparations</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{repairHistory.statistics.total_amount.toFixed(2)} €</div>
            <div className="stat-label">Montant total</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{repairHistory.statistics.completed_repairs}</div>
            <div className="stat-label">Terminées</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{repairHistory.statistics.in_progress_repairs}</div>
            <div className="stat-label">En cours</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{repairHistory.statistics.pending_repairs}</div>
            <div className="stat-label">En attente</div>
          </div>
        </div>
      </div>

      {/* Repairs List */}
      <div className="repairs-section">
        <h3>Liste des réparations ({repairHistory.repairs.length})</h3>
        
        {repairHistory.repairs.length === 0 ? (
          <div className="no-repairs">
            Ce client n'a aucune réparation dans son historique.
          </div>
        ) : (
          <div className="repairs-table-container">
            <table className="repairs-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Intervention</th>
                  <th>Voiture</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {repairHistory.repairs.map((repair: ClientRepair) => (
                  <tr key={repair.id}>
                    <td>{formatDate(repair.startedAt || repair.created_at)}</td>
                    <td className="intervention-name">{repair.interventionName}</td>
                    <td className="car-info">
                      <div className="car-make-model">{repair.car.make} {repair.car.model}</div>
                      <div className="car-license">{repair.car.license_plate}</div>
                    </td>
                    <td className="amount">{repair.interventionPrice.toFixed(2)} €</td>
                    <td>{getStatusBadge(repair.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientRepairHistory;
