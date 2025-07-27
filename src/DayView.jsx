import React from "react";
import { useParams, useNavigate } from "react-router-dom";

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6:00 - 23:00
const DAY_OF_WEEK_ABBR = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function DayView() {
  const { date } = useParams();
  const navigate = useNavigate();

  const savedTasks = localStorage.getItem("tasks");
  const tasks = savedTasks ? JSON.parse(savedTasks) : [];

 const [year, month, day] = date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayAbbr = DAY_OF_WEEK_ABBR[dateObj.getDay()];

  const dayTasks = tasks.filter(
    (task) =>
      task.date === date ||
      (task.days && task.days.includes(dayAbbr))
  );

  
  const tasksByTime = {};

  dayTasks.forEach((task) => {
   
    const [hoursStr] = task.time.split(":");
    const hourKey = hoursStr.padStart(2, "0") + ":00";

    if (!tasksByTime[hourKey]) tasksByTime[hourKey] = [];
    tasksByTime[hourKey].push(task);
  });

  const deleteTask = (id) => {
    const filtered = tasks.filter((t) => t.id !== id);
    localStorage.setItem("tasks", JSON.stringify(filtered));
    window.location.reload();
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 20, cursor: "pointer", border:'1px solid black', borderRadius:'20px',background:'red',padding:'4px 12px',fontSize:'1rem' }}>
        ← Назад к неделе
      </button>
      <h2>Задачи на {date}</h2>
      {HOURS.map((hour) => {
        const hourStr = hour.toString().padStart(2, "0") + ":00";
        const hourTasks = tasksByTime[hourStr] || [];

        return (
          <div
            key={hour}
            style={{
              borderBottom: "1px solid #444",
              padding: "8px 0",
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 60,
                color: "#888",
                fontWeight: "600",
                userSelect: "none",
              }}
            >
              {hourStr}
            </div>
            <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {hourTasks.length === 0 ? (
                <span style={{ color: "#666", fontStyle: "italic" }}>—</span>
              ) : (
                hourTasks.map(({ id, title, color, time }) => (
                  <div
                    key={id}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      backgroundColor: color,
                      color: "#fff",
                      marginBottom: 4,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{time} - {title}</span>
                    <button
                      onClick={() => deleteTask(id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: "700",
                        fontSize: 18,
                        lineHeight: 1,
                      }}
                      aria-label="Удалить задачу"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DayView;
