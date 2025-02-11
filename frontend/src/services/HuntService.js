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
            console.error('Error fetching hunt:', error);
            return error;
        }
    }

    async createHunt(huntData) {
        try {
            const response = await this.api.post('', huntData);
            return response.data;
        } catch (error) {
            console.error('Error creating hunt:', error);
            return error;
        }
    }

    async editHunt(fields) {
        try {
            const response = await this.api.put('', fields);
            return response.data;
        } catch (error) {
            console.error('Error editing hunt:', error);
            return error;
        }
    }

    async setStakes(stakesData) {
        try {
            const response = await this.api.put('/stakes', stakesData);
            return response.data;
        } catch (error) {
            console.error('Error setting stakes:', error);
            return error;
        }
    }
}

export default new HuntService();