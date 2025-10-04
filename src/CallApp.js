import React, { useState, useEffect, useRef } from "react";

const USERS = [
  { id: 1, name: "Alice", username: "alice", password: "123" },
  { id: 2, name: "Bob", username: "bob", password: "123" },
  { id: 3, name: "Charlie", username: "charlie", password: "123" },
  { id: 4, name: "David", username: "david", password: "123" },
];

const CALL_REQUEST_KEY = "call_requests";

export default function MultiBrowserCallApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [callStatus, setCallStatus] = useState(null);
  const [roomName, setRoomName] = useState("");
  const jitsiContainerRef = useRef(null);

  // Poll for incoming requests
  useEffect(() => {
    const interval = setInterval(() => {
      if (!currentUser) return;

      const allRequests =
        JSON.parse(localStorage.getItem(CALL_REQUEST_KEY)) || [];
      const now = Date.now();

      // Filter for requests to current user that are pending and not expired
      const pending = allRequests.filter(
        (r) =>
          r.to === currentUser.username &&
          r.status === "pending" &&
          now - r.timestamp < 180000 // 3 minutes
      );

      setIncomingRequests(pending);

      // Auto-reject expired requests
      const updatedRequests = allRequests.map((r) =>
        r.status === "pending" && now - r.timestamp >= 180000
          ? { ...r, status: "rejected" }
          : r
      );
      localStorage.setItem(CALL_REQUEST_KEY, JSON.stringify(updatedRequests));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Update call status for sender
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      const allRequests =
        JSON.parse(localStorage.getItem(CALL_REQUEST_KEY)) || [];
      const sent = allRequests.filter((r) => r.from === currentUser.username);

      sent.forEach((r) => {
        if (r.status === "accepted") {
          setCallStatus(`${r.to} accepted your call!`);
          setRoomName(`Room-${currentUser.username}-${r.to}`);
        } else if (r.status === "rejected") {
          setCallStatus(`${r.to} rejected your call.`);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLoginSubmit = () => {
    const user = USERS.find(
      (u) =>
        u.username === loginForm.username && u.password === loginForm.password
    );
    if (user) setCurrentUser(user);
    else alert("Invalid credentials");
  };

  const toggleUserSelect = (user) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u.username === user.username)
        ? prev.filter((u) => u.username !== user.username)
        : [...prev, user]
    );
  };

  const sendCallRequest = () => {
    if (selectedUsers.length === 0) return alert("Select at least one user.");
    const allRequests =
      JSON.parse(localStorage.getItem(CALL_REQUEST_KEY)) || [];
    const timestamp = Date.now();

    const newRequests = selectedUsers.map((u) => ({
      from: currentUser.username,
      to: u.username,
      timestamp,
      status: "pending",
    }));

    localStorage.setItem(
      CALL_REQUEST_KEY,
      JSON.stringify([...allRequests, ...newRequests])
    );
    alert("Call requests sent!");
  };

  const respondToCall = (request, response) => {
    const allRequests =
      JSON.parse(localStorage.getItem(CALL_REQUEST_KEY)) || [];
    const updated = allRequests.map((r) =>
      r.from === request.from &&
      r.to === request.to &&
      r.timestamp === request.timestamp
        ? { ...r, status: response }
        : r
    );
    localStorage.setItem(CALL_REQUEST_KEY, JSON.stringify(updated));
    setIncomingRequests((prev) =>
      prev.map((r) =>
        r.from === request.from &&
        r.to === request.to &&
        r.timestamp === request.timestamp
          ? { ...r, status: response }
          : r
      )
    );

    if (response === "accepted") {
      setRoomName(`Room-${request.from}-${currentUser.username}`);
    }
  };

  // Initialize Jitsi
  useEffect(() => {
    if (roomName && jitsiContainerRef.current && window.JitsiMeetExternalAPI) {
      new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName,
        parentNode: jitsiContainerRef.current,
        userInfo: { displayName: currentUser.name },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        },
      });
    }
  }, [roomName, currentUser]);

  return (
    <div style={{ padding: 20 }}>
      {!currentUser ? (
        <>
          <h2>Login</h2>
          <input
            placeholder="Username"
            value={loginForm.username}
            onChange={(e) =>
              setLoginForm({ ...loginForm, username: e.target.value })
            }
            style={{ marginRight: 5 }}
          />
          <input
            placeholder="Password"
            type="password"
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({ ...loginForm, password: e.target.value })
            }
            style={{ marginRight: 5 }}
          />
          <button onClick={handleLoginSubmit}>Login</button>
        </>
      ) : (
        <>
          <h3>Welcome, {currentUser.name} 👋</h3>
          <h4>Select users to call:</h4>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {USERS.filter((u) => u.username !== currentUser.username).map(
              (user) => (
                <button
                  key={user.username}
                  onClick={() => toggleUserSelect(user)}
                  style={{
                    padding: "8px 14px",
                    background: selectedUsers.find(
                      (u) => u.username === user.username
                    )
                      ? "#2196F3"
                      : "#4CAF50",
                    color: "#fff",
                    border: "none",
                    borderRadius: 5,
                    cursor: "pointer",
                  }}
                >
                  {user.name} 🟢
                </button>
              )
            )}
          </div>

          <button
            onClick={sendCallRequest}
            style={{
              marginTop: 20,
              padding: "10px 18px",
              background: "#673AB7",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
            }}
          >
            Send Call Request
          </button>

          {/* Incoming call requests */}
          {incomingRequests.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4>Incoming Call Requests (valid for 3 min):</h4>
              {incomingRequests.map((r, idx) => (
                <div key={idx}>
                  Call from {r.from} - Status: {r.status}
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => respondToCall(r, "accepted")}
                        style={{ marginLeft: 5 }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondToCall(r, "rejected")}
                        style={{ marginLeft: 5 }}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {callStatus && (
            <div style={{ marginTop: 20, color: "red" }}>{callStatus}</div>
          )}

          <div
            ref={jitsiContainerRef}
            style={{
              height: roomName ? "500px" : 0,
              width: "100%",
              marginTop: 20,
            }}
          ></div>
        </>
      )}
    </div>
  );
}
