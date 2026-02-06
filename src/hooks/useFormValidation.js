import { useState } from 'react'

export function useFormValidation(initialValues) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setValues({
      ...values,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const resetForm = () => {
    setValues(initialValues)
    setErrors({})
  }

  const setFieldValue = (name, value) => {
    setValues({ ...values, [name]: value })
  }

  const setFieldError = (name, error) => {
    setErrors({ ...errors, [name]: error })
  }

  return {
    values,
    setValues,
    errors,
    setErrors,
    handleChange,
    resetForm,
    setFieldValue,
    setFieldError
  }
}
