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

/** Table density; a per-user display preference. */
export type Density = 'comfortable' | 'compact';

/** The overlays the console shell owns. Only one of them shows at a time. */
type Overlay = 'ptm' | 'leave' | 'search' | 'quickAction';

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

  // Display preferences (per signed-in user, for this browser session)
  density: Density;
  setDensity: (density: Density) => void;

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

  // Modals and drawers. Only one is ever open: opening one closes whichever was showing, so
  // overlays cannot stack and Escape always dismisses what the user is actually looking at.
  ptmModalOpen: boolean;
  setPtmModalOpen: (open: boolean) => void;
  leaveModalOpen: boolean;
  setLeaveModalOpen: (open: boolean) => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  quickActionOpen: boolean;
  setQuickActionOpen: (open: boolean) => void;
  /** True while any of the above is showing; shell shortcuts stand down. */
  overlayOpen: boolean;

  // Mobile sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  /** Desktop: sidebar hidden or shown. Remembered on this device. */
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;

  // Toast
  toasts: ToastMessage[];
  addToast: (title: string, type?: 'success' | 'info' | 'warning' | 'error', description?: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SIDEBAR_KEY = 'lumen.sidebar.collapsed';

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
  const [densityByUser, setDensityByUser] = useState<Record<string, Density>>({});
  const density = densityByUser[currentUser.id] ?? 'comfortable';
  const setDensity = useCallback((next: Density) => setDensityByUser(prev => ({ ...prev, [currentUser.id]: next })), [currentUser.id]);

  const [campuses, setCampuses] = useState<Campus[]>(CAMPUSES);
  const [selectedCampus, setSelectedCampus] = useState<Campus>(CAMPUSES[0]);
  const [student, setStudent] = useState<Student>(() => toProfile(INITIAL_ROSTER[0]));

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(CLASS_10A_STUDENTS);
  const [invoices] = useState<FeeInvoice[]>(FEE_INVOICES);

  const [driverCurrentStopIndex, setDriverCurrentStopIndex] = useState<number>(3);
  const [sosActive, setSosActive] = useState<boolean>(false);

  // One overlay at a time. The per-overlay booleans below are derived from it, so every existing
  // caller keeps working while opening one overlay now dismisses any other.
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  // Stable identities: consumers key keyboard-listener effects off these setters.
  const setPtmModalOpen = useCallback((open: boolean) => setOverlay(prev => (open ? 'ptm' : prev === 'ptm' ? null : prev)), []);
  const setLeaveModalOpen = useCallback((open: boolean) => setOverlay(prev => (open ? 'leave' : prev === 'leave' ? null : prev)), []);
  const setSearchModalOpen = useCallback((open: boolean) => setOverlay(prev => (open ? 'search' : prev === 'search' ? null : prev)), []);
  const setQuickActionOpen = useCallback((open: boolean) => setOverlay(prev => (open ? 'quickAction' : prev === 'quickAction' ? null : prev)), []);
  const ptmModalOpen = overlay === 'ptm';
  const leaveModalOpen = overlay === 'leave';
  const searchModalOpen = overlay === 'search';
  const quickActionOpen = overlay === 'quickAction';
  const overlayOpen = overlay !== null;

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(SIDEBAR_KEY) === '1';
    } catch {
      return false;
    }
  });
  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed(prev => {
      try {
        window.localStorage.setItem(SIDEBAR_KEY, prev ? '0' : '1');
      } catch {
        // Storage unavailable: the choice lasts until reload
      }
      return !prev;
    });
  }, []);

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
        density,
        setDensity,
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
        overlayOpen,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        sidebarCollapsed,
        toggleSidebarCollapsed,
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
