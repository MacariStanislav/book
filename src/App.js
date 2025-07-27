import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScheduleApp from "./ScheduleApp";
import DayView from "./DayView";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ScheduleApp />} />
        <Route path="/day/:date" element={<DayView />} />
      </Routes>
    </Router>
  );
}

export default App;
