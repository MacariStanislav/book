import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../baseDate/firebase";
import { ref, onValue, set } from "firebase/database";
import "../../assets/ScheduleApp.css";

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const IMPORTANCE_COLORS = [
  { name: "Высокий", color: "#e74c3c" },
  { name: "Средний", color: "#e67e22" },
  { name: "Низкий", color: "#f1c40f" },
  { name: "Очень низкий", color: "#2ecc71" },
];

function getWeekDates(startDate) {
  const dates = [];
  const dayOfWeek = startDate.getDay();
  const diffToMon = (dayOfWeek + 6) % 7;
  const monday = new Date(startDate);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(startDate.getDate() - diffToMon);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDate(date) {
  return `${date.getDate()}.${date.getMonth() + 1}`;
}

function formatISODate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ScheduleApp() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState(() => {
    const local = localStorage.getItem("tasks");
    return local ? JSON.parse(local) : [];
  });
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState("days");
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [importanceIndex, setImportanceIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    if (!auth.currentUser) return;
    const userTasksRef = ref(db, `tasks/${auth.currentUser.uid}`);
    const unsubscribe = onValue(userTasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.tasks) {
        setTasks(data.tasks);
        localStorage.setItem("tasks", JSON.stringify(data.tasks));
      } else {
        const local = localStorage.getItem("tasks");
        if (local) setTasks(JSON.parse(local));
        else setTasks([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function updateOnlineStatus() {
      setIsOnline(navigator.onLine);
    }
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const addTask = () => {
    if (!title.trim() || !time) {
      alert("Заполните название и время");
      return;
    }
    if (taskType === "days" && selectedDays.length === 0) {
      alert("Выберите хотя бы один день недели");
      return;
    }
    if (taskType === "date" && !selectedDate) {
      alert("Выберите дату");
      return;
    }
    const color = IMPORTANCE_COLORS[importanceIndex].color;
    const newTask = {
      id: Date.now(),
      title,
      description,
      time,
      color,
      days: taskType === "days" ? selectedDays : [],
      date: taskType === "date" ? selectedDate : null,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    if (auth.currentUser) {
      set(ref(db, `tasks/${auth.currentUser.uid}`), { tasks: updatedTasks });
    }
    setTitle("");
    setDescription("");
    setTime("");
    setSelectedDays([]);
    setSelectedDate("");
    setImportanceIndex(0);
  };

  const deleteTask = (id) => {
    if (!isOnline) {
      alert("Удаление задач доступно только при подключении к интернету. Оффлайн удалить нельзя.");
      return;
    }
    if (!auth.currentUser) {
      alert("Удаление возможно только при авторизации");
      return;
    }
    const updatedTasks = tasks.filter((task) => task.id !== id);
    // Сначала отправляем запрос на удаление в бэкенд
    set(ref(db, `tasks/${auth.currentUser.uid}`), { tasks: updatedTasks })
      .then(() => {
        // Только после успешного удаления обновляем локальный стейт и localStorage
        setTasks(updatedTasks);
        localStorage.setItem("tasks", JSON.stringify(updatedTasks));
      })
      .catch((error) => {
        alert("Ошибка при удалении задачи: " + error.message);
      });
  };

  const weekDates = getWeekDates(currentWeekStart);
  const getTasksForDay = (dayAbbr, dateObj) => {
    const dateISO = formatISODate(dateObj);
    return tasks
      .filter(
        (task) =>
          (task.days.includes(dayAbbr) && !task.date) || task.date === dateISO
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const prevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const nextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const today = new Date();
  const todayStr = formatDate(today);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      alert("Ошибка выхода: " + error.message);
    }
  };

  return (
    <div className="schedule-container">
      <div className="header-row">
        <h1 className="schedule-title">Расписание</h1>
        <button onClick={handleLogout} className="btn-logout">Выйти</button>
      </div>

      <div className="input-group">
        <input
          type="text"
          placeholder="Название задачи"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="input-field"
        />
        <textarea
          placeholder="Описание задачи"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field"
          rows={2}
        />

        <div className="task-type-selector">
          <label>
            <input
              type="radio"
              checked={taskType === "days"}
              onChange={() => setTaskType("days")}
            /> По дням недели
          </label>
          <label>
            <input
              type="radio"
              checked={taskType === "date"}
              onChange={() => setTaskType("date")}
            /> По точной дате
          </label>
        </div>

        {taskType === "days" ? (
          <div className="days-selector">
            {WEEK_DAYS.map((day) => (
              <label key={day} className="day-checkbox">
                <input
                  type="checkbox"
                  checked={selectedDays.includes(day)}
                  onChange={() =>
                    setSelectedDays((prev) =>
                      prev.includes(day)
                        ? prev.filter((d) => d !== day)
                        : [...prev, day]
                    )
                  }
                />
                {day}
              </label>
            ))}
          </div>
        ) : (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field"
            style={{ maxWidth: "200px" }}
          />
        )}

        <div className="importance-selector">
          {IMPORTANCE_COLORS.map(({ name, color }, i) => (
            <button
              key={color}
              style={{ backgroundColor: color }}
              className={`color-circle ${importanceIndex === i ? "selected" : ""}`}
              onClick={() => setImportanceIndex(i)}
              title={name}
            />
          ))}
        </div>

        <button onClick={addTask} className="btn-add">Добавить задачу</button>
      </div>

      <div className="week-navigation">
        <button onClick={prevWeek} className="btn-nav">← Предыдущая неделя</button>
        <button onClick={nextWeek} className="btn-nav">Следующая неделя →</button>
      </div>

      <div className="week-calendar">
        {WEEK_DAYS.map((dayAbbr, idx) => {
          const date = weekDates[idx];
          const dateStr = formatDate(date);
          const isToday = dateStr === todayStr;
          const dayTasks = getTasksForDay(dayAbbr, date);

          return (
            <div
              key={dayAbbr}
              className={`day-column ${isToday ? "today" : ""}`}
              onClick={() => navigate(`/day/${formatISODate(date)}`)}
            >
              <div className="day-header">
                {dayAbbr} <br />
                <span className="date-number">{dateStr}</span>
              </div>
              <div className="tasks-list">
                {dayTasks.length === 0 ? (
                  <div className="no-tasks">Нет задач</div>
                ) : (
                  dayTasks.slice(0, 3).map(({ id, title, time, color }) => (
                    <div
                      key={id}
                      className="task-item"
                      style={{ borderLeftColor: color, boxShadow: `0 0 8px ${color}33` }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="task-info">
                        <div className="task-time">{time}</div>
                        <div className="task-title">{title}</div>
                      </div>
                      <button
                        className="btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(id);
                        }}
                        disabled={!isOnline}
                        title={isOnline ? "Удалить задачу" : "Удаление недоступно офлайн"}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
                {dayTasks.length > 3 && (
                  <div className="more-tasks">+{dayTasks.length - 3} еще</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
