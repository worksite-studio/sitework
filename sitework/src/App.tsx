import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { StateProvider } from '@/state/StateProvider'
import { AppShell } from '@/components/AppShell'
import { Placeholder } from '@/components/Placeholder'
import { ProjectsList } from '@/modules/Projects/ProjectsList'
import { ProjectLayout } from '@/modules/project/ProjectLayout'
import { ProjectTab } from '@/modules/project/ProjectTab'
import { ClientsPage } from '@/modules/Clients'
import { DashboardPage } from '@/modules/Dashboard'
import { SubsPage } from '@/modules/Subcontractors'
import { LeadsPage } from '@/modules/Leads'
import { EstimatingPage } from '@/modules/Estimating'

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
      {
        path: 'settings',
        element: <Placeholder title="Settings" note="Ported in Sessions 5–7." />,
      },
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
