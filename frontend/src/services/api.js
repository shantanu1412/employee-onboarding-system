import axios from 'axios';

// Base API configuration using Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json'
  }
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format errors and extract data
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    let friendlyMessage = 'Unable to connect to the backend server.';

    if (error.response) {
      friendlyMessage = error.response.data?.message || `Server error: ${error.response.status}`;
    } else if (error.request) {
      friendlyMessage = 'Cannot reach backend server. Please verify Express is running on ' + API_BASE_URL;
    } else {
      friendlyMessage = error.message;
    }

    const enhancedError = new Error(friendlyMessage);
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    enhancedError.data = error.response?.data;

    return Promise.reject(enhancedError);
  }
);

// ==========================================
// 1. Health & Dashboard APIs
// ==========================================
export const healthCheck = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const databaseHealthCheck = async () => {
  const response = await apiClient.get('/health/db');
  return response.data;
};

export const getDashboardOverview = async () => {
  const response = await apiClient.get('/dashboard/overview');
  return response.data;
};

// ==========================================
// 2. Candidate Management APIs
// ==========================================
export const getCandidates = async (params = {}) => {
  const response = await apiClient.get('/candidates', { params });
  return response.data;
};

export const getCandidateOverview = async () => {
  const response = await apiClient.get('/candidates/overview');
  return response.data;
};

export const getCandidateById = async (id) => {
  const response = await apiClient.get(`/candidates/${id}`);
  return response.data;
};

export const createCandidate = async (candidateData) => {
  const response = await apiClient.post('/candidates', candidateData);
  return response.data;
};

export const updateCandidate = async (id, candidateData) => {
  const response = await apiClient.put(`/candidates/${id}`, candidateData);
  return response.data;
};

export const deleteCandidate = async (id) => {
  const response = await apiClient.delete(`/candidates/${id}`);
  return response.data;
};

// ==========================================
// 3. Document Management APIs
// ==========================================
export const getAllDocuments = async (status = 'all') => {
  const response = await apiClient.get('/documents', { params: { status } });
  return response.data;
};

export const getCandidateDocuments = async (candidateId) => {
  const response = await apiClient.get(`/candidates/${candidateId}/documents`);
  return response.data;
};

export const uploadCandidateDocument = async (candidateId, formData) => {
  const response = await apiClient.post(`/candidates/${candidateId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const updateDocumentStatus = async (documentId, { verification_status, remarks }) => {
  const response = await apiClient.put(`/documents/${documentId}`, {
    verification_status,
    remarks
  });
  return response.data;
};

export const deleteDocument = async (documentId) => {
  const response = await apiClient.delete(`/documents/${documentId}`);
  return response.data;
};

export const getDocumentFileUrl = (documentId) => {
  return `${API_BASE_URL}/documents/${documentId}/file`;
};

// ==========================================
// 4. Joining Management APIs
// ==========================================
export const getAllJoiningDetails = async () => {
  const response = await apiClient.get('/joining');
  return response.data;
};

export const getJoiningByCandidate = async (candidateId) => {
  const response = await apiClient.get(`/candidates/${candidateId}/joining`);
  return response.data;
};

export const saveJoiningDetails = async (candidateId, joiningData) => {
  const response = await apiClient.post(`/candidates/${candidateId}/joining`, joiningData);
  return response.data;
};

// ==========================================
// 5. Induction Management APIs
// ==========================================
export const getAllInductions = async () => {
  const response = await apiClient.get('/induction');
  return response.data;
};

export const getInductionByCandidate = async (candidateId) => {
  const response = await apiClient.get(`/candidates/${candidateId}/induction`);
  return response.data;
};

export const saveInduction = async (candidateId, inductionData) => {
  const response = await apiClient.post(`/candidates/${candidateId}/induction`, inductionData);
  return response.data;
};

// Service aliases
export const healthService = {
  checkHealth: healthCheck,
  checkDbHealth: databaseHealthCheck
};

export const candidateService = {
  getAllCandidates: getCandidates,
  getOverview: getCandidateOverview,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate
};

export default apiClient;
