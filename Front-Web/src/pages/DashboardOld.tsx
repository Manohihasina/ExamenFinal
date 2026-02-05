import { useState, useEffect } from 'react';
import apiService from '../services/api';
import type { FirebaseAuthUser, DashboardStats } from '../types';
import ChartComponent from '../components/ChartComponent';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clients, setClients] = useState<FirebaseAuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      console.log('🎯 Dashboard: Starting fetch...');
      try {
        const [data, clientsList] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getFirebaseClients().catch(() => [])
        ]);
        console.log('📊 Dashboard: Data received:', data);
        setStats(data);
        setClients(clientsList);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('❌ Dashboard: Error fetching stats:', err);
        setError(`Erreur lors du chargement des statistiques: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <h2>Tableau de bord</h2>
        <div className="loading">Chargement des statistiques...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <h2>Tableau de bord</h2>
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard">
        <h2>Tableau de bord</h2>
        <div className="error">Aucune donnée disponible</div>
      </div>
    );
  }

  // Prepare data for status pie chart
  const statusData = {
    'En cours': stats.repairs_in_progress,
    'Terminées': stats.repairs_completed,
    'En attente': stats.repairs_pending,
    'Annulées': stats.repairs_cancelled
  };

  return (
    <div className="dashboard">
      <h2>Tableau de bord</h2>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon clients">👥</div>
          <div className="stat-content">
            <h3>{stats.total_clients}</h3>
            <p>Total Clients</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon repairs-progress">🔧</div>
          <div className="stat-content">
            <h3>{stats.repairs_in_progress}</h3>
            <p>Réparations en cours</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon repairs-completed">✅</div>
          <div className="stat-content">
            <h3>{stats.repairs_completed}</h3>
            <p>Réparations terminées</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amount">💰</div>
          <div className="stat-content">
            <h3>{typeof stats.total_interventions_amount === 'number' ? stats.total_interventions_amount.toFixed(2) : parseFloat(String(stats.total_interventions_amount || '0')).toFixed(2)} €</h3>
            <p>Montant total des interventions</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <h3>📈 Analyses et tendances</h3>
        
        <div className="charts-grid">
          {/* Repairs by Month Chart */}
          <ChartComponent
            data={stats.repairs_by_month}
            title="Réparations par mois"
            type="bar"
            colors={['#4fbf9f']}
          />

          {/* Interventions by Price Range Chart */}
          <ChartComponent
            data={stats.interventions_by_price}
            title="Répartition des interventions par prix"
            type="pie"
            colors={['#a8dadc', '#f4a261', '#95d5b2', '#dda0dd']}
          />

          {/* Repairs Status Chart */}
          <ChartComponent
            data={statusData}
            title="Statut des réparations"
            type="pie"
            colors={['#f4a261', '#95d5b2', '#a8dadc', '#ff6b6b']}
          />
        </div>
      </div>

      <div className="charts-section">
        <h3>👥 Clients</h3>

        {clients.length === 0 ? (
          <div className="loading">Aucun client à afficher</div>
        ) : (
          <div className="clients-table-container">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>UID</th>
                  <th>Nom</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {clients.slice(0, 10).map((client) => (
                  <tr key={client.uid}>
                    <td>{client.uid}</td>
                    <td className="client-name">{client.name}</td>
                    <td className="client-email">{client.email}</td>
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

export default Dashboard;
