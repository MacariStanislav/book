
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import ScheduleApp from "./ScheduleApp";
import DayView from "./DayView";
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <ScheduleApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/day/:date"
          element={
            <ProtectedRoute>
              <DayView />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
