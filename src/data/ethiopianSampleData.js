// Ethiopian Sample Data for School Management System

export const ethiopianNames = {
  students: {
    male: [
      'Abebe Kebede',
      'Tadesse Alemu',
      'Dawit Haile',
      'Yohannes Tesfaye',
      'Bisrat Negash',
      'Mekonnen Solomon',
      'Girma Mulugeta',
      'Alemayehu Bekele',
      'Tewodros Gebre',
      'Hailu Mamo'
    ],
    female: [
      'Tigist Worku',
      'Marta Gebreyesus',
      'Selam Tekle',
      'Hiwot Assefa',
      'Rahel Tadesse',
      'Birtukan Mengistu',
      'Seble Desta',
      'Eyerusalem Hailu',
      'Liya Asfaw',
      'Eden Girma'
    ]
  },
  teachers: {
    male: [
      'Ato Mulugeta Haile',
      'Ato Getachew Alemayehu',
      'Ato Berhanu Kebede',
      'Ato Tesfaye Bekele',
      'Ato Yosef Mekonnen'
    ],
    female: [
      'W/ro Almaz Tadesse',
      'W/ro Meheret Assefa',
      'W/t Senait Tesfaye',
      'W/ro Tsehay Mengistu',
      'W/t Meseret Gebre'
    ]
  },
  parents: {
    male: [
      'Ato Kebede Worku',
      'Ato Alemu Tesfaye',
      'Ato Haile Negash',
      'Ato Tesfaye Solomon',
      'Ato Negash Bekele'
    ],
    female: [
      'W/ro Almaz Haile',
      'W/ro Worknesh Tadesse',
      'W/ro Meseret Tesfaye',
      'W/ro Tigist Bekele',
      'W/ro Hanna Assefa'
    ]
  }
}

export const ethiopianCities = [
  'Addis Ababa',
  'Dire Dawa',
  'Bahir Dar',
  'Gondar',
  'Mekelle',
  'Hawassa',
  'Adama',
  'Jimma',
  'Dessie',
  'Sodo'
]

export const ethiopianSubcities = {
  'Addis Ababa': [
    'Bole',
    'Kirkos',
    'Arada',
    'Lideta',
    'Yeka',
    'Nifas Silk-Lafto',
    'Kolfe Keranio',
    'Addis Ketema',
    'Akaky Kaliti',
    'Gulele'
  ]
}

export const ethiopianPhonePrefixes = [
  '+251-91',  // Ethio Telecom
  '+251-92',  // Ethio Telecom
  '+251-93',  // Ethio Telecom
  '+251-94',  // Safaricom
  '+251-96',  // Safaricom
  '+251-97',  // Ethio Telecom
  '+251-98',  // Ethio Telecom
]

export const ethiopianOccupations = [
  'Government Employee',
  'Business Owner',
  'Farmer',
  'Teacher',
  'Doctor',
  'Engineer',
  'Accountant',
  'Driver',
  'Merchant',
  'NGO Worker'
]

// Currency formatter for Ethiopian Birr
export const formatBirr = (amount) => {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Birr`
}

// Short format
export const formatBirrShort = (amount) => {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ETB`
}

// Generate random Ethiopian phone number
export const generateEthiopianPhone = () => {
  const prefix = ethiopianPhonePrefixes[Math.floor(Math.random() * ethiopianPhonePrefixes.length)]
  const number = Math.floor(1000000 + Math.random() * 9000000)
  return `${prefix}-${number.toString().substring(0, 3)}-${number.toString().substring(3, 7)}`
}

// Generate Ethiopian email
export const generateEthiopianEmail = (name) => {
  const cleaned = name.toLowerCase().replace(/\s+/g, '.')
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'ethionet.et']
  const domain = domains[Math.floor(Math.random() * domains.length)]
  return `${cleaned}@${domain}`
}

// Sample students with Ethiopian names
export const sampleStudents = [
  {
    id: 1,
    name: 'Abebe Kebede',
    rollNumber: 'ST-2026-001',
    class: 'Grade 10-A',
    email: 'abebe.kebede@gmail.com',
    phone: '+251-91-234-5678',
    parentName: 'Ato Kebede Worku',
    status: 'Active',
    gender: 'Male',
    address: 'Bole, Addis Ababa'
  },
  {
    id: 2,
    name: 'Tigist Worku',
    rollNumber: 'ST-2026-002',
    class: 'Grade 10-A',
    email: 'tigist.worku@gmail.com',
    phone: '+251-92-345-6789',
    parentName: 'Ato Alemu Tesfaye',
    status: 'Active',
    gender: 'Female',
    address: 'Kirkos, Addis Ababa'
  },
  {
    id: 3,
    name: 'Dawit Haile',
    rollNumber: 'ST-2026-003',
    class: 'Grade 9-B',
    email: 'dawit.haile@yahoo.com',
    phone: '+251-94-456-7890',
    parentName: 'W/ro Almaz Haile',
    status: 'Active',
    gender: 'Male',
    address: 'Yeka, Addis Ababa'
  },
  {
    id: 4,
    name: 'Marta Gebreyesus',
    rollNumber: 'ST-2026-004',
    class: 'Grade 11-A',
    email: 'marta.g@gmail.com',
    phone: '+251-96-567-8901',
    parentName: 'W/ro Worknesh Tadesse',
    status: 'Active',
    gender: 'Female',
    address: 'Arada, Addis Ababa'
  },
  {
    id: 5,
    name: 'Yohannes Tesfaye',
    rollNumber: 'ST-2026-005',
    class: 'Grade 12-A',
    email: 'yohannes.t@outlook.com',
    phone: '+251-97-678-9012',
    parentName: 'Ato Tesfaye Solomon',
    status: 'Active',
    gender: 'Male',
    address: 'Gulele, Addis Ababa'
  }
]

// Sample teachers with Ethiopian names
export const sampleTeachers = [
  {
    id: 1,
    name: 'Ato Mulugeta Haile',
    employeeId: 'T-001',
    subject: 'Mathematics',
    email: 'mulugeta.h@school.edu.et',
    phone: '+251-91-111-2222',
    qualification: 'M.Sc. in Mathematics',
    status: 'Active'
  },
  {
    id: 2,
    name: 'W/ro Almaz Tadesse',
    employeeId: 'T-002',
    subject: 'English',
    email: 'almaz.t@school.edu.et',
    phone: '+251-92-222-3333',
    qualification: 'B.A. in English Literature',
    status: 'Active'
  },
  {
    id: 3,
    name: 'Ato Getachew Alemayehu',
    employeeId: 'T-003',
    subject: 'Physics',
    email: 'getachew.a@school.edu.et',
    phone: '+251-94-333-4444',
    qualification: 'M.Sc. in Physics',
    status: 'Active'
  },
  {
    id: 4,
    name: 'W/t Senait Tesfaye',
    employeeId: 'T-004',
    subject: 'Biology',
    email: 'senait.t@school.edu.et',
    phone: '+251-96-444-5555',
    qualification: 'B.Sc. in Biology',
    status: 'Active'
  },
  {
    id: 5,
    name: 'Ato Berhanu Kebede',
    employeeId: 'T-005',
    subject: 'Chemistry',
    email: 'berhanu.k@school.edu.et',
    phone: '+251-97-555-6666',
    qualification: 'M.Sc. in Chemistry',
    status: 'Active'
  }
]

// Sample parents with Ethiopian names
export const sampleParents = [
  {
    id: 1,
    name: 'Ato Kebede Worku',
    email: 'kebede.w@gmail.com',
    phone: '+251-91-987-6543',
    occupation: 'Business Owner',
    relation: 'Father',
    children: ['Abebe Kebede'],
    status: 'Active'
  },
  {
    id: 2,
    name: 'W/ro Worknesh Tadesse',
    email: 'worknesh.t@yahoo.com',
    phone: '+251-92-876-5432',
    occupation: 'Teacher',
    relation: 'Mother',
    children: ['Marta Gebreyesus'],
    status: 'Active'
  },
  {
    id: 3,
    name: 'Ato Alemu Tesfaye',
    email: 'alemu.t@gmail.com',
    phone: '+251-94-765-4321',
    occupation: 'Government Employee',
    relation: 'Father',
    children: ['Tigist Worku'],
    status: 'Active'
  }
]

export default {
  ethiopianNames,
  ethiopianCities,
  ethiopianSubcities,
  ethiopianPhonePrefixes,
  ethiopianOccupations,
  formatBirr,
  formatBirrShort,
  generateEthiopianPhone,
  generateEthiopianEmail,
  sampleStudents,
  sampleTeachers,
  sampleParents
}
