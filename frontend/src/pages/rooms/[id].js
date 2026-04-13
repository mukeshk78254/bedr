import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../utils/api';

export default function RoomDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [room, setRoom] = useState(null);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchRoomDetails();
  }, [id]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const roomRes = await api.rooms.getById(id);
      setRoom(roomRes.data);
      
      const bedsRes = await api.beds.getByRoom(id);
      setBeds(bedsRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBed = async () => {
    try {
      await api.beds.create({ room_id: parseInt(id) });
      setSuccess('Bed added successfully!');
      fetchRoomDetails();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteBed = async (bedId) => {
    if (!confirm('Delete this bed?')) return;
    try {
      await api.beds.delete(bedId);
      setSuccess('Bed deleted!');
      fetchRoomDetails();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBedStatusChange = async (bedId, newStatus) => {
    try {
      await api.beds.updateStatus(bedId, newStatus);
      setSuccess('Bed status updated!');
      fetchRoomDetails();
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
          <div className="loading">Loading room details...</div>
        ) : room ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <Link href={`/flats/${room.flat_id}`}>← Back</Link>
            </div>

            <div className="section">
              <h2>Room: {room.name}</h2>
              <p><strong>Max Capacity:</strong> {room.max_bed_capacity} beds</p>
              <p><strong>Current Beds:</strong> {beds.length}</p>
            </div>

            <div className="section">
              <h2>Beds</h2>
              
              <button 
                onClick={handleAddBed}
                disabled={beds.length >= room.max_bed_capacity}
                style={{ 
                  marginBottom: '20px',
                  opacity: beds.length >= room.max_bed_capacity ? 0.5 : 1,
                  cursor: beds.length >= room.max_bed_capacity ? 'not-allowed' : 'pointer'
                }}
              >
                + Add Bed
              </button>

              {beds.length === 0 ? (
                <p>No beds yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Bed ID</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beds.map(bed => (
                      <tr key={bed.id}>
                        <td>#{bed.id}</td>
                        <td>
                          <span className={`badge ${bed.status.toLowerCase().replace(' ', '-')}`}>
                            {bed.status}
                          </span>
                        </td>
                        <td>
                          <div className="button-group">
                            <select
                              value={bed.status}
                              onChange={(e) => handleBedStatusChange(bed.id, e.target.value)}
                              style={{ padding: '8px', borderRadius: '4px' }}
                            >
                              <option value="Available">Available</option>
                              <option value="Occupied">Occupied</option>
                              <option value="Under Maintenance">Under Maintenance</option>
                            </select>
                            <button 
                              onClick={() => handleDeleteBed(bed.id)}
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
          <p>Room not found.</p>
        )}
      </main>
    </div>
  );
}
