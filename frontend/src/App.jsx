import { useState } from 'react'
import { Counter } from './components/Counter'

const port = import.meta.env.VITE_BASE_URL

function App() {
  

  return (
    <>
    <Counter />
    </>
  )
}

export default App
