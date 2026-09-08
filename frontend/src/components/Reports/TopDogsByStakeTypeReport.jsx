import PropTypes from 'prop-types';
import { useState } from 'react';
import DogService from '../../services/DogService';
import { configShape, OptionsRow, StakeSelect } from './OptionControls';

export const StakeTypeSelector = ({ onChange, config }) => {
  const [stakeType, setStakeType] = useState(config?.stakeType ?? 'ALL_AGE');
  return (
    <OptionsRow>
      <StakeSelect
        value={stakeType}
        allowAll={false}
        onChange={(value) => {
          setStakeType(value);
          onChange({ stakeType: value });
        }}
      />
    </OptionsRow>
  );
};

StakeTypeSelector.propTypes = { onChange: PropTypes.func.isRequired, config: configShape };

const columns = ['Place', 'Score', 'Dog', 'Name', 'Sire', 'Dam', 'Owner'];

const TopDogsByStakeTypeReport = {
  title: 'Top ten by stake',
  description: 'The ten leading dogs of one stake across the hunt.',
  configComponent: 'StakeTypeSelector',
  defaultConfig: { stakeType: 'ALL_AGE' },

  fetchData: async (config = { stakeType: 'ALL_AGE' }) => {
    const { stakeType } = config;
    const topDogs = await DogService.getTop10ScoringDogsByStakeType(stakeType);
    return {
      title: `Top ten, ${stakeType === 'ALL_AGE' ? 'all age' : 'derby'}`,
      columns,
      data: (Array.isArray(topDogs) ? topDogs : []).map((dog, index) => [
        (index + 1).toString(),
        dog.totalPoints.toString(),
        dog.dogNumber.toString(),
        dog.dogName || '',
        dog.sire || '',
        dog.dam || '',
        dog.owner || '',
      ]),
    };
  },
};

export default TopDogsByStakeTypeReport;
