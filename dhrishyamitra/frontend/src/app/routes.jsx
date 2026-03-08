import { createBrowserRouter } from "react-router-dom";

import { DashboardLayout } from "./layouts/DashboardLayout";
import { RequireAuth } from "./components/RequireAuth";
import { Gallery } from "./pages/Gallery";
import { Upload } from "./pages/Upload";
import { People } from "./pages/People";
import { ChatAssistant } from "./pages/ChatAssistant";
import { LabelFaces } from "./pages/LabelFaces";
import { AuthPage } from "./pages/AuthPage";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Gallery />,
      },
      {
        path: "upload",
        element: <Upload />,
      },
      {
        path: "people",
        element: <People />,
      },
      {
        path: "chat",
        element: <ChatAssistant />,
      },
      {
        path: "label-faces",
        element: <LabelFaces />,
      },
    ],
  },
]);
