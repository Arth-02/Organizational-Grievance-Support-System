const StatusTag = ({value, classNames}) => {
  return (
    <span className={`px-3 py-[2px] inline-flex text-xs leading-5 font-semibold rounded-full ${classNames}`}>
      {value}
    </span>
  )
}

export default StatusTag