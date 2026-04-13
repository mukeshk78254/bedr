import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';

export default function Flats() {
  const router = useRouter();
  const [flats, setFlats] = useState([]);
  const [rooms, setRooms] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [selectedFlatId, setSelectedFlatId] = useState(null);
  const [expandedFlat, setExpandedFlat] = useState(null);
  
  const [flatFormData, setFlatFormData] = useState({ name: '', address: '' });
  const [roomFormData, setRoomFormData] = useState({ name: '', max_bed_capacity: '' });

  useEffect(() => {
    fetchFlats();
  }, []);

  const fetchFlats = async () => {
    try {
      setLoading(true);
      const data = await api.flats.getAll();
      setFlats(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (flatId) => {
    try {
      const data = await api.rooms.getByFlat(flatId);
      setRooms(prev => ({ ...prev, [flatId]: data.data || [] }));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleExpandFlat = (flatId) => {
    if (expandedFlat === flatId) {
      setExpandedFlat(null);
    } else {
      setExpandedFlat(flatId);
      if (!rooms[flatId]) {
        fetchRooms(flatId);
      }
    }
  };

  const handleCreateFlat = async (e) => {
    e.preventDefault();
    if (!flatFormData.name || !flatFormData.address) {
      setError('Please fill all fields');
      return;
    }
    try {
      await api.flats.create(flatFormData);
      setSuccess('✅ Flat created successfully!');
      setFlatFormData({ name: '', address: '' });
      setShowForm(false);
      fetchFlats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('❌ ' + err.message);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomFormData.name || !roomFormData.max_bed_capacity) {
      setError('Please fill all fields');
      return;
    }
    try {
      await api.rooms.create({
        flat_id: selectedFlatId,
        name: roomFormData.name,
        max_bed_capacity: parseInt(roomFormData.max_bed_capacity)
      });
      setSuccess('✅ Room created successfully!');
      setRoomFormData({ name: '', max_bed_capacity: '' });
      setShowRoomForm(false);
      fetchRooms(selectedFlatId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('❌ ' + err.message);
    }
  };

  const handleDeleteFlat = async (id) => {
    if (!confirm('Are you sure? This will delete all associated rooms and beds.')) return;
    try {
      await api.flats.delete(id);
      setSuccess('✅ Flat deleted successfully!');
      fetchFlats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('❌ ' + err.message);
    }
  };

  const handleDeleteRoom = async (flatId, roomId) => {
    if (!confirm('Delete this room? Associated beds will also be deleted.')) return;
    try {
      await api.rooms.delete(roomId);
      setSuccess('✅ Room deleted successfully!');
      fetchRooms(flatId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('❌ ' + err.message);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>🏠 BedR - Property Management</h1>
        <nav>
          <Link href="/">📊 Dashboard</Link>
          <Link href="/flats">🏢 Flats</Link>
          <Link href="/tenants">👥 Tenants</Link>
        </nav>
      </header>

      <main>
        <div className="section">
          <h2>Flat Management</h2>
          
          {error && <div className="error">❌ {error}</div>}
          {success && <div className="success">{success}</div>}

          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✖ Cancel' : '+ Add New Flat'}
          </button>

          {showForm && (
            <div className="card" style={{ marginTop: '20px' }}>
              <form onSubmit={handleCreateFlat}>
                <div className="form-group">
                  <label>Flat Name *</label>
                  <input
                    type="text"
                    value={flatFormData.name}
                    onChange={(e) => setFlatFormData({ ...flatFormData, name: e.target.value })}
                    placeholder="e.g., Sunshine Apartments"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address *</label>
                  <textarea
                    value={flatFormData.address}
                    onChange={(e) => setFlatFormData({ ...flatFormData, address: e.target.value })}
                    placeholder="Full address"
                    rows="3"
                    required
                  />
                </div>
                <div className="button-group">
                  <button type="submit" className="btn-success">✓ Create Flat</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading flats...</div>
          ) : flats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No flats found. Create one to get started!
            </div>
          ) : (
            <div style={{ marginTop: '30px' }}>
              {flats.map((flat) => (
                <div key={flat.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0' }}>{flat.name}</h3>
                      <p className="text-muted">{flat.address}</p>
                    </div>
                    <div className="button-group">
                      <button 
                        className="btn-info btn-small" 
                        onClick={() => toggleExpandFlat(flat.id)}
                      >
                        {expandedFlat === flat.id ? '▼ Hide' : '▶ View Rooms'}
                      </button>
                      <button 
                        className="btn-danger btn-small" 
                        onClick={() => handleDeleteFlat(flat.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {expandedFlat === flat.id && (
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                      <h4>Rooms in this Flat</h4>
                      <button 
                        className="btn-primary btn-small" 
                        onClick={() => {
                          setSelectedFlatId(flat.id);
                          setShowRoomForm(true);
                        }}
                        style={{ marginBottom: '15px' }}
                      >
                        + Add Room
                      </button>

                      {showRoomForm && selectedFlatId === flat.id && (
                        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                          <form onSubmit={handleCreateRoom}>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Room Name *</label>
                                <input
                                  type="text"
                                  value={roomFormData.name}
                                  onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                                  placeholder="e.g., Penthouse Suite"
                                  required
                                />
                              </div>
                              <div className="form-group">
                                <label>Max Beds *</label>
                                <input
                                  type="number"
                                  value={roomFormData.max_bed_capacity}
                                  onChange={(e) => setRoomFormData({ ...roomFormData, max_bed_capacity: e.target.value })}
                                  placeholder="e.g., 4"
                                  min="1"
                                  required
                                />
                              </div>
                            </div>
                            <div className="button-group">
                              <button type="submit" className="btn-success btn-small">✓ Add Room</button>
                              <button 
                                type="button" 
                                className="btn-secondary btn-small" 
                                onClick={() => {
                                  setShowRoomForm(false);
                                  setRoomFormData({ name: '', max_bed_capacity: '' });
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {rooms[flat.id] && rooms[flat.id].length > 0 ? (
                        <table>
                          <thead>
                            <tr>
                              <th>Room Name</th>
                              <th>Max Beds</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rooms[flat.id].map((room) => (
                              <tr key={room.id}>
                                <td>{room.name}</td>
                                <td><strong>{room.max_bed_capacity}</strong></td>
                                <td>
                                  <Link href={`/rooms/${room.id}`} className="btn-info btn-small">View Beds</Link>
                                  {' '}
                                  <button 
                                    className="btn-danger btn-small" 
                                    onClick={() => handleDeleteRoom(flat.id, room.id)}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-muted">No rooms yet. Add one to get started!</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
