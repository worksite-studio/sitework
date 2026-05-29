import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { StateProvider } from '@/state/StateProvider'
import { AppShell } from '@/components/AppShell'
import { Placeholder } from '@/components/Placeholder'
import { ProjectsList } from '@/modules/Projects/ProjectsList'
import { ProjectLayout } from '@/modules/project/ProjectLayout'
import { ProjectTab } from '@/modules/project/ProjectTab'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Placeholder title="Dashboard" note="Ported in Sessions 5–7." /> },
      { path: 'projects', element: <ProjectsList /> },
      {
        path: 'projects/:projectId',
        element: <ProjectLayout />,
        children: [
          { index: true, element: <Navigate to="overview" replace /> },
          { path: ':tab', element: <ProjectTab /> },
        ],
      },
      {
        path: 'leads',
        element: <Placeholder title="Leads / Tender" note="Ported in Sessions 5–7." />,
      },
      {
        path: 'estimating',
        element: <Placeholder title="Estimating" note="Ported in Sessions 5–7." />,
      },
      { path: 'clients', element: <Placeholder title="Clients" note="Ported in Sessions 5–7." /> },
      {
        path: 'subs',
        element: <Placeholder title="Subcontractors" note="Ported in Sessions 5–7." />,
      },
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
