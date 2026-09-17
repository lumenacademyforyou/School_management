import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AdminView } from './types';
import { HOME_VIEW, ROLE_LABEL, canChangeView, canView, viewModules } from './data/staffAccess';
import { hasApproval } from './data/permissions';
import { ReadOnlyGuard } from './components/common/ReadOnlyGuard';

// Layout
import { AdminHeader } from './components/layout/AdminHeader';
import { AdminSidebar } from './components/layout/AdminSidebar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { QuickActionDrawer } from './components/layout/QuickActionDrawer';
import { PTMBookingModal } from './components/layout/PTMBookingModal';
import { LeaveApplicationModal } from './components/layout/LeaveApplicationModal';
import { ToastContainer } from './components/layout/ToastContainer';

// Screens
import { DashboardView } from './views/admin/DashboardView';
import { FeatureMasterView } from './views/admin/FeatureMasterView';
import { Student360View } from './views/admin/Student360View';
import { TransportView } from './views/admin/TransportView';
import { HostelView } from './views/admin/HostelView';
import { QuestionPaperGeneratorView } from './views/admin/questionPapers/QuestionPaperGeneratorView';
import { QuestionBankView } from './views/admin/QuestionBankView';
import { LMSCoursesView } from './views/admin/LMSCoursesView';
import { AssignmentStudioView } from './views/admin/AssignmentStudioView';
import { TenancyRBACView } from './views/admin/TenancyRBACView';
import { AuditLogView } from './views/admin/AuditLogView';
import { AcademicsView } from './views/admin/AcademicsView';
import { HRPayrollView } from './views/admin/HRPayrollView';
import { LibraryView } from './views/admin/LibraryView';
import { InventoryView } from './views/admin/InventoryView';
import { ProcurementView } from './views/admin/ProcurementView';
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
import { CurriculumView } from './views/admin/CurriculumView';
import { ExaminationsView } from './views/admin/ExaminationsView';
import { WorkflowsView } from './views/admin/WorkflowsView';
import { ReportsView } from './views/admin/ReportsView';
import { IdCardStudioView } from './views/admin/IdCardStudioView';
import { StudentDirectoryView } from './views/admin/StudentDirectoryView';
import { FeesDeskView } from './views/admin/FeesDeskView';
import { AdmissionsDeskView } from './views/admin/AdmissionsDeskView';
import { AttendanceDeskView } from './views/admin/AttendanceDeskView';
import { CommunicationDeskView } from './views/admin/CommunicationDeskView';
import { StaffLoginView } from './views/auth/StaffLoginView';
import { AccessGrantsView } from './views/admin/AccessGrantsView';

const renderView = (view: AdminView) => {
  switch (view) {
    case 'dashboard':
      return <DashboardView />;
    case 'feature-spec-matrix':
      return <FeatureMasterView />;
    case 'students':
      return <StudentDirectoryView />;
    case 'student-360':
      return <Student360View />;
    case 'teacher-management':
      return <TeacherManagementView />;
    case 'non-teaching-staff':
      return <NonTeachingStaffView />;
    case 'hr-and-payroll':
      return <HRPayrollView />;
    case 'id-cards':
      return <IdCardStudioView />;
    case 'academics':
      return <AcademicsView />;
    case 'curriculum':
      return <CurriculumView />;
    case 'timetable':
      return <TimetableSubstitutionView />;
    case 'results':
      return <ReportCardsView />;
    case 'attendance':
      return <AttendanceDeskView />;
    case 'exams':
      return <ExaminationsView />;
    case 'question-papers':
      return <QuestionPaperGeneratorView />;
    case 'fees':
      return <FeesDeskView />;
    case 'accounting':
      return <AccountingView />;
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
    case 'lms':
      return <LMSCoursesView />;
    case 'assignments':
      return <AssignmentStudioView />;
    case 'question-bank':
      return <QuestionBankView />;
    case 'communication':
      return <CommunicationDeskView />;
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
    case 'masters':
      return <MastersConfigView />;
    case 'data-migration':
      return <DataMigrationView />;
    case 'documents':
      return <DocumentManagementView />;
    case 'users-and-roles':
    case 'tenants':
      return <TenancyRBACView />;
    case 'workflows':
      return <WorkflowsView />;
    case 'reports':
      return <ReportsView />;
    case 'access-grants':
      return <AccessGrantsView />;
    default:
      return <DashboardView />;
  }
};

/** Shown when a screen is opened that the signed-in role is not allotted (RBAC-010). */
const NotAllotted: React.FC = () => {
  const { currentUser, setAdminView } = useApp();
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-3">
        <span className="material-symbols-outlined text-5xl text-[#777587]">lock</span>
        <h1 className="text-lg font-bold text-[#082b3d]">Not available for your role</h1>
        <p className="text-sm text-[#464555]">This screen is not allotted to the {ROLE_LABEL[currentUser.staffRole]} role. Ask the Principal if you need access.</p>
        <button onClick={() => setAdminView(HOME_VIEW[currentUser.staffRole])} className="rounded-lg bg-[#0e5d84] text-white text-sm font-semibold px-4 py-2">
          Back to my workspace
        </button>
      </div>
    </div>
  );
};

/** Screens that check each action against the grant matrix themselves, or only display data. */
const SELF_ENFORCING: AdminView[] = ['dashboard', 'feature-spec-matrix', 'access-grants', 'fees', 'workflows', 'audit-log', 'reports', 'question-papers', 'question-bank'];

const Screen: React.FC<{ view: AdminView }> = ({ view }) => {
  const { currentUser } = useApp();
  const role = currentUser.staffRole;
  if (!canView(role, view)) return <NotAllotted />;
  if (SELF_ENFORCING.includes(view) || canChangeView(role, view)) return renderView(view);
  const modules = viewModules(view);
  return (
    <ReadOnlyGuard
      key={view}
      canApprove={modules.some(m => hasApproval(role, m))}
      note={`${ROLE_LABEL[role]} can view ${modules.join(', ')} records here; changes belong to the accountable role in the Access Grants table.`}
    >
      {renderView(view)}
    </ReadOnlyGuard>
  );
};

const Console: React.FC = () => {
  const { adminView, sidebarOpen, setSidebarOpen, isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return (
      <>
        <StaffLoginView />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f8f9ff] text-[#082b3d] font-sans antialiased">
      <AdminHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <div className="hidden md:flex shrink-0 h-full">
          <AdminSidebar />
        </div>

        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div
              className="relative flex-1 max-w-xs w-full bg-white shadow-2xl flex flex-col z-50"
              onClick={e => {
                if ((e.target as HTMLElement).closest('[data-nav]')) setSidebarOpen(false);
              }}
            >
              <AdminSidebar />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <Screen view={adminView} />
        </main>
      </div>

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
      <Console />
    </AppProvider>
  );
}
