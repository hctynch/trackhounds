import axios from 'axios';
import { API_BASE_URL } from '../config';

/** Summaries computed by the server, the report datasets and the saved report layouts. */
class ReportService {
  constructor() {
    this.api = axios.create({ baseURL: `${API_BASE_URL}/reports` });
  }

  async call(request) {
    try {
      const response = await request();
      return response.data;
    } catch (error) {
      return error.response?.data ?? { message: error.message || 'The server could not be reached.' };
    }
  }

  getJudgeSummary() {
    return this.call(() => this.api.get('/judges'));
  }

  getHuntSummary() {
    return this.call(() => this.api.get('/hunt-summary'));
  }

  /** A dataset with its column catalogue; params: day, stake, limit, dog, judge (null = not filtered). */
  getDataset(name, params = {}) {
    const query = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') query[key] = value;
    });
    return this.call(() => this.api.get(`/datasets/${name}`, { params: query }));
  }

  getLayouts() {
    return this.call(() => this.api.get('/custom'));
  }

  getLayout(id) {
    return this.call(() => this.api.get(`/custom/${encodeURIComponent(id)}`));
  }

  saveLayout(id, layout) {
    return this.call(() => this.api.put(`/custom/${encodeURIComponent(id)}`, layout));
  }

  deleteLayout(id) {
    return this.call(() => this.api.delete(`/custom/${encodeURIComponent(id)}`));
  }
}

export default new ReportService();
