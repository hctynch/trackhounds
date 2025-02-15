import React from 'react';

function Box({ children, params }) {
  return (
    <div className={`flex flex-col items-start bg-gradient-to-br from-white to-gray-200/80 rounded-lg shadow-2xl px-4 border-black/20 border-2 ${params}`}>
      {children}
    </div>
  );
}

export default Box;