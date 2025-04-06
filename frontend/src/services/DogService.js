import axios from 'axios';
import { API_BASE_URL } from '../config';

class DogService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/dogs`, // Use the config value instead of hardcoded URL
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

  async getTopScoringDogsByStakeType(stakeType, limit) {
    try {
      const response = await this.api.get(`/scores/stake/${stakeType}/top/${limit}`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async getTop10ScoringDogsByStakeType(stakeType) {
    try {
      const response = await this.api.get(`/scores/stake/${stakeType}/top10`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async getTopScoringDogsByDayAndStakeType(day, stakeType, limit) {
    try {
      const response = await this.api.get(`/scores/day/${day}/stake/${stakeType}/top/${limit}`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  async getTop10ScoringDogsByDayAndStakeType(day, stakeType) {
    try {
      const response = await this.api.get(`/scores/day/${day}/stake/${stakeType}/top10`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  // Add a new method for getting top dogs overall with any limit
  async getTopScoringDogsOverall(limit) {
    try {
      // Use the existing endpoint but with a custom limit
      const response = await this.api.get(`/scores/top/${limit}/overall`);
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist yet, fall back to top10 and slice
      try {
        const response = await this.api.get(`/scores/top10/overall`);
        return response.data.slice(0, limit);
      } catch (innerError) {
        return innerError.response.data;
      }
    }
  }

  /**
   * Get all scores for a specific dog
   * @param {number} dogNumber - The dog number
   * @returns {Promise<Array>} List of scores
   */
  async getScoresByDogNumber(dogNumber) {
    try {
      const response = await this.api.get(`/${dogNumber}/scores`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  /**
   * Get all scores
   * @returns {Promise<Array>} List of scores
   */
  async getScores() {
    try {
      const response = await this.api.get(`/scores`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  /**
   * Get all scores
   * @returns {Promise<Array>} List of scores
   */
  async getScoresByDay(day) {
    try {
      const response = await this.api.get(`/scores/${day}`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  /**
   * Get all scores for a specific judge
   * @param {number} judgeNumber - The judge number
   * @returns {Promise<Array>} List of scores
   */
  async getScoresByJudgeNumber(judgeNumber) {
    try {
      const response = await this.api.get(`/scores/judge/${judgeNumber}`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  /**
   * Get all scores for a specific dog on a specific day
   * @param {number} dogNumber - The dog number
   * @param {number} day - The day number (1-4)
   * @returns {Promise<Array>} List of scores
   */
  async getScoresByDogNumberAndDay(dogNumber, day) {
    try {
      const response = await this.api.get(`/${dogNumber}/scores/day/${day}`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  /**
   * Get all scores for a specific judge on a specific day
   * @param {number} judgeNumber - The judge number
   * @param {number} day - The day number (1-4)
   * @returns {Promise<Array>} List of scores
   */
  async getScoresByJudgeNumberAndDay(judgeNumber, day) {
    try {
      const response = await this.api.get(`/scores/judge/${judgeNumber}/day/${day}`);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  /**
   * Get point information for dogs in a cross
   * @param {number[]} dogNumbers - Array of dog numbers in cross order
   * @param {number} startingPoints - Starting points for first dog
   * @param {number} interval - Interval of points between dogs
   * @param {string} stakeType - Type of stake (ALL_AGE, DERBY, DUAL)
   * @returns {Promise<Array>} List of dog information with points
   */
  async getCrossInfo(dogNumbers, startingPoints, interval, stakeType = 'ALL_AGE') {
    try {
      // Filter out empty entries and ensure numbers are valid
      const filteredNumbers = dogNumbers
        .filter(num => num && num.toString().trim() !== '')
        .map(num => parseInt(num, 10));
      
      // If no dogs, return empty array
      if (filteredNumbers.length === 0) {
        return [];
      }
      
      const request = {
        dogNumbers: filteredNumbers,
        startingPoints: startingPoints || 35, // Default to 35 if not specified
        interval: interval || 5,        // Default to 5 if not specified
        stakeType: stakeType || 'ALL_AGE'  // Default to ALL_AGE if not specified
      };
      
      const response = await this.api.post('/cross-info', request);
      return response.data;
    } catch (error) {
      console.error("Error in getCrossInfo:", error);
      return error.response?.data || [];
    }
  }
}

export default new DogService();
