// script.js

// Import Firebase modules from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";


const firebaseConfig = {
  apiKey: "AIzaSyArtha3sjEArRm1-sr-VaBpqd9piJse90E",                                                                 
  authDomain: "event-scheduler-app-7f75b.firebaseapp.com",
  projectId: "event-scheduler-app-7f75b",
  storageBucket: "event-scheduler-app-7f75b.appspot.com",
  messagingSenderId: "765949906662",
  appId: "1:765949906662:web:f69d601a5c75c4d4a8f527"
};

// Initialize Firebase and get a reference to the Realtime Database.
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ==========================
// DOM Element References
// ==========================
const eventForm = document.getElementById("eventForm");
const eventList = document.getElementById("eventList");
const formFeedback = document.getElementById("formFeedback");
const biometricBtn = document.getElementById("biometricBtn");

// Chatbot elements
const aiInput = document.getElementById("chat-input");
const aiButton = document.getElementById("send-btn");
const chatHistory = document.getElementById("chat-history");

// ==========================
// Helper Functions
// ==========================
function showFeedback(message, isError = false) {
  formFeedback.textContent = message;
  formFeedback.style.color = isError ? "red" : "green";
  setTimeout(() => {
    formFeedback.textContent = "";
  }, 3000);
}

// Escape single quotes for inline usage
function escapeQuotes(str) {
  return str.replace(/'/g, "\\'");
}

// ==========================
// Event Management: Add / Edit / Delete
// ==========================

eventForm.addEventListener("submit", (e) => {
  e.preventDefault();
  console.log("Form submitted!"); // Add this for debugging

  const eventId = document.getElementById("eventId").value;
  const title = document.getElementById("title").value.trim();
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const location = document.getElementById("location").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!title || !date || !time || !location) {
    showFeedback("Please fill all required fields.", true);
    return;
  }

  const eventData = { title, date, time, location, description };

  if (eventId) {
    // Update event
    const eventRef = ref(database, "events/" + eventId);
    update(eventRef, eventData)
      .then(() => {
        showFeedback("Event updated successfully.");
        eventForm.reset();
        document.getElementById("eventId").value = "";
      })
      .catch((err) => {
        console.error("Error updating event:", err);
        showFeedback("Error updating event.", true);
      });
  } else {
    // Add new event
    const eventsRef = ref(database, "events");
    const newEventRef = push(eventsRef);
    set(newEventRef, eventData)
      .then(() => {
        showFeedback("Event added successfully.");
        eventForm.reset();
      })
      .catch((err) => {
        console.error("Error adding event:", err);
        showFeedback("Error adding event.", true);
      });
  }
});


// Listen for real-time updates in the "events" node.
const eventsRef = ref(database, "events");
onValue(eventsRef, (snapshot) => {
  eventList.innerHTML = ""; // Clear current list.
  snapshot.forEach((childSnapshot) => {
    const eventId = childSnapshot.key;
    const eventData = childSnapshot.val();
    const li = document.createElement("li");
    li.className = "event-item";
    li.innerHTML = `
      <strong>${eventData.title}</strong><br>
      ${eventData.date} at ${eventData.time}<br>
      Location: ${eventData.location}<br>
      ${eventData.description}
      <div class="event-actions">
        <button onclick="editEvent('${eventId}', '${escapeQuotes(eventData.title)}', '${eventData.date}', '${eventData.time}', '${escapeQuotes(eventData.location)}', '${escapeQuotes(eventData.description)}')">Edit</button>
        <button onclick="deleteEvent('${eventId}')">Delete</button>
      </div>
    `;
    eventList.appendChild(li);
  });
});

// Expose editEvent and deleteEvent functions to the global scope.
window.editEvent = (id, title, date, time, location, description) => {
  document.getElementById("eventId").value = id;
  document.getElementById("title").value = title;
  document.getElementById("date").value = date;
  document.getElementById("time").value = time;
  document.getElementById("location").value = location;
  document.getElementById("description").value = description;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.deleteEvent = (id) => {
  if (confirm("Are you sure you want to delete this event?")) {
    const eventRef = ref(database, "events/" + id);
    remove(eventRef)
      .then(() => showFeedback("Event deleted successfully."))
      .catch((err) => {
        console.error(err);
        showFeedback("Error deleting event.", true);
      });
  }
};

// ==========================
// Simulated AI Chatbot Integration
// ==========================

// Check for commands before sending to the AI simulation.
function ruleChatBot(request) {
  // Example: "add event Meeting" or "delete event Meeting"
  if (request.startsWith("add event")) {
    const eventDetail = request.replace("add event", "").trim();
    if (eventDetail) {
      addEventFromChat(eventDetail);
      appendMessage(`Event "${eventDetail}" added!`);
    } else {
      appendMessage("Please specify an event to add.");
    }
    return true;
  } else if (request.startsWith("delete event")) {
    const eventTitle = request.replace("delete event", "").trim();
    if (eventTitle) {
      if (deleteEventByTitle(eventTitle)) {
        appendMessage(`Event "${eventTitle}" deleted!`);
      } else {
        appendMessage("Event not found!");
      }
    } else {
      appendMessage("Please specify an event to delete.");
    }
    return true;
  }
  return false;
}

// Dummy functions for chatbot-triggered event management.
function addEventFromChat(title) {
  const dummyEvent = {
    title: title,
    date: new Date().toISOString().split("T")[0],
    time: "12:00",
    location: "TBD",
    description: "Added via chatbot."
  };
  const eventsRef = ref(database, "events");
  const newEventRef = push(eventsRef);
  set(newEventRef, dummyEvent);
}

function deleteEventByTitle(title) {
  let deleted = false;
  // Using once to get a snapshot.
  onValue(ref(database, "events"), (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const eventData = childSnapshot.val();
      if (eventData.title.toLowerCase() === title.toLowerCase()) {
        remove(ref(database, "events/" + childSnapshot.key));
        deleted = true;
      }
    });
  }, { onlyOnce: true });
  return deleted;
}

// Append a message to the chat history.
function appendMessage(message) {
  const msgDiv = document.createElement("div");
  msgDiv.textContent = message;
  msgDiv.className = "history";
  chatHistory.appendChild(msgDiv);
  aiInput.value = "";
}

// Simulated AI response (replace with a real API integration if needed)
async function askChatBot(request) {
  if (request.includes("hello") || request.includes("hi")) {
    return "Hello! How can I assist you with your events today?";
  } else if (request.includes("help")) {
    return "You can say commands like 'add event Meeting' or 'delete event Meeting'.";
  }
  return "I'm not sure how to help with that. Please try another command.";
}

// Chatbot send button event listener.
aiButton.addEventListener("click", async () => {
  const prompt = aiInput.value.trim().toLowerCase();
  if (prompt) {
    if (!ruleChatBot(prompt)) {
      const aiResponse = await askChatBot(prompt);
      appendMessage(aiResponse);
    }
  } else {
    appendMessage("Please enter a prompt.");
  }
});

// ==========================
// Simulated Biometric Authentication
// ==========================
biometricBtn.addEventListener("click", () => {
  simulateBiometricAuth();
});

function simulateBiometricAuth() {
  if (confirm("Simulate biometric authentication? Click OK to simulate success.")) {
    alert("Biometric authentication successful!");
  } else {
    alert("Biometric authentication canceled.");
  }
}
