import axios from 'axios';

class HuntService {
  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:8080/hunt', // Backend URL running in Docker container
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
