import DogService from '../../services/DogService';
import { dogNumberLabel } from './format';

const columns = ['Dog', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Total'];
const columnGroups = [
  { title: 'Speed and drive', span: 4, startIndex: 1 },
  { title: 'Endurance', span: 4, startIndex: 5 },
];

const ComprehensiveDogScoresReport = {
  title: 'All dogs, all days',
  description: 'Speed and drive and endurance for every dog on every day, in dog number order.',

  fetchData: async () => {
    try {
      const dogs = await DogService.getDogs();
      const byDog = {};
      (Array.isArray(dogs) ? dogs : []).forEach((dog) => {
        byDog[dog.number] = {
          dogNumber: dog.number,
          scratched: dog.scratched,
          sd: { 1: 0, 2: 0, 3: 0, 4: 0 },
          endurance: { 1: 0, 2: 0, 3: 0, 4: 0 },
          total: 0,
        };
      });

      for (let day = 1; day <= 4; day += 1) {
        const scores = await DogService.getDogScoresByDay(day);
        (Array.isArray(scores) ? scores : []).forEach((score) => {
          const entry = byDog[score.dogNumber];
          if (!entry) return;
          const sd = score.totalPoints || 0;
          const endurance = score.endurance ?? Math.floor((sd * day) / 10);
          entry.sd[day] = sd;
          entry.endurance[day] = endurance;
          entry.total += sd + endurance;
        });
      }

      return {
        title: 'All dogs, all days',
        columns,
        columnGroups,
        data: Object.values(byDog).map((entry) => [
          dogNumberLabel(entry),
          ...[1, 2, 3, 4].map((day) => entry.sd[day].toString()),
          ...[1, 2, 3, 4].map((day) => entry.endurance[day].toString()),
          entry.total.toString(),
        ]),
      };
    } catch (error) {
      console.error('Error building the all-dogs report:', error);
      return { title: 'All dogs, all days', columns, columnGroups, data: [] };
    }
  },
};

export default ComprehensiveDogScoresReport;
