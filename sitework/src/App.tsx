import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { StateProvider } from '@/state/StateProvider'
import { AppShell } from '@/components/AppShell'
import { Placeholder } from '@/components/Placeholder'
import { ProjectsList } from '@/modules/Projects/ProjectsList'
import { ProjectLayout } from '@/modules/project/ProjectLayout'
import { ProjectTab } from '@/modules/project/ProjectTab'
import { OverviewTab } from '@/modules/project/Overview/OverviewTab'
import { BoqTab } from '@/modules/project/Boq/BoqTab'
import { PcPsTab } from '@/modules/project/PcPs/PcPsTab'
import { VariationsTab } from '@/modules/project/Variations/VariationsTab'
import { InvoicesTab } from '@/modules/project/Invoices/InvoicesTab'
import { POsTab } from '@/modules/project/Pos/POsTab'
import { ClaimsTab } from '@/modules/project/Claims/ClaimsTab'
import { DefectsTab } from '@/modules/project/Defects/DefectsTab'
import { MilestonesTab } from '@/modules/project/Milestones/MilestonesTab'
import { DiaryTab } from '@/modules/project/Diary/DiaryTab'
import { RfisTab } from '@/modules/project/Rfis/RfisTab'
import { SelectionsTab } from '@/modules/project/Selections/SelectionsTab'
import { TimesheetsTab } from '@/modules/project/Timesheets/TimesheetsTab'
import { CalendarTab } from '@/modules/project/Calendar/CalendarTab'
import { OpenBookTab } from '@/modules/project/OpenBook/OpenBookTab'
import { CashFlowTab } from '@/modules/project/CashFlow/CashFlowTab'
import { ClientsPage } from '@/modules/Clients'
import { DashboardPage } from '@/modules/Dashboard'
import { SubsPage } from '@/modules/Subcontractors'
import { LeadsPage } from '@/modules/Leads'
import { EstimatingPage } from '@/modules/Estimating'
import { SettingsPage } from '@/modules/Settings'
import { MaterialsPage } from '@/modules/Materials'
import { SuppliersPage } from '@/modules/Suppliers'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsList /> },
      {
        path: 'projects/:projectId',
        element: <ProjectLayout />,
        children: [
          { index: true, element: <Navigate to="overview" replace /> },
          { path: 'overview', element: <OverviewTab /> },
          { path: 'boq', element: <BoqTab /> },
          { path: 'pcps', element: <PcPsTab /> },
          { path: 'variations', element: <VariationsTab /> },
          { path: 'invoices', element: <InvoicesTab /> },
          { path: 'purchases', element: <POsTab /> },
          { path: 'claims', element: <ClaimsTab /> },
          { path: 'defects', element: <DefectsTab /> },
          { path: 'schedule', element: <MilestonesTab /> },
          { path: 'diary', element: <DiaryTab /> },
          { path: 'rfis', element: <RfisTab /> },
          { path: 'selections', element: <SelectionsTab /> },
          { path: 'timesheets', element: <TimesheetsTab /> },
          { path: 'calendar', element: <CalendarTab /> },
          { path: 'openbook', element: <OpenBookTab /> },
          { path: 'cashflow', element: <CashFlowTab /> },
          { path: ':tab', element: <ProjectTab /> },
        ],
      },
      { path: 'leads', element: <LeadsPage /> },
      { path: 'estimating', element: <EstimatingPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'subs', element: <SubsPage /> },
      {
        path: 'education',
        element: <Placeholder title="Help & Learn" note="Ported in a later session." />,
      },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'materials', element: <MaterialsPage /> },
      { path: 'suppliers', element: <SuppliersPage /> },
      { path: '*', element: <Placeholder title="Not found" note="No such page." /> },
    ],
  },
])

function App() {
  return (
    <StateProvider>
      <RouterProvider router={router} />
    </StateProvider>
  )
}

export default App
