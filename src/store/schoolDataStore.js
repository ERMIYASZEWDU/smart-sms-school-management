import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Centralized School Data Store
// All pages share the same data - when you add a class, it appears everywhere!

export const useSchoolDataStore = create(
  persist(
    (set, get) => ({
      // ============ CLASSES ============
      classes: [
        { id: 1, name: 'Grade 9-A', grade: 'Grade 9', section: 'A', students: 28, teacher: 'Ato Mulugeta Haile', room: '901' },
        { id: 2, name: 'Grade 9-B', grade: 'Grade 9', section: 'B', students: 30, teacher: 'W/ro Almaz Tadesse', room: '902' },
        { id: 3, name: 'Grade 10-A', grade: 'Grade 10', section: 'A', students: 29, teacher: 'Ato Getachew Alemayehu', room: '1001' },
        { id: 4, name: 'Grade 10-B', grade: 'Grade 10', section: 'B', students: 27, teacher: 'W/t Senait Tesfaye', room: '1002' },
        { id: 5, name: 'Grade 11-A', grade: 'Grade 11', section: 'A', students: 31, teacher: 'Ato Berhanu Kebede', room: '1101' },
        { id: 6, name: 'Grade 11-B', grade: 'Grade 11', section: 'B', students: 26, teacher: 'W/ro Meheret Assefa', room: '1102' },
        { id: 7, name: 'Grade 12-A', grade: 'Grade 12', section: 'A', students: 28, teacher: 'Ato Tesfaye Bekele', room: '1201' },
        { id: 8, name: 'Grade 12-B', grade: 'Grade 12', section: 'B', students: 32, teacher: 'W/ro Tsehay Mengistu', room: '1202' }
      ],
      
      addClass: (classData) => set((state) => ({
        classes: [...state.classes, { ...classData, id: Date.now() }]
      })),
      
      updateClass: (id, classData) => set((state) => ({
        classes: state.classes.map(c => c.id === id ? { ...classData, id } : c)
      })),
      
      deleteClass: (id) => set((state) => ({
        classes: state.classes.filter(c => c.id !== id)
      })),
      
      getClassNames: () => {
        return get().classes.map(c => c.name)
      },

      // ============ SUBJECTS ============
      subjects: [
        { id: 1, name: 'Mathematics', code: 'MATH-9-12', grade: 'Grade 9-12', teacher: 'Ato Mulugeta Haile', hours: 5, type: 'Core' },
        { id: 2, name: 'English', code: 'ENG-9-12', grade: 'Grade 9-12', teacher: 'W/ro Almaz Tadesse', hours: 5, type: 'Core' },
        { id: 3, name: 'Amharic', code: 'AMH-9-12', grade: 'Grade 9-12', teacher: 'W/ro Meheret Assefa', hours: 4, type: 'Core' },
        { id: 4, name: 'Physics', code: 'PHY-9-12', grade: 'Grade 9-12', teacher: 'Ato Getachew Alemayehu', hours: 4, type: 'Core' },
        { id: 5, name: 'Chemistry', code: 'CHEM-9-12', grade: 'Grade 9-12', teacher: 'Ato Berhanu Kebede', hours: 4, type: 'Core' },
        { id: 6, name: 'Biology', code: 'BIO-9-12', grade: 'Grade 9-12', teacher: 'W/t Senait Tesfaye', hours: 4, type: 'Core' },
        { id: 7, name: 'History', code: 'HIST-9-12', grade: 'Grade 9-12', teacher: 'Ato Tesfaye Bekele', hours: 3, type: 'Core' },
        { id: 8, name: 'Geography', code: 'GEO-9-12', grade: 'Grade 9-12', teacher: 'W/ro Tsehay Mengistu', hours: 3, type: 'Core' },
        { id: 9, name: 'Computer Science', code: 'CS-9-12', grade: 'Grade 9-12', teacher: 'Ato Yosef Mekonnen', hours: 3, type: 'Elective' },
        { id: 10, name: 'Physical Education', code: 'PE-9-12', grade: 'All Grades', teacher: 'Ato Girma Mulugeta', hours: 2, type: 'Activity' },
        { id: 11, name: 'Civics', code: 'CIV-9-12', grade: 'Grade 9-12', teacher: 'Ato Hailu Mamo', hours: 2, type: 'Core' }
      ],
      
      addSubject: (subjectData) => set((state) => ({
        subjects: [...state.subjects, { ...subjectData, id: Date.now() }]
      })),
      
      updateSubject: (id, subjectData) => set((state) => ({
        subjects: state.subjects.map(s => s.id === id ? { ...subjectData, id } : s)
      })),
      
      deleteSubject: (id) => set((state) => ({
        subjects: state.subjects.filter(s => s.id !== id)
      })),
      
      getSubjectNames: () => {
        return get().subjects.map(s => s.name)
      },

      // ============ TEACHERS ============
      teachers: [
        { id: 1, name: 'Ato Mulugeta Haile', email: 'mulugeta.h@school.edu.et', empId: 'T-001', subject: 'Mathematics', phone: '+251-91-111-2222', qualification: 'M.Sc. in Mathematics', status: 'active' },
        { id: 2, name: 'W/ro Almaz Tadesse', email: 'almaz.t@school.edu.et', empId: 'T-002', subject: 'English', phone: '+251-92-222-3333', qualification: 'B.A. in English Literature', status: 'active' },
        { id: 3, name: 'Ato Getachew Alemayehu', email: 'getachew.a@school.edu.et', empId: 'T-003', subject: 'Physics', phone: '+251-94-333-4444', qualification: 'M.Sc. in Physics', status: 'active' },
        { id: 4, name: 'W/t Senait Tesfaye', email: 'senait.t@school.edu.et', empId: 'T-004', subject: 'Biology', phone: '+251-96-444-5555', qualification: 'B.Sc. in Biology', status: 'active' },
        { id: 5, name: 'Ato Berhanu Kebede', email: 'berhanu.k@school.edu.et', empId: 'T-005', subject: 'Chemistry', phone: '+251-97-555-6666', qualification: 'M.Sc. in Chemistry', status: 'active' },
        { id: 6, name: 'W/ro Meheret Assefa', email: 'meheret.a@school.edu.et', empId: 'T-006', subject: 'Amharic', phone: '+251-91-666-7777', qualification: 'B.A. in Amharic', status: 'active' }
      ],
      
      addTeacher: (teacherData) => set((state) => ({
        teachers: [...state.teachers, { ...teacherData, id: Date.now() }]
      })),
      
      updateTeacher: (id, teacherData) => set((state) => ({
        teachers: state.teachers.map(t => t.id === id ? { ...teacherData, id } : t)
      })),
      
      deleteTeacher: (id) => set((state) => ({
        teachers: state.teachers.filter(t => t.id !== id)
      })),
      
      getTeacherNames: () => {
        return get().teachers.map(t => t.name)
      },

      // ============ STUDENTS ============
      students: [
        { id: 1, name: 'Abebe Kebede', email: 'abebe.kebede@gmail.com', rollNo: 'ST-2026-001', class: 'Grade 10-A', phone: '+251-91-234-5678', status: 'active', joinDate: '2025-09-15' },
        { id: 2, name: 'Tigist Worku', email: 'tigist.worku@gmail.com', rollNo: 'ST-2026-002', class: 'Grade 10-B', phone: '+251-92-345-6789', status: 'active', joinDate: '2025-09-16' },
        { id: 3, name: 'Dawit Haile', email: 'dawit.haile@yahoo.com', rollNo: 'ST-2026-003', class: 'Grade 10-A', phone: '+251-94-456-7890', status: 'active', joinDate: '2025-09-17' },
        { id: 4, name: 'Marta Gebreyesus', email: 'marta.g@gmail.com', rollNo: 'ST-2026-004', class: 'Grade 11-A', phone: '+251-96-567-8901', status: 'inactive', joinDate: '2025-09-18' },
        { id: 5, name: 'Yohannes Tesfaye', email: 'yohannes.t@outlook.com', rollNo: 'ST-2026-005', class: 'Grade 12-A', phone: '+251-97-678-9012', status: 'active', joinDate: '2025-09-19' },
        { id: 6, name: 'Selam Tekle', email: 'selam.tekle@gmail.com', rollNo: 'ST-2026-006', class: 'Grade 9-B', phone: '+251-91-789-0123', status: 'active', joinDate: '2025-09-20' }
      ],
      
      addStudent: (studentData) => set((state) => ({
        students: [...state.students, { ...studentData, id: Date.now() }]
      })),
      
      updateStudent: (id, studentData) => set((state) => ({
        students: state.students.map(s => s.id === id ? { ...studentData, id } : s)
      })),
      
      deleteStudent: (id) => set((state) => ({
        students: state.students.filter(s => s.id !== id)
      })),
      
      getStudentsByClass: (className) => {
        return get().students.filter(s => s.class === className)
      },

      // ============ EXAMS ============
      exams: [
        { 
          id: 1, 
          name: 'Mid-Term Exam', 
          subject: 'Mathematics', 
          class: 'Grade 10-A', 
          date: '2026-02-15', 
          time: '09:00 AM', 
          duration: '2 hours', 
          markBreakdown: { quiz: 10, midExam: 30, finalExam: 60 },
          totalMarks: 100, 
          status: 'Scheduled' 
        }
      ],
      
      addExam: (examData) => set((state) => ({
        exams: [...state.exams, { ...examData, id: Date.now() }]
      })),
      
      updateExam: (id, examData) => set((state) => ({
        exams: state.exams.map(e => e.id === id ? { ...examData, id } : e)
      })),
      
      deleteExam: (id) => set((state) => ({
        exams: state.exams.filter(e => e.id !== id)
      })),

      // ============ RESULTS ============
      results: [
        { 
          id: 1, 
          studentName: 'Abebe Kebede', 
          rollNumber: 'ST-2026-001', 
          class: 'Grade 10-A', 
          subject: 'Mathematics',
          examName: 'Mid-Term Exam',
          quiz: 8,
          midExam: 25,
          finalExam: 55,
          totalMarks: 88,
          maxMarks: 100,
          percentage: 88,
          grade: 'A',
          status: 'Pass'
        }
      ],
      
      addResult: (resultData) => set((state) => ({
        results: [...state.results, { ...resultData, id: Date.now() }]
      })),
      
      updateResult: (id, resultData) => set((state) => ({
        results: state.results.map(r => r.id === id ? { ...resultData, id } : r)
      })),
      
      deleteResult: (id) => set((state) => ({
        results: state.results.filter(r => r.id !== id)
      })),

      // ============ ASSIGNMENTS ============
      assignments: [],
      
      addAssignment: (assignmentData) => set((state) => ({
        assignments: [...state.assignments, { ...assignmentData, id: Date.now() }]
      })),
      
      updateAssignment: (id, assignmentData) => set((state) => ({
        assignments: state.assignments.map(a => a.id === id ? { ...assignmentData, id } : a)
      })),
      
      deleteAssignment: (id) => set((state) => ({
        assignments: state.assignments.filter(a => a.id !== id)
      })),

      // ============ PARENTS ============
      parents: [
        { id: 1, name: 'Ato Kebede Worku', email: 'kebede.w@gmail.com', phone: '+251-91-987-6543', student: 'Abebe Kebede', class: 'Grade 10-A', address: 'Bole, Addis Ababa' }
      ],
      
      addParent: (parentData) => set((state) => ({
        parents: [...state.parents, { ...parentData, id: Date.now() }]
      })),
      
      updateParent: (id, parentData) => set((state) => ({
        parents: state.parents.map(p => p.id === id ? { ...parentData, id } : p)
      })),
      
      deleteParent: (id) => set((state) => ({
        parents: state.parents.filter(p => p.id !== id)
      }))
    }),
    {
      name: 'school-data-storage', // Storage key
      getStorage: () => localStorage, // Use localStorage
    }
  )
)
