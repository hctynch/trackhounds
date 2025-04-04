import axiosInstance from './axiosConfig';

class HuntService {
  constructor() {
    this.api = axiosInstance;
    this.baseUrl = '/api/hunt';  // Add /api prefix
  }

  async getHunt() {
    try {
      const response = await this.api.get(this.baseUrl);  // Added this.baseUrl
      return response.data;
    } catch (error) {
      return error.response?.data;  // Added .response?.data for safer error handling
    }
  }

  async createHunt(huntData) {
    try {
      const response = await this.api.post(this.baseUrl, huntData);  // Added this.baseUrl
      return response.data;
    } catch (error) {
      return error.response?.data;
    }
  }

  async editHunt(editHunt) {
    try {
      const response = await this.api.put(this.baseUrl, editHunt);  // Added this.baseUrl
      return response.data;
    } catch (error) {
      return error.response?.data;
    }
  }
}

export default new HuntService();
