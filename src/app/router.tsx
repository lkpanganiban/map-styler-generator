import { createBrowserRouter } from 'react-router-dom'
import { DataViewerPage } from '@/components/data-viewer/DataViewerPage'
import { LayoutDesignerPage } from '@/components/layout-designer/LayoutDesignerPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DataViewerPage />,
  },
  {
    path: '/layout',
    element: <LayoutDesignerPage />,
  },
])
