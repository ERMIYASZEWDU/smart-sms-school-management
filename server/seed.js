import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { pathToFileURL } from 'url'
import User from './models/User.js'
import Student from './models/Student.js'
import Teacher from './models/Teacher.js'
import Parent from './models/Parent.js'
import Class from './models/Class.js'
import Subject from './models/Subject.js'
import AcademicYear from './models/AcademicYear.js'
import Enrollment from './models/Enrollment.js'

dotenv.config()

export const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management')
    console.log('✅ Connected to MongoDB')

    console.log('🗑️  Clearing existing data...')
    // Clear existing data for clean start
    await User.deleteMany({})
    await Student.deleteMany({})
    await Teacher.deleteMany({})
    await Parent.deleteMany({})
    await Class.deleteMany({})
    await Subject.deleteMany({})
    await AcademicYear.deleteMany({})
    console.log('✅ Existing data cleared')

    // Step 1: Create the active academic year (Class now requires academicYearId)
    console.log('\n📅 Creating Academic Year...')
    const academicYearDoc = new AcademicYear({
      name: '2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-07-30'),
      isActive: true,
      description: '2025-2026 Academic Year'
    })
    await academicYearDoc.save()
    console.log('✅ Created Academic Year: 2025-2026 (active)')

    // Step 2: Create Admin
    console.log('\n👤 Creating Admin...')
    const adminUser = new User({
      email: 'admin@smartsms.et',
      password: 'Admin@123',
      name: 'System Administrator',
      role: 'admin'
    })
    await adminUser.save()
    console.log('✅ Created Admin: admin@smartsms.et / Admin@123')

    // Step 2: Create Classes
    console.log('\n🏫 Creating Classes...')
    const classesData = [
      { name: 'Grade 10-A', grade: 'Grade 10', section: 'A', capacity: 40, room: '101' },
      { name: 'Grade 10-B', grade: 'Grade 10', section: 'B', capacity: 40, room: '102' },
      { name: 'Grade 11-A', grade: 'Grade 11', section: 'A', capacity: 40, room: '201' },
      { name: 'Grade 11-B', grade: 'Grade 11', section: 'B', capacity: 40, room: '202' },
      { name: 'Grade 12-A', grade: 'Grade 12', section: 'A', capacity: 40, room: '301' }
    ]

    const createdClasses = []
    for (const classData of classesData) {
      const newClass = new Class({
        ...classData,
        academicYearId: academicYearDoc._id,
        isActive: true
      })
      await newClass.save()
      createdClasses.push(newClass)
      console.log(`✅ Created: ${classData.name}`)
    }

    // Step 3: Create Subjects
    console.log('\n📚 Creating Subjects...')
    const subjectsData = [
      { name: 'Mathematics', code: 'MATH101', grade: 'Grade 10', credits: 4 },
      { name: 'English', code: 'ENG101', grade: 'Grade 10', credits: 3 },
      { name: 'Physics', code: 'PHY101', grade: 'Grade 11', credits: 4 },
      { name: 'Chemistry', code: 'CHEM101', grade: 'Grade 11', credits: 4 },
      { name: 'Biology', code: 'BIO101', grade: 'Grade 12', credits: 4 }
    ]

    const createdSubjects = []
    for (const subjectData of subjectsData) {
      const newSubject = new Subject({
        ...subjectData,
        isActive: true
      })
      await newSubject.save()
      createdSubjects.push(newSubject)
      console.log(`✅ Created: ${subjectData.name} (${subjectData.code})`)
    }

    // Step 4: Create Teachers
    console.log('\n👨‍🏫 Creating Teachers...')
    
    // Teacher 1 - Grade 10 (A&B)
    const teacher1User = new User({
      email: 'teacher1@smartsms.et',
      password: 'Teacher@123',
      name: 'Ato Mulugeta Haile',
      role: 'teacher',
      phone: '+251-91-111-2222'
    })
    await teacher1User.save()

    const teacher1Profile = new Teacher({
      userId: teacher1User._id,
      name: 'Ato Mulugeta Haile',
      employeeId: 'TEA001',
      phone: '+251-91-111-2222',
      email: 'teacher1@smartsms.et',
      department: 'Mathematics',
      qualification: 'M.Sc. in Mathematics',
      assignedClassIds: [createdClasses[0]._id, createdClasses[1]._id], // Grade 10-A, 10-B
      assignedSubjectIds: [createdSubjects[0]._id], // Mathematics
      status: 'active'
    })
    await teacher1Profile.save()

    // Update classes with teacher
    await Class.findByIdAndUpdate(createdClasses[0]._id, { teacherId: teacher1User._id })
    await Class.findByIdAndUpdate(createdClasses[1]._id, { teacherId: teacher1User._id })
    
    console.log('✅ Created: Ato Mulugeta Haile (Grade 10-A, 10-B - Mathematics)')

    // Teacher 2 - Grade 11 (A&B)
    const teacher2User = new User({
      email: 'teacher2@smartsms.et',
      password: 'Teacher@123',
      name: 'W/ro Almaz Tadesse',
      role: 'teacher',
      phone: '+251-92-222-3333'
    })
    await teacher2User.save()

    const teacher2Profile = new Teacher({
      userId: teacher2User._id,
      name: 'W/ro Almaz Tadesse',
      employeeId: 'TEA002',
      phone: '+251-92-222-3333',
      email: 'teacher2@smartsms.et',
      department: 'Science',
      qualification: 'M.Sc. in Physics',
      assignedClassIds: [createdClasses[2]._id, createdClasses[3]._id], // Grade 11-A, 11-B
      assignedSubjectIds: [createdSubjects[2]._id, createdSubjects[3]._id], // Physics, Chemistry
      status: 'active'
    })
    await teacher2Profile.save()

    await Class.findByIdAndUpdate(createdClasses[2]._id, { teacherId: teacher2User._id })
    await Class.findByIdAndUpdate(createdClasses[3]._id, { teacherId: teacher2User._id })

    console.log('✅ Created: W/ro Almaz Tadesse (Grade 11-A, 11-B - Physics, Chemistry)')

    // Step 5: Create Students
    console.log('\n👨‍🎓 Creating Students...')
    // Step 5: Create Students
    console.log('\n👨‍🎓 Creating Students...')
    
    const students = [
      { name: 'Abebe Kebede', enrollmentNumber: 'ST-2026-001', email: 'student1@smartsms.et', grade: 'Grade 10', section: 'A', rollNumber: 1, classId: createdClasses[0]._id, guardianName: 'Ato Kebede Worku', guardianPhone: '+251-91-123-4567', dateOfBirth: new Date('2010-03-15'), gpa: 3.8, attendance: 95 },
      { name: 'Tigist Worku', enrollmentNumber: 'ST-2026-002', email: 'student2@smartsms.et', grade: 'Grade 10', section: 'A', rollNumber: 2, classId: createdClasses[0]._id, guardianName: 'Ato Worku Tesfaye', guardianPhone: '+251-92-234-5678', dateOfBirth: new Date('2010-05-20'), gpa: 3.9, attendance: 97 },
      { name: 'Dawit Haile', enrollmentNumber: 'ST-2026-003', email: 'student3@smartsms.et', grade: 'Grade 10', section: 'B', rollNumber: 3, classId: createdClasses[1]._id, guardianName: 'W/ro Almaz Haile', guardianPhone: '+251-93-345-6789', dateOfBirth: new Date('2010-07-10'), gpa: 3.6, attendance: 92 },
      { name: 'Marta Gebreyesus', enrollmentNumber: 'ST-2026-004', email: 'student4@smartsms.et', grade: 'Grade 11', section: 'A', rollNumber: 4, classId: createdClasses[2]._id, guardianName: 'W/ro Worknesh Tadesse', guardianPhone: '+251-94-456-7890', dateOfBirth: new Date('2009-02-14'), gpa: 3.95, attendance: 98 },
      { name: 'Yohannes Tesfaye', enrollmentNumber: 'ST-2026-005', email: 'student5@smartsms.et', grade: 'Grade 11', section: 'A', rollNumber: 5, classId: createdClasses[2]._id, guardianName: 'Ato Tesfaye Solomon', guardianPhone: '+251-95-567-8901', dateOfBirth: new Date('2009-11-25'), gpa: 3.7, attendance: 94 }
    ]

    const createdStudents = []
    for (const studentData of students) {
      // Create user account
      const studentUser = new User({
        email: studentData.email,
        password: 'Student@123',
        name: studentData.name,
        role: 'student'
      })
      await studentUser.save()

      // Create student profile
      const student = new Student({
        userId: studentUser._id,
        name: studentData.name,
        enrollmentNumber: studentData.enrollmentNumber,
        grade: studentData.grade,
        section: studentData.section,
        rollNumber: studentData.rollNumber,
        classId: studentData.classId,
        dateOfBirth: studentData.dateOfBirth,
        guardianName: studentData.guardianName,
        guardianPhone: studentData.guardianPhone,
        address: 'Addis Ababa, Ethiopia',
        gpa: studentData.gpa,
        attendance: studentData.attendance,
        status: 'active'
      })
      await student.save()
      createdStudents.push(student)
      console.log(`✅ Created: ${studentData.name} (${studentData.grade}-${studentData.section})`)
    }

    // Step 5b: Create Enrollment records
    console.log('\n📋 Creating Enrollment records...')
    for (let i = 0; i < createdStudents.length; i++) {
      const studentData = students[i]
      const student = createdStudents[i]
      
      const enrollment = new Enrollment({
        studentId: student._id,
        classId: studentData.classId,
        academicYearId: academicYearDoc._id,
        grade: studentData.grade,
        section: studentData.section,
        stream: parseInt(studentData.grade.replace('Grade ', '')) >= 11 ? 'Natural Science' : null,
        enrollmentDate: new Date('2025-09-01'),
        enrollmentNumber: studentData.enrollmentNumber,
        rollNumber: studentData.rollNumber,
        status: 'active',
        enrolledBy: adminUser._id
      })
      await enrollment.save()
      console.log(`✅ Enrolled: ${studentData.name} → ${studentData.grade}-${studentData.section}`)
    }

    // Step 6: Create Parents
    console.log('\n👨‍👩‍👧‍👦 Creating Parents...')
    
    // Parent 1 - linked to students 1 and 2
    const parent1User = new User({
      email: 'parent1@smartsms.et',
      password: 'Parent@123',
      name: 'Ato Kebede Worku',
      role: 'parent',
      phone: '+251-91-111-0000'
    })
    await parent1User.save()

    const parent1 = new Parent({
      userId: parent1User._id,
      name: 'Ato Kebede Worku',
      email: 'parent1@smartsms.et',
      phone: '+251-91-111-0000',
      studentIds: [createdStudents[0]._id, createdStudents[1]._id],
      occupation: 'Business Owner',
      relationship: 'father'
    })
    await parent1.save()

    // Update students with parent
    await Student.findByIdAndUpdate(createdStudents[0]._id, { $push: { parentIds: parent1._id } })
    await Student.findByIdAndUpdate(createdStudents[1]._id, { $push: { parentIds: parent1._id } })

    console.log('✅ Created: Ato Kebede Worku (linked to Abebe and Tigist)')

    // Parent 2 - linked to student 4
    const parent2User = new User({
      email: 'parent2@smartsms.et',
      password: 'Parent@123',
      name: 'W/ro Worknesh Tadesse',
      role: 'parent',
      phone: '+251-92-222-0000'
    })
    await parent2User.save()

    const parent2 = new Parent({
      userId: parent2User._id,
      name: 'W/ro Worknesh Tadesse',
      email: 'parent2@smartsms.et',
      phone: '+251-92-222-0000',
      studentIds: [createdStudents[3]._id],
      occupation: 'Teacher',
      relationship: 'mother'
    })
    await parent2.save()

    await Student.findByIdAndUpdate(createdStudents[3]._id, { $push: { parentIds: parent2._id } })

    console.log('✅ Created: W/ro Worknesh Tadesse (linked to Marta)')

    console.log('\n' + '='.repeat(60))
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!')
    console.log('='.repeat(60))
    console.log('\n📝 LOGIN CREDENTIALS:')
    console.log('\n👤 ADMIN:')
    console.log('   Email: admin@smartsms.et')
    console.log('   Password: Admin@123')
    console.log('   Access: Full system control')
    
    console.log('\n👨‍🏫 TEACHERS:')
    console.log('   Email: teacher1@smartsms.et')
    console.log('   Password: Teacher@123')
    console.log('   Assigned: Grade 10-A, 10-B (Mathematics)')
    console.log('   Should see: 3 students')
    
    console.log('\n   Email: teacher2@smartsms.et')
    console.log('   Password: Teacher@123')
    console.log('   Assigned: Grade 11-A, 11-B (Physics, Chemistry)')
    console.log('   Should see: 2 students')
    
    console.log('\n👨‍🎓 STUDENTS:')
    students.forEach((s, i) => {
      console.log(`   ${s.email} / Student@123 (${s.grade}-${s.section})`)
    })
    
    console.log('\n👨‍👩‍👧‍👦 PARENTS:')
    console.log('   parent1@smartsms.et / Parent@123 (2 children)')
    console.log('   parent2@smartsms.et / Parent@123 (1 child)')
    
    console.log('\n📊 SUMMARY:')
    console.log(`   Classes: ${createdClasses.length}`)
    console.log(`   Subjects: ${createdSubjects.length}`)
    console.log(`   Teachers: 2`)
    console.log(`   Students: ${createdStudents.length}`)
    console.log(`   Parents: 2`)
    
    console.log('\n✅ Next Steps:')
    console.log('   1. Start backend: cd server && npm start')
    console.log('   2. Start frontend: npm run dev')
    console.log('   3. Visit: http://localhost:5173')
    console.log('   4. Login and test the integration!')
    console.log('\n' + '='.repeat(60))
    
    return true
  } catch (error) {
    console.error('❌ Seed error:', error)
    throw error
  }
}

// Allow running directly: `node seed.js`
const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectRun) {
  seedUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
