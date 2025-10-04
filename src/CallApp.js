import React, { useState, useRef } from "react";

const USERS = [
  { id: 1, name: "Alice", online: true },
  { id: 2, name: "Bob", online: true },
  { id: 3, name: "Charlie", online: false },
  { id: 4, name: "David", online: true },
  { id: 5, name: "Eve", online: false },
];

export default function CallApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [roomName, setRoomName] = useState("");
  const jitsiContainerRef = useRef(null);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setSelectedUsers([]);
    setRoomName("");
  };

  const toggleUserSelect = (user) => {
    setSelectedUsers((prev) => {
      if (prev.find((u) => u.id === user.id)) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  //   const startCall = () => {
  //     if (!currentUser) return;

  //     // Check if any selected user is offline
  //     const offlineUsers = selectedUsers.filter((u) => !u.online);
  //     if (offlineUsers.length > 0) {
  //       alert(
  //         `The following users are offline: ${offlineUsers
  //           .map((u) => u.name)
  //           .join(", ")}. Can't start the call.`
  //       );
  //       return;
  //     }

  //     // Create a room name based on caller + selected users
  //     const participants = [currentUser, ...selectedUsers]
  //       .map((u) => u.name)
  //       .join("-");
  //     const room = `TestRoom-${participants}`;
  //     setRoomName(room);

  //     // Launch Jitsi iframe
  //     const domain = "meet.jit.si";
  //     const options = {
  //       roomName: room,
  //       parentNode: jitsiContainerRef.current,
  //       userInfo: {
  //         displayName: currentUser.name,
  //       },
  //       configOverwrite: {
  //         startWithVideoMuted: false,
  //         startWithAudioMuted: false,
  //       },
  //       interfaceConfigOverwrite: {
  //         TOOLBAR_BUTTONS: [
  //           "microphone",
  //           "camera",
  //           "hangup",
  //           "tileview",
  //           "fullscreen",
  //         ],
  //       },
  //     };

  //     if (!window.JitsiMeetExternalAPI) {
  //       alert(
  //         "Jitsi Meet API script not loaded. Please check your internet or script tag."
  //       );
  //       return;
  //     }

  //     const api = new window.JitsiMeetExternalAPI(domain, options);

  //     api.addListener("videoConferenceJoined", () => {
  //       console.log(`${currentUser.name} joined the room ${room}`);
  //     });
  //   };
  const startCall = () => {
    try {
      if (!currentUser) return;

      const offlineUsers = selectedUsers.filter((u) => !u.online);
      if (offlineUsers.length > 0) {
        alert(
          `The following users are offline: ${offlineUsers
            .map((u) => u.name)
            .join(", ")}`
        );
        return;
      }

      if (!window.JitsiMeetExternalAPI) {
        alert("Jitsi API not loaded yet!");
        return;
      }

      const participants = [currentUser, ...selectedUsers]
        .map((u) => u.name)
        .join("-");
      const room = `TestRoom-${participants}`;
      setRoomName(room);

      const domain = "meet.jit.si";
      const options = {
        roomName: room,
        parentNode: jitsiContainerRef.current,
        userInfo: { displayName: currentUser.name },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      api.addListener("videoConferenceJoined", () => {
        console.log(`${currentUser.name} joined the room ${room}`);
      });
    } catch (err) {
      console.error("Error starting call:", err);
      alert(
        "Something went wrong starting the call. Check console for details."
      );
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {!currentUser ? (
        <>
          <h2>Select Your User</h2>
          <div style={{ display: "flex", gap: 10 }}>
            {USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => handleLogin(user)}
                style={{
                  padding: "8px 14px",
                  background: user.online ? "#4CAF50" : "#aaa",
                  color: "#fff",
                  border: "none",
                  borderRadius: 5,
                  cursor: "pointer",
                }}
              >
                {user.name} {user.online ? "🟢" : "🔴"}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h3>Welcome, {currentUser.name} 👋</h3>
          <h4>Select users to call:</h4>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {USERS.filter((u) => u.id !== currentUser.id).map((user) => (
              <button
                key={user.id}
                onClick={() => toggleUserSelect(user)}
                style={{
                  padding: "8px 14px",
                  background: selectedUsers.find((u) => u.id === user.id)
                    ? "#2196F3"
                    : user.online
                    ? "#4CAF50"
                    : "#aaa",
                  color: "#fff",
                  border: "none",
                  borderRadius: 5,
                  cursor: "pointer",
                }}
              >
                {user.name} {user.online ? "🟢" : "🔴"}
              </button>
            ))}
          </div>

          <button
            onClick={startCall}
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
            Start Call
          </button>

          {roomName && (
            <div
              ref={jitsiContainerRef}
              style={{ height: "500px", width: "100%", marginTop: 20 }}
            ></div>
          )}
        </>
      )}
    </div>
  );
}
