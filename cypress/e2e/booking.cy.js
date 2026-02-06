describe('Booking and Call Simulation', ()=>{
  it('Books an appointment and receives confirmation', ()=>{
    cy.visit('/')
    cy.contains('Sign in as Receptionist').click()
    cy.contains('Appointments').click()
    cy.contains('New Appointment').click()
    cy.get('input[placeholder="Patient name"]').type('E2E Tester')
    cy.get('input[placeholder="Mobile"]').type('+15550000000')
    cy.get('input[placeholder="Medical problem"]').type('Headache')
    cy.get('input[type="datetime-local"]').type('2026-02-10T10:30')
    cy.contains('Book').click()
    cy.contains('Appointment booked').should('exist')
  })

  it('Simulates incoming call', ()=>{
    cy.visit('/calls')
    cy.contains('Simulate Incoming Call').click()
    cy.contains('DemoCaller').should('exist')
  })
})