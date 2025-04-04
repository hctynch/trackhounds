import axiosInstance from './axiosConfig';

class JudgeService {
  constructor() {
    this.api = axiosInstance;
    this.baseUrl = '/api/judges';  // Add /api prefix
  }

  async getJudges() {
    try {
      const response = await this.api.get(this.baseUrl);
      return response.data;
    } catch (error) {
      return error.response?.data;
    }
  }

  async getJudgeTotal() {
    try {
      const response = await this.api.get(`${this.baseUrl}/total`);
      return response.data;
    } catch (error) {
      return error.response?.data;
    }
  }

  async getJudgeByNumber(number) {
    try {
      const response = await this.api.get(`${this.baseUrl}/${number}`);
      return response.data;
    } catch (error) {
      return error.response?.data;
    }
  }

  async createJudge(judgeData) {
    try {
      const response = await this.api.post(this.baseUrl, judgeData);
      return response.data;
    } catch (error) {
      return error.response?.data;
    }
  }

  async editJudge(editJudge) {
    try {
      const response = await this.api.put(this.baseUrl, editJudge);
      return response.data;
    } catch (error) {
      return error.response?.data;
    }
  }

  async deleteJudge(number) {
    try {
      const response = await this.api.delete(`${this.baseUrl}/${number}`);
      return response.data;
    } catch (error) {
      return error.response?.data;
    }
  }
}

export default new JudgeService();
