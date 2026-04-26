/**
 * Comprehensive list of Doctor Types and their categories
 * Provided by the user for system-wide integration.
 */
export const DOCTOR_CATEGORIES = {
  "General Doctors": [
    "General Practitioner (GP)",
    "Family Medicine Doctor"
  ],
  "Heart & Blood": [
    "Cardiologist",
    "Cardiac Surgeon"
  ],
  "Brain & Nerves": [
    "Neurologist",
    "Neurosurgeon"
  ],
  "Lungs & Breathing": [
    "Pulmonologist"
  ],
  "Digestive System": [
    "Gastroenterologist",
    "Hepatologist"
  ],
  "Bones & Muscles": [
    "Orthopedic Doctor",
    "Rheumatologist"
  ],
  "Eyes": [
    "Ophthalmologist"
  ],
  "Ear, Nose, Throat": [
    "ENT Specialist (Otolaryngologist)"
  ],
  "Skin": [
    "Dermatologist"
  ],
  "Hormones & Glands": [
    "Endocrinologist"
  ],
  "Blood & Cancer": [
    "Hematologist",
    "Oncologist"
  ],
  "Children": [
    "Pediatrician"
  ],
  "Women’s Health": [
    "Gynecologist",
    "Obstetrician"
  ],
  "Surgery": [
    "General Surgeon",
    "Plastic Surgeon",
    "Urologist"
  ],
  "Mental Health": [
    "Psychiatrist",
    "Psychologist"
  ],
  "Emergency & Critical Care": [
    "Emergency Doctor",
    "Intensivist"
  ],
  "Teeth": [
    "Dentist"
  ],
  "Testing & Diagnosis": [
    "Radiologist",
    "Pathologist"
  ],
  "Other Important Types": [
    "Anesthesiologist",
    "Physiotherapist",
    "Infectious Disease Specialist"
  ],
  "Optional / Specialized Areas": [
    "Nephrologist",
    "Allergist",
    "Sports Medicine Doctor",
    "Geriatrician"
  ]
};

export const ALL_DOCTOR_TYPES = Object.values(DOCTOR_CATEGORIES).flat();
