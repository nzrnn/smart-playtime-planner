import { useState, useEffect } from "react";
import "./App.css";

const initialChildren = [];
const activities = [];

const emojiOptions = [
  "📚", "✏️", "📝", "🎓", "💻", "🔬",
  "⚽", "🏀", "🚴", "🏃", "🎨", "🧶",
  "🎹", "🎸", "💃", "🧩", "🌳", "🐈",
  "🍎", "🧁", "🌙", "📖", "🛁", "🪴",
  "🧸", "🧹", "🍳", "🎮", "🧘", "🎭",
];

function formatTime(value) {
  if (!value) return "";

  const parts = value.split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, "0");

  return displayHour + ":" + displayMinutes + " " + period;
}

function timeToMinutes(time) {
  if (!time) return null;

  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour * 60 + minute;
}

function sortedActivities(list) {
  return [...list].sort(
    (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)
  );
}

// Automatically calculate the activity status using the current time.
function getActivityStatus(activity, currentMinutes) {
  // Only the parent can mark an activity as Completed.
  if (activity.status === "Completed") {
    return "Completed";
  }

  const start = timeToMinutes(activity.time);
  const end = timeToMinutes(activity.endTime);

  if (start === null || end === null) {
    return "Not Started";
  }

  if (currentMinutes < start) {
    return "Not Started";
  }

  if (currentMinutes < end) {
    return "In Progress";
  }

  return "Missed";
}

function App() {
  // Parent account details for the college-project demo
  const [accounts, setAccounts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("smartPlaytimeAccounts")) || [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("smartPlaytimeCurrentUser"));
    } catch {
      return null;
    }
  });

  const [authPage, setAuthPage] = useState("login");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  function handleSignup() {
    const name = parentName.trim();
    const email = parentEmail.trim().toLowerCase();
    const password = parentPassword;

    if (!name || !email || !password) {
      setAuthMessage("Please fill in all the fields.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setAuthMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setAuthMessage("Password must contain at least 6 characters.");
      return;
    }

    if (accounts.some((account) => account.email === email)) {
      setAuthMessage("An account with this email already exists.");
      return;
    }

    const newAccount = {
      id: Date.now(),
      name,
      email,
      password,
    };

    const updatedAccounts = [...accounts, newAccount];

    localStorage.setItem(
      "smartPlaytimeAccounts",
      JSON.stringify(updatedAccounts)
    );

    localStorage.setItem(
      "smartPlaytimeCurrentUser",
      JSON.stringify(newAccount)
    );

    setAccounts(updatedAccounts);
    setCurrentUser(newAccount);
    setAuthMessage("");
  }

  function handleLogin() {
    const email = parentEmail.trim().toLowerCase();

    const account = accounts.find(
      (item) =>
        item.email === email &&
        item.password === parentPassword
    );

    if (!account) {
      setAuthMessage("Incorrect email or password.");
      return;
    }

    localStorage.setItem(
      "smartPlaytimeCurrentUser",
      JSON.stringify(account)
    );

    setCurrentUser(account);
    setAuthMessage("");
  }

  function handleLogout() {
    localStorage.removeItem("smartPlaytimeCurrentUser");
    setCurrentUser(null);
    setParentName("");
    setParentEmail("");
    setParentPassword("");
    setAuthPage("login");
    setAuthMessage("");
  }

  const [children, setChildren] = useState(() => {
    try {
      const saved = localStorage.getItem("smartPlaytimeChildren");
      return saved ? JSON.parse(saved) : initialChildren;
    } catch {
      return initialChildren;
    }
  });

  const [selectedChild, setSelectedChild] = useState(() => {
    return Number(localStorage.getItem("smartPlaytimeSelectedChild")) || 1;
  });

  const [minutes, setMinutes] = useState(() => {
    return Number(localStorage.getItem("smartPlaytimeMinutes")) || 1;
  });

  const [customActivities, setCustomActivities] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("smartPlaytimeCustomActivities")
      );

      if (!Array.isArray(saved)) return [];

      const previousSelectedChild =
        Number(localStorage.getItem("smartPlaytimeSelectedChild")) || 1;

      return saved.map((activity) =>
        activity.childId == null
          ? { ...activity, childId: previousSelectedChild }
          : activity
      );
    } catch {
      return [];
    }
  });

  const [activityName, setActivityName] = useState("");
  const [activityTime, setActivityTime] = useState("10:00");
  const [activityEndTime, setActivityEndTime] = useState("11:00");
  const [activityType, setActivityType] = useState("Study");
  const [activityEmoji, setActivityEmoji] = useState("📚");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [page, setPage] = useState("Dashboard");

  const [secondsLeft, setSecondsLeft] = useState(() => {
    return (
      (Number(localStorage.getItem("smartPlaytimeMinutes")) || 1) * 60
    );
  });

  const [running, setRunning] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("7");
  const [message, setMessage] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return (
      "Notification" in window &&
      Notification.permission === "granted"
    );
  });

  // Keep the displayed activity statuses updated while the website is open.
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };

    updateCurrentTime();

    const clockTimer = setInterval(updateCurrentTime, 15000);

    return () => clearInterval(clockTimer);
  }, []);

  const child =
    children.find((c) => c.id === selectedChild) || children[0];

  const childActivities = customActivities.filter(
    (activity) => activity.childId === selectedChild
  );

  const allActivities = [...activities, ...childActivities];

  useEffect(() => {
    localStorage.setItem(
      "smartPlaytimeChildren",
      JSON.stringify(children)
    );
  }, [children]);

  useEffect(() => {
    if (selectedChild !== null) {
      localStorage.setItem(
        "smartPlaytimeSelectedChild",
        String(selectedChild)
      );
    }
  }, [selectedChild]);

  useEffect(() => {
    localStorage.setItem("smartPlaytimeMinutes", String(minutes));
  }, [minutes]);

  useEffect(() => {
    localStorage.setItem(
      "smartPlaytimeCustomActivities",
      JSON.stringify(customActivities)
    );
  }, [customActivities]);

  useEffect(() => {
    if (
      children.length > 0 &&
      !children.some((c) => c.id === selectedChild)
    ) {
      setSelectedChild(children[0].id);
    }
  }, [children, selectedChild]);

  const progress = Math.max(
    0,
    Math.min(100, (secondsLeft / (minutes * 60 || 1)) * 100)
  );

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setSecondsLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [running]);

  // Activity start and end notifications
  useEffect(() => {
    if (!notificationsEnabled) return;

    function checkActivityTimes() {
      if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      const today =
        now.getFullYear() +
        "-" +
        (now.getMonth() + 1) +
        "-" +
        now.getDate();

      let sent = {};

      try {
        sent =
          JSON.parse(
            localStorage.getItem("smartPlaytimeSentReminders")
          ) || {};
      } catch {
        sent = {};
      }

      sent = Object.fromEntries(
        Object.entries(sent).filter(([key]) =>
          key.startsWith(today + "-")
        )
      );

      for (const activity of customActivities) {
        if (!activity.childId || !activity.time || !activity.endTime) {
          continue;
        }

        const start = timeToMinutes(activity.time);
        const end = timeToMinutes(activity.endTime);

        if (start === null || end === null || end <= start) continue;

        const activityChild = children.find(
          (c) => c.id === activity.childId
        );

        const childName = activityChild?.name || "Your child";

        const reminderBase =
          today + "-" + activity.childId + "-" + activity.id;

        const startKey = reminderBase + "-start";
        const endKey = reminderBase + "-end";

        if (
          nowMinutes >= start &&
          nowMinutes < end &&
          !sent[startKey]
        ) {
          new Notification("🔔 Time for " + activity.name + "!", {
            body:
              childName +
              ", it's time to start " +
              activity.name.toLowerCase() +
              "! " +
              (activity.emoji || "✨"),
          });

          sent[startKey] = true;
        }

        if (nowMinutes >= end && !sent[endKey]) {
          new Notification(activity.name + " is over! ⏰", {
            body:
              "Well done, " +
              childName +
              "! Your " +
              activity.name.toLowerCase() +
              " time is finished. Time for the next activity! 🌷",
          });

          sent[endKey] = true;
        }
      }

      localStorage.setItem(
        "smartPlaytimeSentReminders",
        JSON.stringify(sent)
      );
    }

    checkActivityTimes();

    const reminderTimer = setInterval(checkActivityTimes, 10000);

    return () => clearInterval(reminderTimer);
  }, [notificationsEnabled, customActivities, children]);

  // Screen-time completion notification and sound
  useEffect(() => {
    if (!running || secondsLeft !== 0) return;

    setRunning(false);
    setMessage("⏰ Screen time is over! Time for a little break.");

    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification("Smart Playtime Planner", {
        body:
          (child?.name || "Your child") +
          "'s screen time is over! 🌷",
      });
    }

    if (soundEnabled) {
      try {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;

        if (AudioContextClass) {
          const audio = new AudioContextClass();
          const oscillator = audio.createOscillator();
          const gain = audio.createGain();

          oscillator.connect(gain);
          gain.connect(audio.destination);
          oscillator.type = "sine";
          oscillator.frequency.value = 880;
          gain.gain.value = 0.25;
          oscillator.start();

          setTimeout(() => {
            oscillator.stop();
            audio.close();
          }, 1500);
        }
      } catch (error) {
        console.log("Sound alert unavailable", error);
      }
    }
  }, [secondsLeft, running, child, soundEnabled]);

  function startTimer() {
    if (secondsLeft <= 0) {
      setSecondsLeft(minutes * 60);
    }

    setRunning(true);
    setMessage("Screen-time session started!");
  }

  function chooseLimit(value) {
    setRunning(false);
    setMinutes(value);
    setSecondsLeft(value * 60);

    setMessage(
      "Screen-time limit set to " +
        value +
        " minute" +
        (value === 1 ? "" : "s") +
        "."
    );
  }

  function resetTimer() {
    setRunning(false);
    setSecondsLeft(minutes * 60);
    setMessage("Timer reset.");
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setMessage("Your browser does not support notifications.");
      return;
    }

    const permission = await Notification.requestPermission();

    setNotificationsEnabled(permission === "granted");

    setMessage(
      permission === "granted"
        ? "Browser notifications enabled! Activity reminders are ready. 🔔"
        : "Notifications were not enabled. Please allow them in your browser settings."
    );
  }

  function addChild(event) {
    event.preventDefault();

    if (!newName.trim()) return;

    const id = Date.now();

    const newChild = {
      id,
      name: newName.trim(),
      age: Number(newAge) || 7,
      emoji: "🧒",
      color: "lavender",
    };

    setChildren((previous) => [...previous, newChild]);
    setSelectedChild(id);
    setNewName("");
    setNewAge("7");
    setMessage("Child profile added successfully!");
  }

  function removeChild(id) {
    const next = children.filter((c) => c.id !== id);

    setChildren(next);

    setCustomActivities((previous) =>
      previous.filter((activity) => activity.childId !== id)
    );

    if (selectedChild === id) {
      setSelectedChild(next.length > 0 ? next[0].id : null);
    }

    setMessage(
      next.length === 0
        ? "All profiles removed. Add your child's profile whenever you're ready! 💜"
        : "Child profile removed."
    );
  }

  function addActivity(event) {
    event.preventDefault();

    if (!child) {
      setMessage("Please create a child profile before adding activities.");
      return;
    }

    if (!activityName.trim()) {
      setMessage("Please enter an activity name.");
      return;
    }

    const start = timeToMinutes(formatTime(activityTime));
    const end = timeToMinutes(formatTime(activityEndTime));

    if (start === null || end === null || end <= start) {
      setMessage("Please choose an end time later than the start time.");
      return;
    }

    const newActivity = {
      id: Date.now(),
      childId: selectedChild,
      name: activityName.trim(),
      time: formatTime(activityTime),
      endTime: formatTime(activityEndTime),
      emoji: activityEmoji,
      type: activityType,
      status: "Not Started",
    };

    setCustomActivities((previous) => [...previous, newActivity]);

    setActivityName("");
    setActivityTime("10:00");
    setActivityEndTime("11:00");
    setActivityType("Study");
    setActivityEmoji("📚");
    setShowEmojiPicker(false);

    setMessage("Activity added to " + child.name + "'s planner! 💜");
  }

  function deleteActivity(id) {
    setCustomActivities((previous) =>
      previous.filter(
        (activity) =>
          !(activity.id === id && activity.childId === selectedChild)
      )
    );

    setMessage(
      "Activity removed from " +
        (child?.name || "child") +
        "'s planner."
    );
  }

  // Only the parent can confirm completion.
  function markActivityCompleted(activity) {
    if (!activity.id) return;

    const updatedActivities = customActivities.map((item) =>
      item.id === activity.id && item.childId === selectedChild
        ? { ...item, status: "Completed" }
        : item
    );

    setCustomActivities(updatedActivities);

    localStorage.setItem(
      "smartPlaytimeCustomActivities",
      JSON.stringify(updatedActivities)
    );

    setMessage(activity.name + " marked as completed! 🎉");
  }

  const navItems = [
    { name: "Dashboard", icon: "⌂" },
    { name: "Child Profiles", icon: "♡" },
    { name: "Daily Planner", icon: "▦" },
    { name: "Screen Time", icon: "◷" },
    { name: "Activity History", icon: "↻" },
    { name: "Reports", icon: "▥" },
    { name: "Settings", icon: "⚙️" },
  ];

  if (!currentUser) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-logo">☁️</div>
            <h1>Smart Playtime Planner</h1>
            <p>A happier balance for your family 💜</p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={authPage === "login" ? "auth-tab active" : "auth-tab"}
              onClick={() => {
                setAuthPage("login");
                setAuthMessage("");
              }}
            >
              Log In
            </button>

            <button
              type="button"
              className={authPage === "signup" ? "auth-tab active" : "auth-tab"}
              onClick={() => {
                setAuthPage("signup");
                setAuthMessage("");
              }}
            >
              Sign Up
            </button>
          </div>

          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();

              if (authPage === "signup") {
                handleSignup();
              } else {
                handleLogin();
              }
            }}
          >
            {authPage === "signup" && (
              <div className="auth-field">
                <label>Parent's Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={parentName}
                  onChange={(event) => setParentName(event.target.value)}
                  required
                />
              </div>
            )}

            <div className="auth-field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={parentEmail}
                onChange={(event) => setParentEmail(event.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={parentPassword}
                onChange={(event) => setParentPassword(event.target.value)}
                minLength={6}
                required
              />
            </div>

            {authMessage && (
              <p className="auth-error">{authMessage}</p>
            )}

            <button type="submit" className="auth-submit">
              {authPage === "signup" ? "Create Account ✨" : "Log In 💜"}
            </button>
          </form>

          <p className="auth-footer">
            {authPage === "signup"
              ? "Create your family account to get started."
              : "Welcome back! Your family's happy place awaits."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">🌈</div>
          <div>
            <h2>Smart Playtime</h2>
            <span>little steps, big dreams</span>
          </div>
        </div>

        <div className="nav-label">MENU</div>

        <nav>
          {navItems.map((item) => (
            <button
              key={item.name}
              className={"nav-item " + (page === item.name ? "active" : "")}
              onClick={() => {
                setPage(item.name);
                setMessage("");
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
              {item.name === "Screen Time" && (
                <span className="nav-dot" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-illustration">🌷</div>
          <p>Every little moment matters.</p>
          <span>Made with love for growing minds ♡</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">YOUR FAMILY'S HAPPY PLACE</div>
            <h1>
              {page === "Dashboard" ? "Hello, super parent! ☀️" : page}
            </h1>
            <p className="subtitle">
              {page === "Dashboard"
                ? "Let's make today a little more wonderful."
                : "Manage your family's " + page.toLowerCase() + " here."}
            </p>
          </div>

          <div className="profile-chip">
            <div className="parent-avatar">♡</div>
            <div>
              <strong>{currentUser?.name || "Parent"}</strong>
              <span>Family account</span>
            </div>
            <span className="chevron">⌄</span>
          </div>
        </header>

        {message && <div className="message-banner">✨ {message}</div>}

        {page === "Dashboard" && (
          <>
            <section className="welcome-banner">
              <div className="welcome-copy">
                <span className="welcome-pill">✦ YOUR FAMILY SPACE</span>
                <h2>
                  Little moments,
                  <br />
                  wonderful memories.
                </h2>
                <p>A happy balance of play, learning and rest starts here.</p>
                <button
                  className="primary-button"
                  onClick={() => setPage("Daily Planner")}
                >
                  Explore today's plan <span>→</span>
                </button>
              </div>

              <div className="welcome-art">
                <div className="sun">☀️</div>
                <div className="rainbow">🌈</div>
                <div className="cloud cloud-one">☁️</div>
                <div className="cloud cloud-two">☁️</div>
                <div className="welcome-flower">🌼</div>
              </div>

              <span className="sparkle sparkle-one">✦</span>
              <span className="sparkle sparkle-two">✧</span>
            </section>

            <div className="section-heading">
              <div>
                <h2>Your little stars ✨</h2>
                <p>Every child grows in their own beautiful way.</p>
              </div>
              <button
                className="text-button"
                onClick={() => setPage("Child Profiles")}
              >
                View all →
              </button>
            </div>

            <section className="children-grid">
              {children.slice(0, 3).map((c) => (
                <button
                  className={
                    "child-card " +
                    (selectedChild === c.id ? "selected" : "")
                  }
                  key={c.id}
                  onClick={() => {
                    setSelectedChild(c.id);
                    setMessage(c.name + "'s dashboard selected.");
                  }}
                >
                  <span className={"child-avatar " + c.color}>{c.emoji}</span>
                  <span className="child-info">
                    <strong>{c.name}</strong>
                    <small>{c.age} years old</small>
                  </span>
                  <span className="card-arrow">↗</span>
                  <span className="child-card-foot">♡ Growing happily</span>
                </button>
              ))}

              <button
                className="add-child-card"
                onClick={() => setPage("Child Profiles")}
              >
                <span className="add-circle">+</span>
                <strong>Add a little star</strong>
                <small>Create a new profile</small>
              </button>
            </section>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon lilac">◷</span>
                <div>
                  <span className="stat-label">Screen time limit</span>
                  <strong>
                    {minutes} minute{minutes === 1 ? "" : "s"}
                  </strong>
                  <small>Selected timer limit</small>
                </div>
                <span className="stat-decoration">✧</span>
              </div>

              <div className="stat-card">
                <span className="stat-icon mint">✓</span>
                <div>
                  <span className="stat-label">Activities planned</span>
                  <strong>{allActivities.length} activities</strong>
                  <small>For {child?.name || "your child"}</small>
                </div>
                <span className="stat-decoration">✧</span>
              </div>

              <div className="stat-card">
                <span className="stat-icon peach-icon">♡</span>
                <div>
                  <span className="stat-label">Completed activities</span>
                  <strong>
                    {
                      allActivities.filter(
                        (a) =>
                          getActivityStatus(a, currentMinutes) === "Completed"
                      ).length
                    }
                  </strong>
                  <small>Little wins today</small>
                </div>
                <span className="stat-decoration">✧</span>
              </div>
            </div>

            <section className="bottom-grid">
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Today's little plans 📅</h2>
                    <p>A day filled with possibilities.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setPage("Daily Planner")}
                  >
                    See all →
                  </button>
                </div>

                <div className="activity-list">
                  {sortedActivities(allActivities)
                    .slice(0, 3)
                    .map((a) => (
                      <div className="activity-row" key={a.id || a.name}>
                        <span className="activity-emoji">{a.emoji}</span>
                        <div className="activity-info">
                          <strong>{a.name}</strong>
                          <small>
                            {getActivityStatus(a, currentMinutes)}
                          </small>
                        </div>
                        <span className="activity-time">{a.time}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="panel timer-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Screen-time buddy ⏰</h2>
                    <p>A healthy little balance.</p>
                  </div>
                  <span>♡</span>
                </div>

                <div className="mini-timer">
                  <span>◷</span>
                  <strong>
                    {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:
                    {String(secondsLeft % 60).padStart(2, "0")}
                  </strong>
                  <small>minutes : seconds</small>
                </div>

                <button
                  className="primary-button full-button"
                  onClick={() => setPage("Screen Time")}
                >
                  Open screen timer →
                </button>
              </div>
            </section>
          </>
        )}

        {page === "Child Profiles" && (
          <section className="page-panel">
            <div className="panel-heading">
              <div>
                <h2>Your little stars ♡</h2>
                <p>Create and manage child profiles.</p>
              </div>
              <span className="soft-tag">{children.length} profiles</span>
            </div>

            <div className="children-grid profile-grid">
              {children.map((c) => (
                <div
                  className={
                    "child-card profile-card " +
                    (selectedChild === c.id ? "selected" : "")
                  }
                  key={c.id}
                >
                  <span className={"child-avatar " + c.color}>{c.emoji}</span>
                  <span className="child-info">
                    <strong>{c.name}</strong>
                    <small>{c.age} years old</small>
                  </span>
                  <button
                    className="small-select"
                    onClick={() => {
                      setSelectedChild(c.id);
                      setMessage(c.name + " selected.");
                    }}
                  >
                    Select
                  </button>
                  <span className="child-card-foot">
                    ♡ Screen-time & activities
                  </span>
                  <button
                    className="remove-button"
                    onClick={() => removeChild(c.id)}
                  >
                    Remove profile
                  </button>
                </div>
              ))}
            </div>

            <form className="add-form" onSubmit={addChild}>
              <h3>＋ Add a new little star</h3>
              <label>
                Child's name
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter a name"
                  required
                />
              </label>
              <label>
                Age
                <input
                  type="number"
                  min="1"
                  max="17"
                  value={newAge}
                  onChange={(e) => setNewAge(e.target.value)}
                  required
                />
              </label>
              <button className="primary-button" type="submit">
                Create profile ♡
              </button>
            </form>
          </section>
        )}

        {page === "Daily Planner" && (
          <section className="page-panel">
            <div className="panel-heading">
              <div>
                <h2>Today's little plans 📅</h2>
                <p>Make space for learning, play and rest.</p>
              </div>
              <span className="soft-tag">{child?.name || "Child"}</span>
            </div>

            <div className="status-legend">
              <span className="activity-status status-not-started">
                Not Started
              </span>
              <span className="activity-status status-in-progress">
                In Progress
              </span>
              <span className="activity-status status-completed">
                Completed
              </span>
              <span className="activity-status status-missed">Missed</span>
            </div>

            {sortedActivities(allActivities).length === 0 ? (
              <p>No activities yet. Add one below! ✨</p>
            ) : (
              sortedActivities(allActivities).map((a) => {
                const status = getActivityStatus(a, currentMinutes);

                return (
                  <div className="planner-row" key={a.id || a.name}>
                    <span className="planner-time">{a.time}</span>
                    <span className="activity-emoji">{a.emoji}</span>

                    <div className="activity-info">
                      <strong>{a.name}</strong>
                      <small>
                        {a.type} · {child?.name || "Child"}
                        {a.endTime ? " · Until " + a.endTime : ""}
                      </small>
                    </div>

                    <div className="activity-actions">
                      <span className={"type-pill type-" + a.type.toLowerCase()}>
                        {a.type}
                      </span>

                      <span
                        className={
                          "activity-status status-" +
                          status.toLowerCase().replace(" ", "-")
                        }
                      >
                        {status}
                      </span>

                      {status !== "Completed" && a.id && (
                        <button
                          type="button"
                          className="complete-activity-button"
                          onClick={() => markActivityCompleted(a)}
                        >
                          Mark as Completed ✓
                        </button>
                      )}

                      {a.id && (
                        <button
                          className="remove-button"
                          type="button"
                          onClick={() => deleteActivity(a.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            <form className="add-form" onSubmit={addActivity}>
              <h3>＋ Add a little activity</h3>

              <label>
                Activity name
                <input
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  placeholder="e.g. Drawing time"
                  required
                />
              </label>

              <label>
                Start time
                <input
                  type="time"
                  value={activityTime}
                  onChange={(e) => setActivityTime(e.target.value)}
                  required
                />
              </label>

              <label>
                End time
                <input
                  type="time"
                  value={activityEndTime}
                  onChange={(e) => setActivityEndTime(e.target.value)}
                  required
                />
              </label>

              <label>
                Category
                <select
                  value={activityType}
                  onChange={(e) => {
                    setActivityType(e.target.value);

                    const categoryEmojis = {
                      Study: "📚",
                      Play: "⚽",
                      Hobby: "🎨",
                      Relax: "🌙",
                    };

                    setActivityEmoji(categoryEmojis[e.target.value]);
                  }}
                >
                  <option value="Study">Study</option>
                  <option value="Play">Play</option>
                  <option value="Hobby">Hobby</option>
                  <option value="Relax">Relax</option>
                </select>
              </label>

              <label>Activity emoji</label>

              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowEmojiPicker((previous) => !previous)}
                aria-expanded={showEmojiPicker}
              >
                {showEmojiPicker
                  ? "Hide emoji options ↑"
                  : "Choose emoji " + activityEmoji + " ↓"}
              </button>

              {showEmojiPicker && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                    gap: "8px",
                    margin: "12px 0 18px",
                  }}
                >
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={"Choose " + emoji}
                      aria-pressed={activityEmoji === emoji}
                      onClick={() => {
                        setActivityEmoji(emoji);
                        setShowEmojiPicker(false);
                      }}
                      style={{
                        padding: "10px 4px",
                        borderRadius: "12px",
                        border:
                          activityEmoji === emoji
                            ? "2px solid #9673CE"
                            : "1px solid #e5dcef",
                        background:
                          activityEmoji === emoji ? "#EDE3FC" : "#fff",
                        fontSize: "23px",
                        cursor: "pointer",
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <p className="hint-text">
                Selected emoji: <strong>{activityEmoji}</strong>
              </p>

              <button className="primary-button" type="submit">
                Add activity ♡
              </button>
            </form>

            <div className="note-card">
              🔔
              <span>
                <strong>Activity reminders</strong>
                <br />
                Enable browser notifications in Screen Time to receive a
                reminder when an activity starts and when it ends.
              </span>
            </div>
          </section>
        )}

        {page === "Screen Time" && (
          <section className="page-panel screen-page">
            <div className="panel-heading">
              <div>
                <h2>A little screen-time balance ⏰</h2>
                <p>Give every minute a mindful purpose.</p>
              </div>
              <span className="soft-tag">{child?.name || "Child"}</span>
            </div>

            <div className="timer-layout">
              <div
                className="timer-circle"
                style={{ "--progress": progress + "%" }}
              >
                <div className="timer-inner">
                  <span>TIME REMAINING</span>
                  <strong>
                    {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:
                    {String(secondsLeft % 60).padStart(2, "0")}
                  </strong>
                  <small>minutes : seconds</small>
                </div>
              </div>

              <div className="timer-controls">
                <label>Choose screen-time limit</label>

                <div className="limit-options">
                  {[1, 5, 15, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      className={
                        "limit-button " + (minutes === m ? "chosen" : "")
                      }
                      onClick={() => chooseLimit(m)}
                    >
                      {m} min
                    </button>
                  ))}
                </div>

                <p className="hint-text">
                  Selected child: <strong>{child?.name || "Child"}</strong>
                </p>

                <div className="timer-buttons">
                  <button
                    className="primary-button"
                    onClick={startTimer}
                    disabled={running}
                  >
                    {running ? "Timer running…" : "▶ Start timer"}
                  </button>

                  <button
                    className="secondary-button"
                    onClick={() => {
                      setRunning(false);
                      setMessage("Timer paused.");
                    }}
                    disabled={!running}
                  >
                    Ⅱ Pause
                  </button>

                  <button
                    className="secondary-button"
                    onClick={resetTimer}
                  >
                    ↻ Reset
                  </button>
                </div>

                <label className="sound-toggle">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                  />
                  Enable sound alert
                </label>

                <button
                  className="secondary-button"
                  onClick={enableNotifications}
                >
                  🔔{" "}
                  {notificationsEnabled
                    ? "Browser notifications enabled"
                    : "Enable browser notifications"}
                </button>

                <div className="note-card">
                  🌷
                  <span>
                    <strong>A gentle reminder</strong>
                    <br />
                    Activity notifications are checked while this website
                    remains open. Browser permission is required.
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {page === "Activity History" && (
          <section className="page-panel">
            <div className="panel-heading">
              <div>
                <h2>Little moments remembered ♡</h2>
                <p>Activities for {child?.name || "your child"}.</p>
              </div>
            </div>

            {sortedActivities(allActivities).length === 0 ? (
              <p>No activities yet. Add one in the Daily Planner! ✨</p>
            ) : (
              sortedActivities(allActivities).map((a) => {
                const status = getActivityStatus(a, currentMinutes);

                return (
                  <div className="planner-row" key={a.id || a.name}>
                    <span className="activity-emoji">{a.emoji}</span>

                    <div className="activity-info">
                      <strong>{a.name}</strong>
                      <small>
                        {a.type} · Today, {a.time}
                        {a.endTime ? " – " + a.endTime : ""}
                      </small>
                    </div>

                    <div className="activity-actions">
                      <span
                        className={
                          "activity-status status-" +
                          status.toLowerCase().replace(" ", "-")
                        }
                      >
                        {status}
                      </span>

                      {status !== "Completed" && a.id && (
                        <button
                          type="button"
                          className="complete-activity-button"
                          onClick={() => markActivityCompleted(a)}
                        >
                          Mark as Completed ✓
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}

        {page === "Reports" && (
          <section className="page-panel">
            <div className="panel-heading">
              <div>
                <h2>Little wins add up 📊</h2>
                <p>An overview for {child?.name || "your child"}.</p>
              </div>
              <span className="soft-tag">Overview</span>
            </div>

            <div className="report-stats">
              <div>
                <span>Planned activities</span>
                <strong>{allActivities.length}</strong>
                <small>For this child</small>
              </div>

              <div>
                <span>Completed activities</span>
                <strong>
                  {
                    allActivities.filter(
                      (a) =>
                        getActivityStatus(a, currentMinutes) === "Completed"
                    ).length
                  }
                </strong>
                <small>Confirmed by parent</small>
              </div>

              <div>
                <span>Missed activities</span>
                <strong>
                  {
                    allActivities.filter(
                      (a) =>
                        getActivityStatus(a, currentMinutes) === "Missed"
                    ).length
                  }
                </strong>
                <small>End time has passed</small>
              </div>

              <div>
                <span>Screen-time limit</span>
                <strong>{minutes} min</strong>
                <small>Current timer setting</small>
              </div>

              <div>
                <span>Profile age</span>
                <strong>{child?.age ?? "—"} years</strong>
                <small>{child?.name || "No child selected"}</small>
              </div>
            </div>

            <div className="report-note">
              ✨ Activity totals include this child's custom activities.
            </div>
          </section>
        )}

        {page === "Settings" && (
          <section className="settings-page">
            <div className="section-heading">
              <div>
                <h2>Parent Settings ⚙️</h2>
                <p>Manage your family account.</p>
              </div>
            </div>

            <div className="settings-card">
              <div className="parent-avatar">♡</div>

              <h3>Parent Details</h3>

              <div className="settings-detail">
                <span>Parent's Name</span>
                <strong>{currentUser?.name || "Parent"}</strong>
              </div>

              <div className="settings-detail">
                <span>Email Address</span>
                <strong>{currentUser?.email || "Not available"}</strong>
              </div>

              <button
                className="settings-button"
                onClick={() => {
                  handleLogout();
                  setAuthPage("signup");
                }}
              >
                Create Another Account
              </button>

              <button
                className="settings-button settings-logout"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          </section>
        )}

        <footer className="footer">
          Made with ♡ for little hearts and big dreams
          <span>Smart Playtime Planner · Group 13</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
