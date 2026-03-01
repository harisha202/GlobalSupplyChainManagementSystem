function LocationPinIcon({ color = '#ef4444', size = 20, className = '', title = 'Location' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 28"
      width={size}
      height={size}
      fill="none"
      aria-label={title}
      role="img"
    >
      <path d="M12 0C7.58 0 4 3.58 4 8c0 6 8 16 8 16s8-10 8-16c0-4.42-3.58-8-8-8z" fill={color} />
      <circle cx="12" cy="8" r="3.5" fill="#ffffff" />
    </svg>
  )
}

export default LocationPinIcon
