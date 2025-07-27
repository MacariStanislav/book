import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6:00 - 23:00
const DAY_OF_WEEK_ABBR = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function DayView() {
  const { date } = useParams();
  const navigate = useNavigate();

  const savedTasks = localStorage.getItem("tasks");
  const allTasks = savedTasks ? JSON.parse(savedTasks) : [];

  // Загружаем объект отметок выполнения из localStorage
  const savedCompletion = localStorage.getItem("completionStatus");
  const completionStatusInit = savedCompletion ? JSON.parse(savedCompletion) : {};

  const [tasks, setTasks] = useState(allTasks);
  const [completionStatus, setCompletionStatus] = useState(completionStatusInit);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("completionStatus", JSON.stringify(completionStatus));
  }, [completionStatus]);

  const [year, month, day] = date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayAbbr = DAY_OF_WEEK_ABBR[dateObj.getDay()];

  // Фильтруем задачи на этот день
  const dayTasks = tasks.filter(
    (task) =>
      task.date === date ||
      (task.days && task.days.includes(dayAbbr))
  );

  // Группируем задачи по времени
  const tasksByTime = {};
  dayTasks.forEach((task) => {
    const [hoursStr] = task.time.split(":");
    const hourKey = hoursStr.padStart(2, "0") + ":00";
    if (!tasksByTime[hourKey]) tasksByTime[hourKey] = [];
    tasksByTime[hourKey].push(task);
  });

  // Проверяем, выполнена ли задача в этот день
  const isCompleted = (taskId) => {
    return completionStatus[taskId]?.[date] === true;
  };

  // Переключаем состояние выполнения задачи только для текущей даты
  const toggleComplete = (taskId) => {
    setCompletionStatus((prev) => {
      const taskDates = prev[taskId] || {};
      const currentStatus = taskDates[date] === true;
      const updatedTaskDates = { ...taskDates, [date]: !currentStatus };
      return { ...prev, [taskId]: updatedTaskDates };
    });
  };

  const deleteTask = (id) => {
    const filtered = tasks.filter((t) => t.id !== id);
    setTasks(filtered);

    // Удаляем отметки выполнения для удаленной задачи
    setCompletionStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[id];
      return newStatus;
    });
  };

  return (
    <div
      style={{
        padding: 20,
        color: "#eee",
        backgroundColor: "#121212",
        minHeight: "100vh",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 20,
          cursor: "pointer",
          border: "1px solid black",
          borderRadius: "20px",
          background: "red",
          padding: "4px 12px",
          fontSize: "1rem",
          color: "white",
        }}
      >
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
            <div
              style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 8 }}
            >
              {hourTasks.length === 0 ? (
                <span style={{ color: "#666", fontStyle: "italic" }}>—</span>
              ) : (
                hourTasks.map(({ id, title, color, time }) => {
                  const completed = isCompleted(id);
                  return (
                    <div
                      key={id}
                      onClick={() => toggleComplete(id)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        backgroundColor: completed ? "#2ecc71" : color,
                        color: completed ? "#000" : "#fff",
                        marginBottom: 4,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        userSelect: "none",
                        border: completed ? "2px solid #27ae60" : "none",
                        textDecoration: completed ? "line-through" : "none",
                        transition: "background-color 0.3s ease",
                      }}
                      title={
                        completed
                          ? "Задача выполнена. Кликните, чтобы отменить."
                          : "Кликните, чтобы отметить как выполненную."
                      }
                    >
                      <span>
                        {time} - {title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(id);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: completed ? "#000" : "#fff",
                          cursor: "pointer",
                          fontWeight: "700",
                          fontSize: 18,
                          lineHeight: 1,
                          marginLeft: 6,
                        }}
                        aria-label="Удалить задачу"
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DayView;
