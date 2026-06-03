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
