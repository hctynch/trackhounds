import axios from 'axios';
import { API_BASE_URL } from '../config';

/** Special awards given to dogs ("Best Mouth", "Classiest Hound"). */
class AwardService {
  constructor() {
    this.api = axios.create({ baseURL: `${API_BASE_URL}/awards` });
  }

  async call(request) {
    try {
      const response = await request();
      return response.data;
    } catch (error) {
      return error.response?.data ?? { message: error.message || 'The server could not be reached.' };
    }
  }

  /** Every award with the dog it went to. */
  getAwards() {
    return this.call(() => this.api.get(''));
  }

  /** Give an award: { title, dogNumber, notes }. Returns the stored award, or an error body with fields. */
  createAward(award) {
    return this.call(() => this.api.post('', award));
  }

  updateAward(id, award) {
    return this.call(() => this.api.put(`/${id}`, award));
  }

  deleteAward(id) {
    return this.call(() => this.api.delete(`/${id}`));
  }
}

export default new AwardService();
