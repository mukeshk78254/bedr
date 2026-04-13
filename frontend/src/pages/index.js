import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Dashboard() {
  const [occupancy, setOccupancy] = useState(null);
  const [flats, setFlats] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [occupancyData, flatsData, tenantsData] = await Promise.all([
        api.dashboard.getOccupancy(),
        api.flats.getAll(),
        api.tenants.getAll()
      ]);
      setOccupancy(occupancyData.data);
      setFlats(flatsData.data || []);
      setTenants(tenantsData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getOccupancyPercentage = (occupied, total) => {
    if (total === 0) return 0;
    return Math.round((occupied / total) * 100);
  };

  const getBar = (occupied, total) => {
    const percentage = getOccupancyPercentage(occupied, total);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
        <div style={{ 
          flex: 1, 
          height: '20px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: percentage > 80 ? '#dc3545' : percentage > 50 ? '#ffc107' : '#28a745',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <span style={{ fontWeight: 'bold', minWidth: '60px' }}>{percentage}%</span>
      </div>
    );
  };

  const assignedCount = tenants.filter(t => t.bed_id).length;
  const unassignedCount = tenants.filter(t => !t.bed_id).length;

  return (
    <div className="container">
      <header>
        <h1> BedR - Property Management System</h1>
        <nav>
          <Link href="/"> Dashboard</Link>
          <Link href="/flats"> Flats & Rooms</Link>
          <Link href="/tenants"> Tenants</Link>
        </nav>
      </header>

      <main>
        <div className="section">
          <h2> Occupancy Dashboard</h2>
          
          {error && <div className="error"> {error}</div>}
          
          {loading ? (
            <div className="loading">Loading dashboard data...</div>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginBottom: '40px' }}>
                <div className="card">
                  <div className="card-header"> Total Flats</div>
                  <div className="card-body">
                    <h3 style={{ fontSize: '32px', margin: '10px 0' }}>{flats.length}</h3>
                    <p className="text-muted">Properties in system</p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"> Total Tenants</div>
                  <div className="card-body">
                    <h3 style={{ fontSize: '32px', margin: '10px 0' }}>{tenants.length}</h3>
                    <p className="text-muted">
                      <span style={{ color: '#28a745' }}> {assignedCount}</span>
                      {' | '}
                      <span style={{ color: '#ffc107' }}> {unassignedCount}</span>
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"> Occupancy Rate</div>
                  <div className="card-body">
                    {occupancy && occupancy.flat_occupancy && occupancy.flat_occupancy.length > 0 ? (
                      <>
                        <h3 style={{ fontSize: '32px', margin: '10px 0' }}>
                          {Math.round(
                            occupancy.flat_occupancy.reduce((sum, flat) => sum + flat.occupied_beds, 0) / 
                            occupancy.flat_occupancy.reduce((sum, flat) => sum + flat.total_beds, 0) * 100
                          )}%
                        </h3>
                        <p className="text-muted">Average across all flats</p>
                      </>
                    ) : (
                      <p className="text-muted">No data available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Flat Occupancy */}
              <div className="section">
                <h3> Occupancy by Flat</h3>
                {occupancy && occupancy.flat_occupancy && occupancy.flat_occupancy.length > 0 ? (
                  <table style={{ marginTop: '15px' }}>
                    <thead>
                      <tr>
                        <th>Flat Name</th>
                        <th>Total Beds</th>
                        <th>Occupied</th>
                        <th>Maintenance</th>
                        <th>Available</th>
                        <th>Occupancy Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {occupancy.flat_occupancy.map((flat) => (
                        <tr key={flat.id}>
                          <td><strong>{flat.name}</strong></td>
                          <td>{flat.total_beds}</td>
                          <td style={{ color: '#dc3545' }}>
                            <strong>{flat.occupied_beds}</strong>
                          </td>
                          <td style={{ color: '#ffc107' }}>
                            <strong>{flat.maintenance_beds}</strong>
                          </td>
                          <td style={{ color: '#28a745' }}>
                            <strong>{flat.available_beds}</strong>
                          </td>
                          <td>
                            {getBar(flat.occupied_beds, flat.total_beds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-muted">No flats data available</p>
                )}
              </div>

              {/* Room Occupancy */}
              <div className="section">
                <h3> Occupancy by Room</h3>
                {occupancy && occupancy.room_occupancy && occupancy.room_occupancy.length > 0 ? (
                  <table style={{ marginTop: '15px' }}>
                    <thead>
                      <tr>
                        <th>Room Name</th>
                        <th>Flat</th>
                        <th>Capacity</th>
                        <th>Occupied</th>
                        <th>Maintenance</th>
                        <th>Available</th>
                        <th>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {occupancy.room_occupancy.map((room) => {
                        const flat = flats.find(f => f.id === room.flat_id);
                        return (
                          <tr key={room.id}>
                            <td><strong>{room.name}</strong></td>
                            <td className="text-muted">{flat ? flat.name : `Flat #${room.flat_id}`}</td>
                            <td>{room.max_bed_capacity}</td>
                            <td style={{ color: '#dc3545' }}><strong>{room.occupied_beds}</strong></td>
                            <td style={{ color: '#ffc107' }}><strong>{room.maintenance_beds}</strong></td>
                            <td style={{ color: '#28a745' }}><strong>{room.available_beds}</strong></td>
                            <td>
                              <span className="badge" style={{
                                backgroundColor: room.occupancy_percentage > 80 ? '#dc3545' : 
                                               room.occupancy_percentage > 50 ? '#ffc107' : '#28a745',
                                color: 'white'
                              }}>
                                {room.occupancy_percentage}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-muted">No room data available</p>
                )}
              </div>

              {/* Legend */}
              <div className="section" style={{ marginTop: '40px' }}>
                <h3> Legend</h3>
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                  <div>
                    <span className="badge" style={{ backgroundColor: '#28a745', color: 'white' }}>●</span>
                    {' '}
                    <strong>Available</strong> - Bed is free and ready for assignment
                  </div>
                  <div>
                    <span className="badge" style={{ backgroundColor: '#dc3545', color: 'white' }}>●</span>
                    {' '}
                    <strong>Occupied</strong> - Bed is assigned to a tenant
                  </div>
                  <div>
                    <span className="badge" style={{ backgroundColor: '#ffc107', color: '#333' }}>●</span>
                    {' '}
                    <strong>Under Maintenance</strong> - Bed is temporarily unavailable
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="section" style={{ marginTop: '40px', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                <h3> Quick Actions</h3>
                <div className="button-group">
                  <Link href="/flats" className="button btn-primary"> Manage Flats & Rooms</Link>
                  <Link href="/tenants" className="button btn-info"> Manage Tenants</Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <footer style={{ textAlign: 'center', marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee', color: '#999', fontSize: '12px' }}>
        <p>BedR Property Management System | Backend running on port 5000</p>
      </footer>
    </div>
  );
}
