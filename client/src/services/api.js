import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"  // This should stay 5000 (backend port)
});

export default API;