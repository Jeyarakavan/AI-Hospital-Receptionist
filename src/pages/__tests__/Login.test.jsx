import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../Login'

test('renders login demo buttons', ()=>{
  render(<BrowserRouter><Login /></BrowserRouter>)
  expect(screen.getByText(/Sign in as Receptionist/i)).toBeInTheDocument()
})