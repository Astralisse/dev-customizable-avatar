const Button = ({ text, onClick, loading }) => {
  return (
    <div>
      <button
        disabled={loading}
        onClick={onClick}
        className={`${loading ? 'bg-purple-800' : 'bg-white'} text-purple-950 px-8 py-4 rounded-lg`}
      >{text}</button>
    </div>
  )
}

export default Button
