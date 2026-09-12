import axios from 'axios';
import { API_BASE_URL } from '../config';

/** Summaries computed by the server for the printed sheets. */
class ReportService {
  constructor() {
    this.api = axios.create({ baseURL: `${API_BASE_URL}/reports` });
  }

  async getJudgeSummary() {
    try {
      const response = await this.api.get('/judges');
      return response.data;
    } catch (error) {
      return error.response?.data ?? error;
    }
  }

  async getHuntSummary() {
    try {
      const response = await this.api.get('/hunt-summary');
      return response.data;
    } catch (error) {
      return error.response?.data ?? error;
    }
  }
}

export default new ReportService();
