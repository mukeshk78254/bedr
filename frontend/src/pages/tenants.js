import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [beds, setBeds] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [flats, setFlats] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  
  const [createFormData, setCreateFormData] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [tenantsData, flatsData, bedsData, roomsData] = await Promise.all([
        api.tenants.getAll(),
        api.flats.getAll(),
        api.beds.getAll ? api.beds.getAll() : { data: [] },
        api.rooms.getAll ? api.rooms.getAll() : { data: [] }
      ]);
      setTenants(tenantsData.data || []);
      setFlats(flatsData.data || []);
      setBeds(bedsData.data || []);
      setRooms(roomsData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    if (!createFormData.name || !createFormData.phone) {
      setError('Please fill required fields');
      return;
    }
    try {
      await api.tenants.create(createFormData);
      setSuccess(' Tenant created successfully!');
      setCreateFormData({ name: '', email: '', phone: '' });
      setShowCreateForm(false);
      fetchAllData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignTenant = async (e) => {
    e.preventDefault();
    if (!selectedBedId) {
      setError('Please select a bed');
      return;
    }
    try {
      await api.tenants.assign({
        tenant_id: selectedTenantId,
        bed_id: parseInt(selectedBedId)
      });
      setSuccess(' Tenant assigned to bed!');
      setShowAssignForm(false);
      setSelectedTenantId(null);
      setSelectedBedId('');
      fetchAllData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveFromBed = async (assignmentId) => {
    if (!confirm('Remove tenant from bed?')) return;
    try {
      await api.tenants.remove(assignmentId);
      setSuccess(' Tenant removed from bed!');
      fetchAllData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTenant = async (id) => {
    if (!confirm('Delete this tenant? They must not be assigned to a bed.')) return;
    try {
      await api.tenants.delete(id);
      setSuccess(' Tenant deleted!');
      fetchAllData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const getAvailableBeds = () => {
    return beds.filter(bed => bed.status === 'Available');
  };

  const getRoomsForFlat = (flatId) => {
    return rooms.filter(room => room.flat_id === parseInt(flatId));
  };

  const getBedsForRoom = (roomId) => {
    return getAvailableBeds().filter(bed => bed.room_id === parseInt(roomId));
  };

  const unassignedTenants = tenants.filter(t => !t.bed_id);
  const assignedTenants = tenants.filter(t => t.bed_id);

  return (
    <div className="container">
      <header>
        <h1> BedR - Property Management</h1>
        <nav>
          <Link href="/"> Dashboard</Link>
          <Link href="/flats"> Flats</Link>
          <Link href="/tenants"> Tenants</Link>
        </nav>
      </header>

      <main>
        <div className="section">
          <h2>Tenant Management</h2>

          {error && <div className="error"> {error}</div>}
          {success && <div className="success">{success}</div>}

          <div className="button-group">
            <button className="btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? '✖ Cancel' : '+ Add Tenant'}
            </button>
            <button className="btn-info" onClick={() => setShowAssignForm(!showAssignForm)}>
              {showAssignForm ? '✖ Cancel' : ' Assign to Bed'}
            </button>
          </div>

          {showCreateForm && (
            <div className="card" style={{ marginTop: '20px' }}>
              <h3>Create New Tenant</h3>
              <form onSubmit={handleCreateTenant}>
                <div className="form-group">
                  <label>Name * <span className="text-muted">(Real name with legal title)</span></label>
                  <input
                    type="text"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    placeholder="e.g., Ramesh Kumar"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                      placeholder="tenant@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone * <span className="text-muted">(10-digit number)</span></label>
                    <input
                      type="tel"
                      value={createFormData.phone}
                      onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                      placeholder="9876543210"
                      pattern="\d{10}"
                      required
                    />
                  </div>
                </div>
                <div className="button-group">
                  <button type="submit" className="btn-success">✓ Create Tenant</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {showAssignForm && (
            <div className="card" style={{ marginTop: '20px' }}>
              <h3>Assign Tenant to Bed</h3>
              <form onSubmit={handleAssignTenant}>
                <div className="form-group">
                  <label>Select Tenant *</label>
                  <select
                    value={selectedTenantId || ''}
                    onChange={(e) => setSelectedTenantId(parseInt(e.target.value))}
                    required
                  >
                    <option value="">-- Choose a tenant --</option>
                    {unassignedTenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        #{tenant.id} - {tenant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Select Flat *</label>
                    <select
                      value={selectedFlatId}
                      onChange={(e) => {
                        setSelectedFlatId(e.target.value);
                        setSelectedRoomId('');
                        setSelectedBedId('');
                      }}
                      required
                    >
                      <option value="">-- Choose a flat --</option>
                      {flats.map(flat => (
                        <option key={flat.id} value={flat.id}>
                          {flat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Select Room *</label>
                    <select
                      value={selectedRoomId}
                      onChange={(e) => {
                        setSelectedRoomId(e.target.value);
                        setSelectedBedId('');
                      }}
                      disabled={!selectedFlatId}
                      required
                    >
                      <option value="">-- Choose a room --</option>
                      {getRoomsForFlat(selectedFlatId).map(room => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Select Available Bed *</label>
                  <select
                    value={selectedBedId}
                    onChange={(e) => setSelectedBedId(e.target.value)}
                    disabled={!selectedRoomId}
                    required
                  >
                    <option value="">-- Choose a bed --</option>
                    {getBedsForRoom(selectedRoomId).map(bed => (
                      <option key={bed.id} value={bed.id}>
                        Bed #{bed.id} ({bed.room_name})
                      </option>
                    ))}
                  </select>
                </div>

                {getBedsForRoom(selectedRoomId).length === 0 && selectedRoomId && (
                  <div className="alert alert-warning">
                     No available beds in this room
                  </div>
                )}

                <div className="button-group">
                  <button type="submit" className="btn-success" disabled={!selectedBedId}>✓ Assign Tenant</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowAssignForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading tenants...</div>
          ) : (
            <>
              <div className="section" style={{ marginTop: '40px' }}>
                <h3> Assigned Tenants ({assignedTenants.length})</h3>
                {assignedTenants.length === 0 ? (
                  <p className="text-muted">No tenants assigned to beds yet.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Bed Status</th>
                        <th>Room</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedTenants.map(tenant => (
                        <tr key={tenant.id}>
                          <td><strong>#{tenant.id}</strong></td>
                          <td>{tenant.name}</td>
                          <td><code>{tenant.phone}</code></td>
                          <td className="text-muted" style={{ fontSize: '12px' }}>{tenant.email || '—'}</td>
                          <td>
                            <span className="badge" style={{ backgroundColor: '#28a745', color: 'white' }}>
                              Bed #{tenant.bed_id} - {tenant.bed_status}
                            </span>
                          </td>
                          <td className="text-muted">{tenant.room_name || '—'}</td>
                          <td>
                            <button 
                              className="btn-danger btn-small" 
                              onClick={() => handleRemoveFromBed(tenant.assignment_id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="section">
                <h3> Unassigned Tenants ({unassignedTenants.length})</h3>
                {unassignedTenants.length === 0 ? (
                  <p className="text-muted">All tenants have been assigned!</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unassignedTenants.map(tenant => (
                        <tr key={tenant.id}>
                          <td><strong>#{tenant.id}</strong></td>
                          <td>{tenant.name}</td>
                          <td><code>{tenant.phone}</code></td>
                          <td className="text-muted">{tenant.email || '—'}</td>
                          <td>
                            <button 
                              className="btn-danger btn-small" 
                              onClick={() => handleDeleteTenant(tenant.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
              