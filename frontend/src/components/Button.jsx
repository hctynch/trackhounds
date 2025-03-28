import PropTypes from 'prop-types';
import React, { forwardRef } from 'react';

const Button = forwardRef(({ 
  onClick, 
  children, 
  type = 'primary', 
  className = '',
  disabled = false,
  ...props 
}, ref) => {
  // Force colors with both inline styles and classes
  const baseStyle = {
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    fontWeight: '500',
    transition: 'all 150ms ease',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? '0.7' : '1',
  };

  // Force colors based on button type
  const typeStyles = {
    primary: {
      backgroundColor: '#3b82f6', // blue-500
      color: '#ffffff',
      border: '1px solid #3b82f6',
    },
    secondary: {
      backgroundColor: '#f3f4f6', // gray-100
      color: '#1f2937', // gray-800
      border: '1px solid #d1d5db', // gray-300
    },
    danger: {
      backgroundColor: '#ef4444', // red-500
      color: '#ffffff',
      border: '1px solid #ef4444',
    }
  };

  // Handle hover state
  const [isHovered, setIsHovered] = React.useState(false);
  
  // Combined inline styles with hover effect
  const combinedStyle = {
    ...baseStyle,
    ...typeStyles[type],
    ...(isHovered && !disabled ? {
      backgroundColor: type === 'primary' ? '#2563eb' : // blue-600
                        type === 'secondary' ? '#e5e7eb' : // gray-200
                        '#dc2626' // red-600
    } : {})
  };

  return (
    <button
      ref={ref}
      style={combinedStyle}
      className={`
        ${type === 'primary' ? '!bg-blue-500 hover:!bg-blue-600 !text-white' : ''}
        ${type === 'secondary' ? '!bg-gray-100 hover:!bg-gray-200 !text-gray-800' : ''}
        ${type === 'danger' ? '!bg-red-500 hover:!bg-red-600 !text-white' : ''}
        !font-medium !rounded-lg !transition-colors ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  className: PropTypes.string,
  disabled: PropTypes.bool
};

export default Button;