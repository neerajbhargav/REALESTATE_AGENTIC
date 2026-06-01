import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const startAnalysis = async (address) => {
  const { data } = await axios.post(`${API}/analyze`, { address }, { timeout: 30000 });
  return data; // { job_id, status }
};

export const getJob = async (jobId) => {
  const { data } = await axios.get(`${API}/jobs/${jobId}`, { timeout: 30000 });
  return data; // { status, report?, error? }
};

export const fetchReports = async () => {
  const { data } = await axios.get(`${API}/reports`);
  return data.reports || [];
};

export const fetchReport = async (id) => {
  const { data } = await axios.get(`${API}/reports/${id}`);
  return data;
};

export const checkHealth = async () => {
  const { data } = await axios.get(`${API}/health`);
  return data;
};
