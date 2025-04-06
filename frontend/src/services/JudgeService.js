import axios from 'axios';
import { API_BASE_URL } from '../config'; // Import the API base URL from the config file
class JudgeService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/judges`, // Backend URL running in Docker container
    });
  }

  async getJudges() {
    try {
      const response = await this.api.get();
      return response.data;
    } catch (error) {
      return error;
    }
  }

  async getJudgeTotal() {
    try {
      const response = await this.api.get('/total');
      return response.data;
    } catch (error) {
      return error;
    }
  }

  async getJudgeByNumber(number) {
    try {
      const response = await this.api.get(`/${number}`);
      return response.data;
    } catch (error) {
      return error;
    }
  }

  async createJudge(judgeData) {
    try {
      const response = await this.api.post('', judgeData);
      return response.data;
    } catch (error) {
      return error;
    }
  }

  async editJudge(editJudge) {
    try {
      const response = await this.api.put('', editJudge);
      return response.data;
    } catch (error) {
      return error;
    }
  }

  async deleteJudge(number) {
    try {
      const response = await this.api.delete(`/${number}`);
      return response.data;
    } catch (error) {
      return error;
    }
  }
}

export default new JudgeService();
