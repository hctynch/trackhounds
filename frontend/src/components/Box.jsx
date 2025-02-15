import PropTypes from 'prop-types';

function Box({ children, params }) {
  return (
    <div className={`flex flex-col items-start bg-white rounded-lg shadow shadow-gray-500 px-4 ${params}`}>
      {children}
    </div>
  );
}

Box.propTypes = {
  children: PropTypes.node.isRequired,
  params: PropTypes.string
};

export default Box;