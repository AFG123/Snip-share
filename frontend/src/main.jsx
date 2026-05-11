import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ManagePage from "./pages/ManagePage";
import ViewerPage from "./pages/ViewerPage";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/manage/:token" element={<ManagePage />} />
      <Route path="/:shortId" element={<ViewerPage />} />
    </Routes>
  </BrowserRouter>
);
