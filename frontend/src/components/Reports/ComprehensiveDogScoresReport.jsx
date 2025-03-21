import DogService from '../../services/DogService';

const ComprehensiveDogScoresReport = {
  title: 'Comprehensive Dog Scores',
  description: 'View all dogs with their daily S&D and endurance scores',
  
  fetchData: async () => {
    try {
      // Get all dogs
      const dogs = await DogService.getDogs();
      
      // Create a map to organize scores by dog
      const dogScoresMap = {};
      
      // Initialize the map with all dogs
      dogs.forEach(dog => {
        dogScoresMap[dog.number] = {
          dogNumber: dog.number,
          dogName: dog.name,
          scores: {
            1: { sd: 0, endurance: 0 },
            2: { sd: 0, endurance: 0 },
            3: { sd: 0, endurance: 0 },
            4: { sd: 0, endurance: 0 }
          },
          totalSD: 0,
          totalEndurance: 0,
          grandTotal: 0
        };
      });
      
      // Get scores for each day and populate the map
      for (let day = 1; day <= 4; day++) {
        const scores = await DogService.getDogScoresByDay(day);
        
        scores.forEach(score => {
          console.log(score)
          if (dogScoresMap[score.dogNumber]) {
            // Add S&D score for this day
            dogScoresMap[score.dogNumber].scores[day].sd = score.totalPoints || 0;
            dogScoresMap[score.dogNumber].totalSD += score.totalPoints
            
            // Calculate endurance (percentage increases by 10% each day)
            const endurancePercent = day * 0.1;
            dogScoresMap[score.dogNumber].scores[day].endurance = 
              Number.parseInt(score.totalPoints * endurancePercent);
              dogScoresMap[score.dogNumber].totalEndurance += Number.parseInt(score.totalPoints * endurancePercent);
            
          }
        });
      }
      
      // Calculate grand totals and sort dogs by total score
      const sortedDogs = Object.values(dogScoresMap)
        .map(dog => {
          dog.grandTotal = dog.totalSD + dog.totalEndurance;
          return dog;
        })
      
      // Format the data for display
      const formattedData = sortedDogs.map(dog => [
        dog.dogNumber.toString(),
        // S&D columns (one for each day)
        dog.scores[1].sd.toString(),
        dog.scores[2].sd.toString(),
        dog.scores[3].sd.toString(),
        dog.scores[4].sd.toString(),
        // Endurance columns (one for each day)
        dog.scores[1].endurance.toString(),
        dog.scores[2].endurance.toString(),
        dog.scores[3].endurance.toString(),
        dog.scores[4].endurance.toString(),
        // Total column
        dog.grandTotal.toString()
      ]);
      
      return {
        title: 'Comprehensive Dog Scores Report',
        columns: [
          'Dog #', 
          'S&D 1', 'S&D 2', 'S&D 3', 'S&D 4',  // S&D columns
          'E 1', 'E 2', 'E 3', 'E 4',  // Endurance columns
          'Total'
        ],
        columnGroups: [
          { title: 'S&D', span: 4, startIndex: 1 },
          { title: 'Endurance', span: 4, startIndex: 5 }
        ],
        data: formattedData
      };
    } catch (error) {
      console.error("Error fetching comprehensive dog scores:", error);
      return {
        title: 'Comprehensive Dog Scores Report',
        columns: [
          'Dog #', 
          'S&D 1', 'S&D 2', 'S&D 3', 'S&D 4',
          'E 1', 'E 2', 'E 3', 'E 4',
          'Total'
        ],
        columnGroups: [
          { title: 'S&D', span: 4, startIndex: 1 },
          { title: 'Endurance', span: 4, startIndex: 5 }
        ],
        data: []
      };
    }
  }
};

export default ComprehensiveDogScoresReport;