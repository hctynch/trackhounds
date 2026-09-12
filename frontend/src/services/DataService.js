import axios from 'axios';
import { API_BASE_URL } from '../config';

/** Backups, restores and past hunts. Every call returns the server's error body on failure. */
class DataService {
  constructor() {
    this.api = axios.create({ baseURL: `${API_BASE_URL}/data` });
  }

  async call(request) {
    try {
      const response = await request();
      return response.data;
    } catch (error) {
      return error.response?.data ?? { message: error.message || 'The server could not be reached.' };
    }
  }

  getStatus() {
    return this.call(() => this.api.get(''));
  }

  getBackups() {
    return this.call(() => this.api.get('/backups'));
  }

  createBackup() {
    return this.call(() => this.api.post('/backups'));
  }

  /** The address the browser downloads a fresh copy from. */
  downloadUrl() {
    return `${API_BASE_URL}/data/backups/download`;
  }

  restoreBackup(fileName) {
    return this.call(() => this.api.post(`/backups/${encodeURIComponent(fileName)}/restore`));
  }

  deleteBackup(fileName) {
    return this.call(() => this.api.delete(`/backups/${encodeURIComponent(fileName)}`));
  }

  restore(file) {
    const form = new FormData();
    form.append('file', file);
    return this.call(() => this.api.post('/restore', form));
  }

  getHunts() {
    return this.call(() => this.api.get('/hunts'));
  }

  archiveCurrentHunt() {
    return this.call(() => this.api.post('/hunts'));
  }

  importHunt(file) {
    const form = new FormData();
    form.append('file', file);
    return this.call(() => this.api.post('/hunts/import', form));
  }

  openHunt(fileName) {
    return this.call(() => this.api.post(`/hunts/${encodeURIComponent(fileName)}/open`));
  }

  deleteHunt(fileName) {
    return this.call(() => this.api.delete(`/hunts/${encodeURIComponent(fileName)}`));
  }

  /** Ask the desktop application to open a folder (data, backups, hunts) or the log file. */
  async openFolder(target) {
    try {
      const response = await axios.post(`${API_BASE_URL}/app/open/${target}`);
      return response.data;
    } catch (error) {
      return error.response?.data ?? { message: error.message };
    }
  }
}

export default new DataService();
