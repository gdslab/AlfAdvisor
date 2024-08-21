import React from 'react'
import { getLocalStorage } from './localStorage'

const useToken = () => {
    const token = getLocalStorage('Token')

  return token
}

export default useToken