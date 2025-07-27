import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ScheduleApp.css";

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


function ScheduleApp() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [taskType, setTaskType] = useState("days");
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [importanceIndex, setImportanceIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

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

    const color =
      taskType === "days"
        ? IMPORTANCE_COLORS[importanceIndex].color
        : "#000000";

    const newTask = {
      id: Date.now(),
      title,
      time,
      color,
      days: taskType === "days" ? selectedDays : [],
      date: taskType === "date" ? selectedDate : null,
    };

    setTasks([...tasks, newTask]);

    setTitle("");
    setTime("");
    setSelectedDays([]);
    setSelectedDate("");
    setImportanceIndex(0);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
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

  return (
    <div className="schedule-container">
      <h1 className="schedule-title">Расписание</h1>

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

        <div style={{ marginBottom: 10 }}>
          <label style={{ marginRight: 12 }}>
            <input
              type="radio"
              checked={taskType === "days"}
              onChange={() => setTaskType("days")}
            />{" "}
            По дням недели
          </label>
          <label>
            <input
              type="radio"
              checked={taskType === "date"}
              onChange={() => setTaskType("date")}
            />{" "}
            По точной дате
          </label>
        </div>

        {taskType === "days" ? (
          <>
            <div className="days-selector">
              {WEEK_DAYS.map((day) => (
                <label key={day} className="day-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day)}
                    onChange={() => toggleDay(day)}
                  />
                  {day}
                </label>
              ))}
            </div>

            <div
              className="importance-selector"
              title="Выберите уровень важности"
            >
              {IMPORTANCE_COLORS.map(({ name, color }, i) => (
                <button
                  key={color}
                  className={`color-circle ${
                    importanceIndex === i ? "selected" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setImportanceIndex(i)}
                  aria-label={name}
                  type="button"
                />
              ))}
            </div>
          </>
        ) : (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field"
            style={{ maxWidth: "200px" }}
            disabled={taskType !== "date"}
          />
        )}

        <button onClick={addTask} className="btn-add">
          Добавить задачу
        </button>
      </div>

      <div className="week-navigation">
        <button onClick={prevWeek} className="btn-nav">
          ← Предыдущая неделя
        </button>
        <button onClick={nextWeek} className="btn-nav">
          Следующая неделя →
        </button>
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
              style={{ cursor: "pointer" }}
            >
              <div className="day-header">
                {dayAbbr} <br />
                <span className="date-number">{dateStr}</span>
              </div>
              <div className="tasks-list">
                {dayTasks.length === 0 && <div className="no-tasks">Нет задач</div>}
                {dayTasks.map(({ id, title, time, color }) => (
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
                      onClick={() => deleteTask(id)}
                      aria-label="Удалить задачу"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ScheduleApp;
