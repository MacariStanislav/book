import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import ScheduleApp from "./ScheduleApp";
import DayView from "./DayView";
import ProtectedRoute from "./ProtectedRoute";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (loadingAuth) {
    return <div style={{ padding: 20, color: "#eee" }}>Загрузка...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/schedule" : "/login"} replace />} />

        <Route path="/login" element={user ? <Navigate to="/schedule" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/schedule" replace /> : <Register />} />

        <Route
          path="/schedule"
          element={
            <ProtectedRoute user={user}>
              <ScheduleApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/day/:date"
          element={
            <ProtectedRoute user={user}>
              <DayView />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={user ? "/schedule" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
