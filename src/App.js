import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import ScheduleApp from "./components/main/ScheduleApp";
import DayView from "./components/allDay/DayView";
import ProtectedRoute from "./ProtectedRoute";
import { auth } from "./baseDate/firebase";
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
