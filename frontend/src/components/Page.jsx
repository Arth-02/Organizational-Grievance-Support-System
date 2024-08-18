import React from 'react'
import { useSelector } from 'react-redux'


const Page = () => {
    const user = useSelector((state) => state.user.user)
    console.log('User:', user)
  return (
    <div>
        <h1>Page</h1>
        {/* <p>{user}</p> */}
    </div>
  )
}

export default Page