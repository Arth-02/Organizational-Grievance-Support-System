import { useState } from 'react'
import { getFromLocalStorage } from '../utils'
import { useGetProfileQuery, useGetUserDetailsQuery } from '../services/api.service'


const Page = () => {
    const token = getFromLocalStorage('user')?.token
    const userId = "66b7a8e3f773873020126ddc"
    const {data:userData} = useGetProfileQuery({token})
    const {data:userData2} = useGetProfileQuery({token})
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
    </div>
  )
}

export default Page