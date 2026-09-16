import React from 'react';
import { AppProvider, useApp } from './context/AppContext';

// Layout components
import { AdminHeader } from './components/layout/AdminHeader';
import { AdminSidebar } from './components/layout/AdminSidebar';
import { ParentHeader } from './components/layout/ParentHeader';
import { ParentBottomNav } from './components/layout/ParentBottomNav';
import { FacultyHeader } from './components/layout/FacultyHeader';
import { FacultyBottomNav } from './components/layout/FacultyBottomNav';
import { DriverHeader } from './components/layout/DriverHeader';
import { DriverBottomNav } from './components/layout/DriverBottomNav';

// Modals & Overlays
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { QuickActionDrawer } from './components/layout/QuickActionDrawer';
import { PTMBookingModal } from './components/layout/PTMBookingModal';
import { LeaveApplicationModal } from './components/layout/LeaveApplicationModal';
import { ToastContainer } from './components/layout/ToastContainer';

// Admin Views
import { DashboardView } from './views/admin/DashboardView';
import { FeatureMasterView } from './views/admin/FeatureMasterView';
import { Student360View } from './views/admin/Student360View';
import { AttendanceDeskView } from './views/admin/AttendanceDeskView';
import { TransportView } from './views/admin/TransportView';
import { HostelView } from './views/admin/HostelView';
import { QuestionPapersView } from './views/admin/QuestionPapersView';
import { QuestionBankView } from './views/admin/QuestionBankView';
import { LMSCoursesView } from './views/admin/LMSCoursesView';
import { AssignmentStudioView } from './views/admin/AssignmentStudioView';
import { TenancyRBACView } from './views/admin/TenancyRBACView';
import { AuditLogView } from './views/admin/AuditLogView';
import { AdmissionsDeskView } from './views/admin/AdmissionsDeskView';
import { AcademicsView } from './views/admin/AcademicsView';
import { HRPayrollView } from './views/admin/HRPayrollView';
import { LibraryView } from './views/admin/LibraryView';
import { InventoryView } from './views/admin/InventoryView';
import { ProcurementView } from './views/admin/ProcurementView';
import { CommunicationDeskView } from './views/admin/CommunicationDeskView';
import { DPDPAComplianceView } from './views/admin/DPDPAComplianceView';
import { UDISEAPAARView } from './views/admin/UDISEAPAARView';
import { DigiLockerCertificatesView } from './views/admin/DigiLockerCertificatesView';
import { AccountingView } from './views/admin/AccountingView';
import { HelpdeskView } from './views/admin/HelpdeskView';
import { IntegrationsView } from './views/admin/IntegrationsView';
import { MastersConfigView } from './views/admin/MastersConfigView';
import { DataMigrationView } from './views/admin/DataMigrationView';
import { DocumentManagementView } from './views/admin/DocumentManagementView';
import { ReportCardsView } from './views/admin/ReportCardsView';
import { TimetableSubstitutionView } from './views/admin/TimetableSubstitutionView';
import { TeacherManagementView } from './views/admin/TeacherManagementView';
import { NonTeachingStaffView } from './views/admin/NonTeachingStaffView';
import { DesignSystemView } from './views/admin/DesignSystemView';
import { CurriculumView } from './views/admin/CurriculumView';
import { ExaminationsView } from './views/admin/ExaminationsView';
import { WorkflowsView } from './views/admin/WorkflowsView';
import { ReportsView } from './views/admin/ReportsView';
import { IdCardStudioView } from './views/admin/IdCardStudioView';
import { StudentDirectoryView } from './views/admin/StudentDirectoryView';
import { FeesDeskView } from './views/admin/FeesDeskView';

// Parent Views
import { ParentHomeView } from './views/parent/ParentHomeView';
import { ParentAcademicsView } from './views/parent/ParentAcademicsView';
import { ParentBusView } from './views/parent/ParentBusView';
import { ParentFeesView } from './views/parent/ParentFeesView';
import { ParentPTMView } from './views/parent/ParentPTMView';

// Faculty Views
import { FacultyPeriodsView } from './views/faculty/FacultyPeriodsView';
import { FacultyRosterView } from './views/faculty/FacultyRosterView';
import { FacultyGradebookView } from './views/faculty/FacultyGradebookView';
import { FacultyLeaveProfileView } from './views/faculty/FacultyLeaveProfileView';

// Driver Views
import { DriverConsoleView } from './views/driver/DriverConsoleView';

// Student View
import { StudentPortalView } from './views/student/StudentPortalView';

// Auth & Modals
import { LoginView } from './views/auth/LoginView';
import { UsageGuideModal } from './components/modals/UsageGuideModal';

/** Reusable mobile device frame wrapper for portal previews */
const MobileFrame: React.FC<{ children: React.ReactNode; maxWidth?: string }> = ({
  children,
  maxWidth = '440px',
}) => (
  <div className="flex-1 flex items-center justify-center p-3 sm:p-5 min-h-0 overflow-y-auto bg-slate-900/10">
    <div
      className="w-full h-[840px] max-h-[92vh] bg-white rounded-[40px] shadow-2xl border-[8px] border-slate-900 flex flex-col overflow-hidden relative zoom-in"
      style={{ maxWidth }}
    >
      <div className="flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  </div>
);

const MainLayout: React.FC = () => {
  const {
    role,
    adminView,
    parentView,
    facultyView,
    driverView,
    previewDevice,
    sidebarOpen,
    setSidebarOpen,
    isAuthenticated,
    showLoginModal,
    setShowLoginModal,
  } = useApp();

  const renderAdminView = () => {
    switch (adminView) {
      case 'dashboard':
        return <DashboardView />;
      case 'feature-spec-matrix':
        return <FeatureMasterView />;
      // PEOPLE & STUDENTS
      case 'students':
      case 'parents':
        return <StudentDirectoryView />;
      case 'student-360':
        return <Student360View />;
      case 'teacher-management':
      case 'teachers':
        return <TeacherManagementView />;
      case 'non-teaching-staff':
      case 'employees':
        return <NonTeachingStaffView />;
      case 'hr-and-payroll':
      case 'payroll':
        return <HRPayrollView />;
      case 'id-cards':
        return <IdCardStudioView />;
      // ACADEMICS & TIMETABLE & RESULTS
      case 'classes':
      case 'academics':
        return <AcademicsView />;
      case 'subjects':
      case 'curriculum':
        return <CurriculumView />;
      case 'timetable':
        return <TimetableSubstitutionView />;
      case 'results':
      case 'report-cards':
        return <ReportCardsView />;
      case 'attendance':
        return <AttendanceDeskView />;
      case 'exams':
        return <ExaminationsView />;
      case 'question-papers':
        return <QuestionPapersView />;
      // FINANCE & ACCOUNTING
      case 'fees':
      case 'payments':
      case 'invoices':
      case 'financial-reports':
      case 'fees-and-finance':
        return <FeesDeskView />;
      case 'accounting':
        return <AccountingView />;
      // OPERATIONS & SERVICES
      case 'admissions':
        return <AdmissionsDeskView />;
      case 'library':
        return <LibraryView />;
      case 'transport':
        return <TransportView />;
      case 'hostel':
        return <HostelView />;
      case 'inventory':
        return <InventoryView />;
      case 'procurement':
        return <ProcurementView />;
      case 'helpdesk':
        return <HelpdeskView />;
      // LEARNING & CLASSROOM
      case 'lms':
      case 'lms-and-courses':
        return <LMSCoursesView />;
      case 'assignments':
      case 'assignment-studio':
        return <AssignmentStudioView />;
      case 'question-bank':
        return <QuestionBankView />;
      // ENGAGEMENT & COMMS
      case 'communication':
      case 'broadcast-sms':
      case 'notifications':
        return <CommunicationDeskView />;
      case 'parent-app-preview':
        return <ParentHomeView />;
      // COMPLIANCE & INTEGRATIONS
      case 'dpdpa-and-consent':
        return <DPDPAComplianceView />;
      case 'udise-and-apaar':
        return <UDISEAPAARView />;
      case 'certificates':
        return <DigiLockerCertificatesView />;
      case 'audit-log':
        return <AuditLogView />;
      case 'integrations':
        return <IntegrationsView />;
      // PLATFORM FOUNDATION & CONFIG
      case 'masters':
        return <MastersConfigView />;
      case 'data-migration':
        return <DataMigrationView />;
      case 'documents':
        return <DocumentManagementView />;
      case 'users-and-roles':
      case 'auth-and-rbac':
      case 'tenants':
      case 'tenancy-and-campuses':
      case 'settings':
        return <TenancyRBACView />;
      case 'workflows':
        return <WorkflowsView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <DashboardView />;
    }
  };

  const renderParentView = () => {
    switch (parentView) {
      case 'home':
        return <ParentHomeView />;
      case 'academics':
        return <ParentAcademicsView />;
      case 'bus':
        return <ParentBusView />;
      case 'fees':
        return <ParentFeesView />;
      case 'ptm':
        return <ParentPTMView />;
      default:
        return <ParentHomeView />;
    }
  };

  const renderFacultyView = () => {
    switch (facultyView) {
      case 'schedule-home':
        return <FacultyPeriodsView />;
      case 'attendance-roster':
        return <FacultyRosterView />;
      case 'grades-gradebook':
        return <FacultyGradebookView />;
      case 'leave-faculty-profile':
        return <FacultyLeaveProfileView />;
      default:
        return <FacultyRosterView />;
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
        <UsageGuideModal />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f8f9ff] text-[#082b3d] font-sans antialiased">
      {/* Role-Specific Portal Containers */}
      {role === 'admin' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden fade-in">
          <AdminHeader />
          <div className="flex-1 flex min-h-0 overflow-hidden relative">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex shrink-0 h-full">
              <AdminSidebar />
            </div>

            {/* Mobile Drawer Sidebar */}
            {sidebarOpen && (
              <div className="md:hidden fixed inset-0 z-50 flex">
                <div
                  className="fixed inset-0 bg-black/40 backdrop-blur-xs fade-in"
                  onClick={() => setSidebarOpen(false)}
                />
                <div className="relative flex-1 max-w-xs w-full bg-white shadow-2xl flex flex-col z-50 slide-in-from-left">
                  <div className="flex items-center justify-between p-3 border-b border-[#e0ecf4]">
                    <span className="text-xs font-bold text-[#082b3d] uppercase tracking-wider">
                      LumenAcademy Operations Menu
                    </span>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1 rounded-lg text-[#777587] hover:bg-slate-100 text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto" onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button')) {
                      setSidebarOpen(false);
                    }
                  }}>
                    <AdminSidebar />
                  </div>
                </div>
              </div>
            )}

            <main className="flex-1 overflow-y-auto">
              {renderAdminView()}
            </main>
          </div>
        </div>
      )}

      {role === 'parent' && (
        previewDevice === 'mobile-mock' ? (
          <MobileFrame maxWidth="420px">
            <ParentHeader />
            <main className="flex-1 overflow-y-auto">
              {renderParentView()}
            </main>
            <ParentBottomNav />
          </MobileFrame>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 fade-in">
            <ParentHeader />
            <main className="flex-1 overflow-y-auto">
              {renderParentView()}
            </main>
            <ParentBottomNav />
          </div>
        )
      )}

      {role === 'faculty' && (
        previewDevice === 'mobile-mock' ? (
          <MobileFrame>
            <FacultyHeader />
            <main className="flex-1 overflow-y-auto">
              {renderFacultyView()}
            </main>
            <FacultyBottomNav />
          </MobileFrame>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 fade-in">
            <FacultyHeader />
            <main className="flex-1 overflow-y-auto">
              {renderFacultyView()}
            </main>
            <FacultyBottomNav />
          </div>
        )
      )}

      {role === 'driver' && (
        previewDevice === 'mobile-mock' ? (
          <MobileFrame>
            <DriverHeader />
            <main className="flex-1 overflow-y-auto">
              <DriverConsoleView />
            </main>
            <DriverBottomNav />
          </MobileFrame>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 fade-in">
            <DriverHeader />
            <main className="flex-1 overflow-y-auto">
              <DriverConsoleView />
            </main>
            <DriverBottomNav />
          </div>
        )
      )}

      {role === 'student' && (
        <div className="flex-1 flex flex-col min-h-0 fade-in">
          <main className="flex-1 overflow-y-auto">
            <StudentPortalView />
          </main>
        </div>
      )}

      {role === 'design-system' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto fade-in">
          <DesignSystemView />
        </div>
      )}

      {/* Login / Participant Switcher Modal Overlay */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs fade-in"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-[#cbe0ec] zoom-in"
            onClick={e => e.stopPropagation()}
          >
            <LoginView isModal onDismissModal={() => setShowLoginModal(false)} />
          </div>
        </div>
      )}

      {/* Global Overlays & Modals */}
      <UsageGuideModal />
      <GlobalSearchModal />
      <QuickActionDrawer />
      <PTMBookingModal />
      <LeaveApplicationModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
