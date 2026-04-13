import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../utils/api';

export default function FlatDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [flat, setFlat] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [roomData, setRoomData] = useState({ name: '', max_bed_capacity: 1 });

  useEffect(() => {
    if (!id) return;
    fetchFlatDetails();
  }, [id]);

  const fetchFlatDetails = async () => {
    try {
      setLoading(true);
      const flatRes = await api.flats.getById(id);
      setFlat(flatRes.data);
      
      const roomsRes = await api.rooms.getByFlat(id);
      setRooms(roomsRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await api.rooms.create({
        ...roomData,
        flat_id: parseInt(id),
        max_bed_capacity: parseInt(roomData.max_bed_capacity)
      });
      setSuccess('Room created successfully!');
      setRoomData({ name: '', max_bed_capacity: 1 });
      setShowRoomForm(false);
      fetchFlatDetails();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Delete this room? All beds and assignments will be removed.')) return;
    try {
      await api.rooms.delete(roomId);
      setSuccess('Room deleted successfully!');
      fetchFlatDetails();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!id) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <header>
        <h1>🏠 BedR - Property Management</h1>
        <nav>
          <Link href="/flats">Flats</Link>
          <Link href="/tenants">Tenants</Link>
          <Link href="/">Dashboard</Link>
        </nav>
      </header>

      <main>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {loading ? (
          <div className="loading">Loading flat details...</div>
        ) : flat ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <Link href="/flats">← Back to Flats</Link>
            </div>

            <div className="section">
              <h2>Flat: {flat.name}</h2>
              <p><strong>Address:</strong> {flat.address}</p>
              <p><strong>Created:</strong> {new Date(flat.created_at).toLocaleDateString()}</p>
            </div>

            <div className="section">
              <h2>Rooms in {flat.name}</h2>
              
              <button onClick={() => setShowRoomForm(!showRoomForm)} style={{ marginBottom: '20px' }}>
                {showRoomForm ? '✕ Cancel' : '+ Add Room'}
              </button>

              {showRoomForm && (
                <form onSubmit={handleCreateRoom}>
                  <div className="form-group">
                    <label>Room Name</label>
                    <input
                      type="text"
                      value={roomData.name}
                      onChange={(e) => setRoomData({ ...roomData, name: e.target.value })}
                      required
                      placeholder="e.g. Room 1, Master Bedroom"
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Bed Capacity</label>
                    <input
                      type="number"
                      value={roomData.max_bed_capacity}
                      onChange={(e) => setRoomData({ ...roomData, max_bed_capacity: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                  <button type="submit">✓ Create Room</button>
                </form>
              )}

              {rooms.length === 0 ? (
                <p>No rooms yet. Add one above.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Room Name</th>
                      <th>Max Capacity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map(room => (
                      <tr key={room.id}>
                        <td>{room.name}</td>
                        <td>{room.max_bed_capacity} beds</td>
                        <td>
                          <div className="button-group">
                            <Link href={`/rooms/${room.id}`}>
                              <button className="btn-secondary">View</button>
                            </Link>
                            <button 
                              onClick={() => handleDeleteRoom(room.id)}
                              className="btn-danger"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <p>Flat not found.</p>
        )}
      </main>
    </div>
  );
}
