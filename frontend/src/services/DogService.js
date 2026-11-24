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

  async renumberDog(number, newNumber) {
    try {
      const response = await this.api.put(`/${number}/number`, { number: newNumber });
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
      await this.api.delete(`/${number}/scores/${crossId}`);
      return null;
    } catch (error) {
      return error.response.data;
    }
  }

  /**
   * Every cross with its dogs in crossing order, by day, cross time, then order of entry.
   * The highest id is the cross entered last.
   * @param {number} [day] only this day
   * @returns {Promise<Array|Object>} crosses, or an error body
   */
  async getCrosses(day) {
    try {
      const response = await this.api.get('/crosses', { params: day ? { day } : {} });
      return response.data;
    } catch (error) {
      return error.response?.data || { message: 'The crosses could not be loaded.' };
    }
  }

  /**
   * One cross with its dogs in crossing order.
   * @param {number|string} id cross id
   * @returns {Promise<Object>} the cross, or an error body with a message
   */
  async getCrossById(id) {
    try {
      const response = await this.api.get(`/crosses/${id}`);
      return response.data;
    } catch (error) {
      return error.response?.data || { message: 'The cross could not be loaded.' };
    }
  }

  /**
   * Correct a cross: its day, time, judge, dogs and points are replaced.
   * @param {number|string} id cross id
   * @param {Object} cross the corrected cross, in the shape postCross sends
   * @returns {Promise<null|Object>} null when saved, otherwise an error body with fields
   */
  async updateCross(id, cross) {
    try {
      await this.api.put(`/crosses/${id}`, cross);
      return null;
    } catch (error) {
      return error.response?.data || { message: 'The cross could not be saved.' };
    }
  }

  /**
   * Delete a cross with every score in it.
   * @param {number|string} id cross id
   * @returns {Promise<null|Object>} null when deleted, otherwise an error body
   */
  async removeCross(id) {
    try {
      await this.api.delete(`/crosses/${id}`);
      return null;
    } catch (error) {
      return error.response?.data || { message: 'The cross could not be deleted.' };
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

  /**
   * Correct a day's start time; the day's crosses are re-sorted into intervals.
   * @param {number} day
   * @param {string} startTime HH:mm or HH:mm:ss
   * @returns {Promise<string|Object>} the new start time, or an error body with fields
   */
  async changeStartTime(day, startTime) {
    try {
      const response = await this.api.put(`/day/${day}`, { startTime });
      return response.data;
    } catch (error) {
      return error.response?.data || { message: 'The start time could not be changed.' };
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
    } catch {
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
      const filteredNumbers = dogNumbers.map((num) => String(num ?? "").trim()).filter((num) => num !== "");
      
      // If no dogs, return empty array
      if (filteredNumbers.length === 0) {
        return [];
      }
      
      // 0 is a real value for both (a hunt can give every dog the same points), so only a
      // missing value falls back to the usual 35 and 5.
      const request = {
        dogNumbers: filteredNumbers,
        startingPoints: Number.isFinite(Number(startingPoints)) ? Number(startingPoints) : 35,
        interval: Number.isFinite(Number(interval)) ? Number(interval) : 5,
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
