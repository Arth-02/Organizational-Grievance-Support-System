import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { getFromLocalStorage } from '../utils'
import { useGetProfileQuery, useGetUserDetailsQuery } from '../services/api.service'


const Page = () => {
    const user = useSelector((state) => state.user.user)
    // console.log('User:', user)
    // console.log(getFromLocalStorage('user'))
    const token = getFromLocalStorage('user')?.token
    const userId = "66b7a8e3f773873020126ddc"
    const {data:userData} = useGetProfileQuery({token})
    console.log('User Data:', userData)
    const {data:userData2} = useGetProfileQuery({token})
    console.log('User Data:', userData2)
    const [userDetails, setUserDetails] = useState(null)
    const response = useGetUserDetailsQuery({token,userId})

    const handlerGetuserDetails = () => {
      setUserDetails(response)
    }

  return (
    <div>
        <h1>Page</h1>
        <button onClick={()=>handlerGetuserDetails()}>Get User</button>
        {userDetails!==null? <p>{JSON.stringify(userDetails)}</p>:<p>No user</p>}

        {/* <p>{user}</p> */}
    </div>
  )
}

export default Page