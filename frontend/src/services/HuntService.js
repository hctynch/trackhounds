import axios from 'axios';
import { API_BASE_URL } from '../config';

class HuntService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/hunt`, // Backend URL running in Docker container
    });
  }

  async getHunt() {
    try {
      const response = await this.api.get();
      return response.data;
    } catch (error) {
      return error;
    }
  }

  async createHunt(huntData) {
    try {
      const response = await this.api.post('', huntData);
      return response.data;
    } catch (error) {
      return error;
    }
  }

  async editHunt(editHunt) {
    try {
      const response = await this.api.put('', editHunt);
      return response.data;
    } catch (error) {
      return error;
    }
  }
}

export default new HuntService();
