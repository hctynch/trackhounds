import axios from 'axios';

class DogService {
  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:8080/dogs', // Backend URL running in Docker container
    });
  }

  async getDogs() {
    try {
      const response = await this.api.get();
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async getDogTotal() {
    try {
      const response = await this.api.get('/total');
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async getDogByNumber(number) {
    try {
      const response = await this.api.get(`/${number}`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async createDogs(dogsData) {
    try {
      const response = await this.api.post('', dogsData);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async editDog(editDog) {
    try {
      const response = await this.api.put('', editDog);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async deleteDog(number) {
    try {
      const response = await this.api.delete(`/${number}`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async postCross(cross) {
    try {
      const response = await this.api.post('/scores', cross);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async deleteCross(number, crossId) {
    try {
      const response = await this.api.delete(`/${number}/scores/${crossId}`);
    } catch (error) {
      return error.response.data;
    }
  }

  async getStartTime(day) {
    try {
      const response = await this.api.get(`/day/${day}`);
      return response.data;
    } catch (error) {
      return error;
    }
  }

  async getScratches() {
    try {
      const response = await this.api.get('/scratches');
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async postScratch(scratch) {
    try {
      const response = await this.api.post('/scratches', scratch);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async deleteScratch(id) {
    try {
      const response = await this.api.delete(`/scratches/${id}`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async getDogScoresByDay(day) {
    try {
      const response = await this.api.get(`/scores/day/${day}`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async getTopScoringDogsByDay(day, limit) {
    try {
      const response = await this.api.get(`/scores/day/${day}/top/${limit}`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async getTop10ScoringDogsByDay(day) {
    try {
      const response = await this.api.get(`/scores/day/${day}/top10`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async getTop10ScoringDogsOverall() {
    try {
      const response = await this.api.get(`/scores/top10/overall`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  // This method will be implemented later when the backend supports it
  async getScratchesByDay(day) {
    try {
      // This endpoint doesn't exist yet, but prepare for future implementation
      const response = await this.api.get(`/scratches/day/${day}`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }
}

export default new DogService();
