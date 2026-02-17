import React, { useState } from "react";
import Membership from "./Membership";
import Login from "./Login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem("hcm_authenticated") === "true"
  );

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return <Membership onLogout={() => setIsAuthenticated(false)} />;
}

export default App;
