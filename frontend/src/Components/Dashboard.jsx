import React from 'react'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  console.log('Dashboard')
  return (
    <>
      <h1>Dashboard</h1>
      <Link to="/reports">Reports</Link>
    </>
  )
}

export default Dashboard