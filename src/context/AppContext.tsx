import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  PortalRole,
  AdminView,
  ParentView,
  FacultyView,
  DriverView,
  Campus,
  Student,
  AttendanceRecord,
  FeeInvoice,
  AuthUser,
} from '../types';
import {
  CAMPUSES,
  PRIMARY_STUDENT,
  CLASS_10A_STUDENTS,
  FEE_INVOICES,
} from '../data/mockData';
import { DEMO_PARTICIPANTS, ParticipantPersona } from '../data/authUsers';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  // Authentication & Session
  isAuthenticated: boolean;
  currentUser: AuthUser;
  loginAsPersona: (persona: ParticipantPersona) => void;
  logout: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (open: boolean) => void;
  showUsageGuide: boolean;
  setShowUsageGuide: (open: boolean) => void;

  role: PortalRole;
  setRole: (role: PortalRole) => void;
  adminView: AdminView;
  setAdminView: (view: AdminView) => void;
  parentView: ParentView;
  setParentView: (view: ParentView) => void;
  facultyView: FacultyView;
  setFacultyView: (view: FacultyView) => void;
  driverView: DriverView;
  setDriverView: (view: DriverView) => void;
  
  // Navigation helper
  navigateToAdminView: (view: AdminView) => void;
  
  // Campuses
  selectedCampus: Campus;
  setSelectedCampus: (campus: Campus) => void;
  campuses: Campus[];
  setCampuses: React.Dispatch<React.SetStateAction<Campus[]>>;

  // Active student
  student: Student;
  setStudent: (student: Student) => void;
  setSelectedStudent: (student: Student) => void;

  // Live Attendance
  attendanceRecords: AttendanceRecord[];
  updateStudentAttendance: (studentId: string, status: 'P' | 'L' | 'A' | 'E', notes?: string) => void;
  markAllPresent: () => void;

  // Invoices & Payment
  invoices: FeeInvoice[];
  payInvoice: (invoiceId: string) => void;

  // Fleet & Stops
  driverCurrentStopIndex: number;
  advanceDriverStop: () => void;
  sosActive: boolean;
  triggerSos: (active: boolean) => void;

  // Modals & Drawers
  ptmModalOpen: boolean;
  setPtmModalOpen: (open: boolean) => void;
  setIsPtmModalOpen: (open: boolean) => void;
  leaveModalOpen: boolean;
  setLeaveModalOpen: (open: boolean) => void;
  setIsLeaveModalOpen: (open: boolean) => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  quickActionOpen: boolean;
  setQuickActionOpen: (open: boolean) => void;

  // Simulator Mode
  previewDevice: 'fluid' | 'mobile-mock';
  setPreviewDevice: (device: 'fluid' | 'mobile-mock') => void;

  // Responsive Mobile Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Toast
  toasts: ToastMessage[];
  addToast: (title: string, type?: 'success' | 'info' | 'warning' | 'error', description?: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthUser>({
    id: DEMO_PARTICIPANTS[0].id,
    name: DEMO_PARTICIPANTS[0].name,
    role: DEMO_PARTICIPANTS[0].role,
    roleTitle: DEMO_PARTICIPANTS[0].roleTitle,
    email: DEMO_PARTICIPANTS[0].email,
    phone: DEMO_PARTICIPANTS[0].phone,
    avatar: DEMO_PARTICIPANTS[0].avatar,
    campusId: DEMO_PARTICIPANTS[0].campusId,
    campusName: DEMO_PARTICIPANTS[0].campusName,
    identifier: DEMO_PARTICIPANTS[0].identifier,
    mfaVerified: true,
  });

  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showUsageGuide, setShowUsageGuide] = useState<boolean>(false);

  const [role, setRole] = useState<PortalRole>('admin');
  const [adminView, setAdminView] = useState<AdminView>('dashboard');
  const [parentView, setParentView] = useState<ParentView>('home');
  const [facultyView, setFacultyView] = useState<FacultyView>('schedule-home');
  const [driverView, setDriverView] = useState<DriverView>('live-route');

  const [campuses, setCampuses] = useState<Campus[]>(CAMPUSES);
  const [selectedCampus, setSelectedCampus] = useState<Campus>(CAMPUSES[0]);
  const [student, setStudent] = useState<Student>(PRIMARY_STUDENT);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(CLASS_10A_STUDENTS);
  const [invoices, setInvoices] = useState<FeeInvoice[]>(FEE_INVOICES);

  const [driverCurrentStopIndex, setDriverCurrentStopIndex] = useState<number>(3);
  const [sosActive, setSosActive] = useState<boolean>(false);

  const [ptmModalOpen, setPtmModalOpen] = useState<boolean>(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState<boolean>(false);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [quickActionOpen, setQuickActionOpen] = useState<boolean>(false);

  const [previewDevice, setPreviewDevice] = useState<'fluid' | 'mobile-mock'>('fluid');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const addToast = useCallback((title: string, type: 'success' | 'info' | 'warning' | 'error' = 'success', description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const loginAsPersona = useCallback((persona: ParticipantPersona) => {
    setCurrentUser({
      id: persona.id,
      name: persona.name,
      role: persona.role,
      roleTitle: persona.roleTitle,
      email: persona.email,
      phone: persona.phone,
      avatar: persona.avatar,
      campusId: persona.campusId,
      campusName: persona.campusName,
      identifier: persona.identifier,
      mfaVerified: true,
    });

    const targetCampus = CAMPUSES.find(c => c.id === persona.campusId) || CAMPUSES[0];
    setSelectedCampus(targetCampus);
    setRole(persona.role);
    if (persona.defaultView) {
      if (persona.role === 'admin') setAdminView(persona.defaultView as AdminView);
      if (persona.role === 'parent') setParentView('home');
      if (persona.role === 'faculty') setFacultyView('schedule-home');
      if (persona.role === 'driver') setDriverView('live-route');
    }
    setIsAuthenticated(true);
    setShowLoginModal(false);
    addToast(
      `Authenticated: ${persona.name}`,
      'success',
      `Session established for ${persona.roleTitle} at ${targetCampus.name} (RLS Active).`
    );
  }, [addToast]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setShowLoginModal(false);
    addToast('Signed Out of Session', 'info', 'RLS connection closed. Please sign in to resume.');
  }, [addToast]);

  const navigateToAdminView = useCallback((view: AdminView) => {
    setRole('admin');
    setAdminView(view);
  }, []);

  const updateStudentAttendance = useCallback((studentId: string, status: 'P' | 'L' | 'A' | 'E', notes?: string) => {
    setAttendanceRecords(prev =>
      prev.map(item =>
        item.studentId === studentId
          ? {
              ...item,
              status,
              notes: notes || item.notes,
              telemetrySource: 'Teacher App Manual Override',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : item
      )
    );
    addToast(`Roll Call Updated: ${status === 'P' ? 'Present' : status === 'L' ? 'Late' : status === 'A' ? 'Absent' : 'Excused'}`, 'info');
  }, [addToast]);

  const markAllPresent = useCallback(() => {
    setAttendanceRecords(prev =>
      prev.map(item => ({
        ...item,
        status: 'P',
        telemetrySource: 'Teacher Bulk Verification',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }))
    );
    addToast('All 10 students marked Present', 'success', 'Class 10-A register synchronized to school central database.');
  }, [addToast]);

  const payInvoice = useCallback((invoiceId: string) => {
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId
          ? { ...inv, status: 'Paid', receiptNo: `REC-${Date.now().toString().slice(-6)}` }
          : inv
      )
    );
    addToast('Payment Successful! ₹24,500', 'success', 'CBSE fee receipt REC-904128 generated & WhatsApp confirmation dispatched to father.');
  }, [addToast]);

  const advanceDriverStop = useCallback(() => {
    setDriverCurrentStopIndex(prev => (prev < 5 ? prev + 1 : 0));
    addToast('Bus GPS Geofence Triggered', 'info', 'Next stop notification sent to 7 waiting parents on Route #14.');
  }, [addToast]);

  const triggerSos = useCallback((active: boolean) => {
    setSosActive(active);
    if (active) {
      addToast('AIS-140 EMERGENCY SOS BROADCASTED', 'error', 'Fleet Control Room, Principal & local patrol alerted with live GPS coordinates.');
    } else {
      addToast('Emergency SOS Deactivated', 'info', 'Fleet manager logged incident clearance.');
    }
  }, [addToast]);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        loginAsPersona,
        logout,
        showLoginModal,
        setShowLoginModal,
        showUsageGuide,
        setShowUsageGuide,
        role,
        setRole,
        adminView,
        setAdminView,
        parentView,
        setParentView,
        facultyView,
        setFacultyView,
        driverView,
        setDriverView,
        navigateToAdminView,
        selectedCampus,
        setSelectedCampus,
        campuses,
        setCampuses,
        student,
        setStudent,
        setSelectedStudent: setStudent,
        attendanceRecords,
        updateStudentAttendance,
        markAllPresent,
        invoices,
        payInvoice,
        driverCurrentStopIndex,
        advanceDriverStop,
        sosActive,
        triggerSos,
        ptmModalOpen,
        setPtmModalOpen,
        setIsPtmModalOpen: setPtmModalOpen,
        leaveModalOpen,
        setLeaveModalOpen,
        setIsLeaveModalOpen: setLeaveModalOpen,
        searchModalOpen,
        setSearchModalOpen,
        quickActionOpen,
        setQuickActionOpen,
        previewDevice,
        setPreviewDevice,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
