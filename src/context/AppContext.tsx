import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  AdminView,
  Campus,
  Student,
  AttendanceRecord,
  FeeInvoice,
  AuthUser,
} from '../types';
import {
  CAMPUSES,
  CLASS_10A_STUDENTS,
  FEE_INVOICES,
} from '../data/mockData';
import { HOME_VIEW, STAFF_ACCOUNTS, StaffAccount } from '../data/staffAccess';
import { INITIAL_ROSTER, toProfile } from '../data/students';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  // Session
  isAuthenticated: boolean;
  currentUser: AuthUser;
  signIn: (account: StaffAccount) => void;
  logout: () => void;

  // Navigation
  adminView: AdminView;
  setAdminView: (view: AdminView) => void;

  // Campuses
  selectedCampus: Campus;
  setSelectedCampus: (campus: Campus) => void;
  campuses: Campus[];
  setCampuses: React.Dispatch<React.SetStateAction<Campus[]>>;

  // Active student
  student: Student;
  setStudent: (student: Student) => void;

  // Class 10-A roll call (Attendance desk)
  attendanceRecords: AttendanceRecord[];
  updateStudentAttendance: (studentId: string, status: 'P' | 'L' | 'A' | 'E', notes?: string) => void;
  markAllPresent: () => void;

  // Invoices (dashboard and report widgets)
  invoices: FeeInvoice[];

  // Transport
  driverCurrentStopIndex: number;
  advanceDriverStop: () => void;
  sosActive: boolean;
  triggerSos: (active: boolean) => void;

  // Modals and drawers
  ptmModalOpen: boolean;
  setPtmModalOpen: (open: boolean) => void;
  leaveModalOpen: boolean;
  setLeaveModalOpen: (open: boolean) => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  quickActionOpen: boolean;
  setQuickActionOpen: (open: boolean) => void;

  // Mobile sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Toast
  toasts: ToastMessage[];
  addToast: (title: string, type?: 'success' | 'info' | 'warning' | 'error', description?: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const toAuthUser = (a: StaffAccount): AuthUser => ({
  id: a.id,
  name: a.name,
  staffRole: a.staffRole,
  roleTitle: a.roleTitle,
  email: a.email,
  phone: a.phone,
  avatar: a.avatar,
  campusId: a.campusId,
  campusName: a.campusName,
  identifier: a.identifier,
  mfaVerified: a.requiresMfa,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => toAuthUser(STAFF_ACCOUNTS[0]));

  const [adminView, setAdminView] = useState<AdminView>('dashboard');

  const [campuses, setCampuses] = useState<Campus[]>(CAMPUSES);
  const [selectedCampus, setSelectedCampus] = useState<Campus>(CAMPUSES[0]);
  const [student, setStudent] = useState<Student>(() => toProfile(INITIAL_ROSTER[0]));

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(CLASS_10A_STUDENTS);
  const [invoices] = useState<FeeInvoice[]>(FEE_INVOICES);

  const [driverCurrentStopIndex, setDriverCurrentStopIndex] = useState<number>(3);
  const [sosActive, setSosActive] = useState<boolean>(false);

  const [ptmModalOpen, setPtmModalOpen] = useState<boolean>(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState<boolean>(false);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [quickActionOpen, setQuickActionOpen] = useState<boolean>(false);

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

  const signIn = useCallback((account: StaffAccount) => {
    setCurrentUser(toAuthUser(account));
    setSelectedCampus(CAMPUSES.find(c => c.id === account.campusId) || CAMPUSES[0]);
    setAdminView(HOME_VIEW[account.staffRole]);
    setIsAuthenticated(true);
    addToast(`Signed in as ${account.name}`, 'success', account.roleTitle);
  }, [addToast]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setSidebarOpen(false);
    addToast('Signed out', 'info');
  }, [addToast]);

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
        signIn,
        logout,
        adminView,
        setAdminView,
        selectedCampus,
        setSelectedCampus,
        campuses,
        setCampuses,
        student,
        setStudent,
        attendanceRecords,
        updateStudentAttendance,
        markAllPresent,
        invoices,
        driverCurrentStopIndex,
        advanceDriverStop,
        sosActive,
        triggerSos,
        ptmModalOpen,
        setPtmModalOpen,
        leaveModalOpen,
        setLeaveModalOpen,
        searchModalOpen,
        setSearchModalOpen,
        quickActionOpen,
        setQuickActionOpen,
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
