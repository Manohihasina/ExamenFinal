import { useState, useEffect } from 'react';
import apiService from '../services/api';
import type { FirebaseAuthUser } from '../types';

const Clients = () => {
  const [clients, setClients] = useState<FirebaseAuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await apiService.getClients();
        setClients(data);
      } catch (err) {
        setError('Erreur lors du chargement des clients');
        console.error('Error fetching clients:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone && client.phone.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="clients">
        <h2>Liste des clients</h2>
        <div className="loading">Chargement des clients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clients">
        <h2>Liste des clients</h2>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="clients">
      <div className="page-header">
        <h2>Liste des clients</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="clients-count">
        {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} trouvé{filteredClients.length > 1 ? 's' : ''}
      </div>

      <div className="clients-table-container">
        <table className="clients-table">
          <thead>
            <tr>
              <th>UID</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Date de création</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.uid}>
                <td>{client.uid}</td>
                <td className="client-name">{client.name}</td>
                <td className="client-email">{client.email}</td>
                <td>{client.phone || '-'}</td>
                <td>{client.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredClients.length === 0 && (
          <div className="no-results">
            Aucun client trouvé pour cette recherche.
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;
