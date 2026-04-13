const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API Error');
    }

    return data;
  }

 
  flats = {
    create: (payload) => this.request('/flats', { method: 'POST', body: JSON.stringify(payload) }),
    getAll: () => this.request('/flats'),
    getById: (id) => this.request(`/flats/${id}`),
    update: (id, payload) => this.request(`/flats/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id) => this.request(`/flats/${id}`, { method: 'DELETE' }),
  };


  rooms = {
    create: (payload) => this.request('/rooms', { method: 'POST', body: JSON.stringify(payload) }),
    getAll: () => this.request('/rooms'),
    getByFlat: (flat_id) => this.request(`/rooms/flat/${flat_id}`),
    getById: (id) => this.request(`/rooms/${id}`),
    update: (id, payload) => this.request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id) => this.request(`/rooms/${id}`, { method: 'DELETE' }),
  };


  beds = {
    create: (payload) => this.request('/beds', { method: 'POST', body: JSON.stringify(payload) }),
    getAll: () => this.request('/beds'),
    getByRoom: (room_id) => this.request(`/beds/room/${room_id}`),
    getById: (id) => this.request(`/beds/${id}`),
    updateStatus: (id, status) => this.request(`/beds/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (id) => this.request(`/beds/${id}`, { method: 'DELETE' }),
  };


  tenants = {
    create: (payload) => this.request('/tenants', { method: 'POST', body: JSON.stringify(payload) }),
    getAll: () => this.request('/tenants'),
    getById: (id) => this.request(`/tenants/${id}`),
    update: (id, payload) => this.request(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id) => this.request(`/tenants/${id}`, { method: 'DELETE' }),
    assign: (payload) => this.request('/tenants/assign', { method: 'POST', body: JSON.stringify(payload) }),
    remove: (assignment_id) => this.request(`/tenants/assignment/${assignment_id}/remove`, { method: 'PUT' }),
    reassign: (payload) => this.request('/tenants/reassign', { method: 'POST', body: JSON.stringify(payload) }),
  };

  
  dashboard = {
    getOccupancy: () => this.request('/dashboard/occupancy'),
  };
}

export default new ApiService();
