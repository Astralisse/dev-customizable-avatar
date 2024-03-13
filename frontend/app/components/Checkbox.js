const Checkbox = ({ checked, onChange, disabled }) => {
  return (
    <input
      type="checkbox"
      disabled={disabled}
      checked={checked}
      onChange={onChange}
    />
  )
}

export default Checkbox
