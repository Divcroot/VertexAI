import { Toaster } from "react-hot-toast";

import { Route, Routes } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import ProjectPage from "./pages/ProjectPage";
import Plans from "./pages/Plans";

const App = () => {

  return (
    <>

      <Routes>
        <Route path='/project/:id' element={<ProjectPage />} />
        <Route path='/' element={<Dashboard />} />
        <Route path='/plans' element={<Plans />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />

    </>
  );
};

export default App;