import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <h1 className="nav-brand">Garage Manager</h1>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">Dashboard</Link>
          </li>
          <li className="nav-item">
            <Link to="/clients" className="nav-link">Clients</Link>
          </li>
                <li className="nav-item">
            <Link to="/slots" className="nav-link">Slots repairs</Link>
          </li>
          <li className="nav-item">
            <Link to="/add-intervention" className="nav-link">Ajouter Intervention</Link>
          </li>
          <li className="nav-item">
            <Link to="/repairs-grouped" className="nav-link">Réparations Groupées</Link>
          </li>
          <li className="nav-item">
            <Link to="/mobile-app" className="nav-link">Application Mobile</Link>
          </li>
          <li className="nav-item">
            <Link to="/test" className="nav-link">Test API</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
