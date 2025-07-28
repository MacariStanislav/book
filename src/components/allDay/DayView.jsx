import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../../baseDate/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, set } from "firebase/database";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_OF_WEEK_ABBR = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function DayView() {
  const { date } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const savedTasks = localStorage.getItem("tasks");
  const allTasks = savedTasks ? JSON.parse(savedTasks) : [];

  const savedCompletion = localStorage.getItem("completionStatus");
  const completionStatusInit = savedCompletion ? JSON.parse(savedCompletion) : {};

  const [tasks, setTasks] = useState(allTasks);
  const [completionStatus, setCompletionStatus] = useState(completionStatusInit);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedTime, setEditedTime] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loadingAuth && !user) {
      navigate("/login");
    }
  }, [loadingAuth, user, navigate]);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("completionStatus", JSON.stringify(completionStatus));
  }, [completionStatus]);

  if (loadingAuth) {
    return <div style={{ padding: 20, color: "#eee" }}>Загрузка...</div>;
  }

  const [year, month, day] = date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayAbbr = DAY_OF_WEEK_ABBR[dateObj.getDay()];

  const dayTasks = tasks.filter(
    (task) =>
      task.date === date || (task.days && task.days.includes(dayAbbr))
  );

  const tasksByHour = {};
  dayTasks.forEach((task) => {
    if (!task.time) return;
    const [hoursStr] = task.time.split(":");
    const hourKey = hoursStr.padStart(2, "0") + ":00";
    if (!tasksByHour[hourKey]) tasksByHour[hourKey] = [];
    tasksByHour[hourKey].push(task);
  });

  const isCompleted = (taskId) => {
    return completionStatus[taskId]?.[date] === true;
  };

  const toggleComplete = (taskId) => {
    setCompletionStatus((prev) => {
      const taskDates = prev[taskId] || {};
      const currentStatus = taskDates[date] === true;
      const updatedTaskDates = { ...taskDates, [date]: !currentStatus };
      return { ...prev, [taskId]: updatedTaskDates };
    });
  };

  const saveEditedTask = (id) => {
    const updatedTasks = tasks.map((t) =>
      t.id === id
        ? { ...t, title: editedTitle, description: editedDescription, time: editedTime }
        : t
    );
    setTasks(updatedTasks);
    setEditingTaskId(null);
    setEditedTitle("");
    setEditedDescription("");
    setEditedTime("");

    localStorage.setItem("tasks", JSON.stringify(updatedTasks));

    if (auth.currentUser) {
      const userRef = ref(db, `tasks/${auth.currentUser.uid}`);
      set(userRef, { tasks: updatedTasks });
    }
  };

  const deleteTask = (id) => {
    const updatedTasks = tasks.filter((t) => t.id !== id);
    setTasks(updatedTasks);
    setCompletionStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[id];
      return newStatus;
    });

    localStorage.setItem("tasks", JSON.stringify(updatedTasks));

    if (auth.currentUser) {
      const userRef = ref(db, `tasks/${auth.currentUser.uid}`);
      set(userRef, { tasks: updatedTasks });
    }
  };

  return (
    <div style={{ padding: 20, color: "#eee", backgroundColor: "#121212", minHeight: "100vh" }}>
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
        const hourTasks = tasksByHour[hourStr] || [];

        hourTasks.sort((a, b) => {
          const [aH, aM] = a.time.split(":").map(Number);
          const [bH, bM] = b.time.split(":").map(Number);
          return aH !== bH ? aH - bH : aM - bM;
        });

        return (
          <div
            key={hour}
            style={{
              borderBottom: "1px solid #444",
              padding: "8px 0",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div style={{ width: 60, color: "#888", fontWeight: "600", userSelect: "none" }}>
              {hourStr}
            </div>
            <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 8, wordBreak: "break-word" }}>
              {hourTasks.length === 0 ? (
                <span style={{ color: "#666", fontStyle: "italic" }}>—</span>
              ) : (
                hourTasks.map(({ id, title, color, time, description }) => {
                  const completed = isCompleted(id);
                  const isEditing = editingTaskId === id;

                  return (
                    <div
                      key={id}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        backgroundColor: completed ? "#2ecc71" : color,
                        color: completed ? "#000" : "#fff",
                        marginBottom: 4,
                        display: "inline-flex",
                        flexDirection: "column",
                        maxWidth: 300,
                        border: completed ? "2px solid #27ae60" : "none",
                        textDecoration: completed ? "line-through" : "none",
                        transition: "background-color 0.3s ease",
                        whiteSpace: "normal",
                        gap: 4,
                      }}
                    >
                      {isEditing ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            backgroundColor: "#1e1e1e",
                            padding: "8px",
                            borderRadius: "8px",
                            boxShadow: "0 0 8px rgba(0, 255, 255, 0.2)",
                          }}
                        >
                          <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            style={{
                              padding: "6px 8px",
                              borderRadius: 6,
                              border: "1px solid #555",
                              backgroundColor: "#2c2c2c",
                              color: "#fff",
                              fontSize: "1rem",
                              outline: "none",
                              transition: "border-color 0.3s ease",
                            }}
                            placeholder="Название задачи"
                            onFocus={(e) => (e.target.style.borderColor = "#00ffff")}
                            onBlur={(e) => (e.target.style.borderColor = "#555")}
                          />
                          <input
                            type="time"
                            value={editedTime}
                            onChange={(e) => setEditedTime(e.target.value)}
                            style={{
                              padding: "6px 8px",
                              borderRadius: 6,
                              border: "1px solid #555",
                              backgroundColor: "#2c2c2c",
                              color: "#fff",
                              fontSize: "1rem",
                              outline: "none",
                              transition: "border-color 0.3s ease",
                            }}
                            placeholder="Время задачи"
                            onFocus={(e) => (e.target.style.borderColor = "#00ffff")}
                            onBlur={(e) => (e.target.style.borderColor = "#555")}
                          />
                          <textarea
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            style={{
                              padding: "6px 8px",
                              borderRadius: 6,
                              border: "1px solid #555",
                              backgroundColor: "#2c2c2c",
                              color: "#fff",
                              fontSize: "0.95rem",
                              resize: "vertical",
                              minHeight: "60px",
                              outline: "none",
                              transition: "border-color 0.3s ease",
                            }}
                            placeholder="Описание задачи"
                            onFocus={(e) => (e.target.style.borderColor = "#00ffff")}
                            onBlur={(e) => (e.target.style.borderColor = "#555")}
                          />
                          <button
                            onClick={() => saveEditedTask(id)}
                            style={{
                              backgroundColor: "#00bcd4",
                              color: "#000",
                              fontWeight: "700",
                              border: "none",
                              borderRadius: "6px",
                              padding: "6px 10px",
                              cursor: "pointer",
                              alignSelf: "flex-end",
                              transition: "background-color 0.3s ease",
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#00ffff")}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#00bcd4")}
                            title="Сохранить"
                          >
                            ✔ Сохранить
                          </button>
                        </div>
                      ) : (
                        <>
                          <span
                            onClick={() => toggleComplete(id)}
                            title={completed ? "Отметить как невыполненную" : "Отметить как выполненную"}
                            style={{ cursor: "pointer", fontWeight: "600" }}
                          >
                            {time} - {title}
                          </span>
                          {description && (
                            <div style={{ fontSize: "0.9rem", color: completed ? "#000" : "#ddd" }}>
                              {description}
                            </div>
                          )}
                          <div style={{ marginTop: 4, display: "flex", gap: 4 }}>
                            <button
                              onClick={() => {
                                setEditingTaskId(id);
                                setEditedTitle(title);
                                setEditedDescription(description || "");
                                setEditedTime(time || "00:00");
                              }}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: completed ? "#000" : "#fff",
                                cursor: "pointer",
                                fontWeight: "700",
                                fontSize: 16,
                              }}
                              title="Редактировать"
                            >
                              ✎
                            </button>
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
                              }}
                              title="Удалить"
                            >
                              ×
                            </button>
                          </div>
                        </>
                      )}
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
