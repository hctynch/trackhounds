import { useEffect, useState } from "react";
import { PiX } from "react-icons/pi";
import DogService from "../services/DogService";
import Box from "./Box";

function ViewScores() {
  const [search, setSearch] = useState("");
  const [day, setDay] = useState(1);
  const [dogs, setDogs] = useState([]);

  useEffect(() => {
    const fetchDogs = async () => {
      const response = await DogService.getDogs();
      console.log(response);
      setDogs(response);
    };
    fetchDogs();
  }, [day]);

  const handleDelete = (dogNumber, scoreNumber) => {
    DogService.deleteCross(dogNumber, scoreNumber);
    setDogs((prevDogs) =>
      prevDogs.map((dog) =>
        dog.number === dogNumber
          ? {
              ...dog,
              scores: dog.scores.map((score) =>
                score.day.day === day
                  ? {
                      ...score,
                      timeBucketScores: score.timeBucketScores.filter(
                        (tbs) => tbs.score.id !== scoreNumber
                      ),
                    }
                  : score
              ),
            }
          : dog
      )
    );
  };

  const filteredDogs = dogs.filter((dog) =>
    dog.number.toString().includes(search)
  );

  return (
    <div className="grid text-black ml-[276px] mr-4 min-h-[calc(100vh-1rem)] my-2 relative">
      <Box params="h-full bg-white pt-5 overflow-y-auto">
        <div className="w-full flex items-center border-b-2 border-gray-300 pb-1">
          <p className="text-4xl font-bold">Scores</p>
          <div className="flex ml-auto items-center h-16">
            <input
              type="text"
              placeholder="Search by Number"
              className="border border-black/30 rounded-lg px-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full flex items-center justify-between pt-2">
          <div className="flex items-center text-md">
            <p className="">Day</p>
            <select
              className="border border-black/30 rounded-lg px-1 mx-2"
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>
        </div>
        <Box params="overflow-y-auto w-full p-4 mt-4 mb-4 bg-slate-50 h-full">
          <table className="table-auto w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-md font-semibold text-start">Cross Time</th>
                <th className="text-md font-semibold text-start">Judge #</th>
                <th className="text-md font-semibold text-start">Dog Number & Name</th>
                <th className="text-md font-semibold text-start">Points</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredDogs
                .filter((dog) =>
                  dog.scores.some((score) => score.day.day === day)
                )
                .map((dog) =>
                  dog.scores
                    .filter((score) => score.day.day === day)
                    .flatMap((score) =>
                      score.timeBucketScores.map((tbs, index) => (
                        <tr className="border-y-2 border-gray-200" key={index}>
                          <td className="text-sm text-start">
                            <div className="pr-3">{tbs.score.time}</div>
                          </td>
                          <td className="text-sm text-start">
                            <div className="pr-3">{tbs.score.judgeNumber}</div>
                          </td>
                          <td className="text-sm text-start">
                            <div className="pr-3 flex flex-col">
                              <p>
                                <span className="mr-4">{dog.number}</span>
                                {dog.name}
                              </p>
                            </div>
                          </td>
                          <td className="text-sm text-start">
                            <div className="pr-3">{tbs.score.points}</div>
                          </td>
                          <td className="pl-2 py-2">
                            <div className="flex items-center justify-evenly">
                              <button
                                className="text-sm ml-1 bg-red-300 hover:bg-red-400 rounded-full cursor-pointer px-2 py-2"
                                onClick={() => handleDelete(dog.number, tbs.score.id)}
                              >
                                <PiX className="text-center" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                )}
            </tbody>
          </table>
        </Box>
      </Box>
    </div>
  );
}

export default ViewScores;