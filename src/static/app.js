document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activityCount = document.getElementById("activity-count");
  const signupDialog = document.getElementById("signup-dialog");
  const signupForm = document.getElementById("signup-form");
  const emailInput = document.getElementById("email");
  const signupActivity = document.getElementById("signup-activity");
  const signupError = document.getElementById("signup-error");
  const messageDiv = document.getElementById("message");
  let messageTimeout;

  function showMessage(message, type) {
    clearTimeout(messageTimeout);
    messageDiv.textContent = message;
    messageDiv.className = `notice ${type}`;
    messageTimeout = setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  function openSignup(activity) {
    signupForm.dataset.activity = activity;
    signupActivity.textContent = activity;
    signupError.textContent = "";
    signupError.classList.add("hidden");
    signupForm.reset();
    signupDialog.showModal();
    emailInput.focus();
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) throw new Error("Activity request failed");
      const activities = await response.json();
      const entries = Object.entries(activities);
      activitiesList.replaceChildren();
      activityCount.textContent = `${entries.length} activities`;

      entries.forEach(([name, details]) => {
        const activityCard = document.createElement("article");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;
        const title = document.createElement("h4");
        title.textContent = name;
        const description = document.createElement("p");
        description.className = "activity-description";
        description.textContent = details.description;
        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        const availability = document.createElement("p");
        availability.className = "availability";
        availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
        const registerButton = document.createElement("button");
        registerButton.className = "register-btn";
        registerButton.type = "button";
        registerButton.dataset.activity = name;
        registerButton.textContent = "Register student";
        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants-container";

        if (details.participants.length > 0) {
          const participantsSection = document.createElement("div");
          participantsSection.className = "participants-section";
          const participantsTitle = document.createElement("h5");
          participantsTitle.textContent = "Participants";
          const participantsList = document.createElement("ul");
          participantsList.className = "participants-list";

          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = email;
            const unregisterButton = document.createElement("button");
            unregisterButton.className = "delete-btn";
            unregisterButton.type = "button";
            unregisterButton.dataset.activity = name;
            unregisterButton.dataset.email = email;
            unregisterButton.setAttribute("aria-label", `Unregister ${email}`);
            unregisterButton.textContent = "Remove";
            participant.append(participantEmail, unregisterButton);
            participantsList.appendChild(participant);
          });

          participantsSection.append(participantsTitle, participantsList);
          participantsContainer.appendChild(participantsSection);
        } else {
          const emptyParticipants = document.createElement("p");
          emptyParticipants.className = "empty-participants";
          emptyParticipants.textContent = "No participants yet";
          participantsContainer.appendChild(emptyParticipants);
        }

        activityCard.append(
          title,
          description,
          schedule,
          availability,
          participantsContainer,
          registerButton
        );

        activitiesList.appendChild(activityCard);
      });
    } catch (error) {
      activitiesList.replaceChildren();
      const errorMessage = document.createElement("p");
      errorMessage.textContent = "Failed to load activities. Please try again later.";
      activitiesList.appendChild(errorMessage);
      activityCount.textContent = "Activities unavailable";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(button) {
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  activitiesList.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    if (!button) return;

    if (button.classList.contains("register-btn")) {
      openSignup(button.dataset.activity);
    } else if (button.classList.contains("delete-btn")) {
      handleUnregister(button);
    }
  });

  document.getElementById("close-signup").addEventListener("click", () => {
    signupDialog.close();
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value;
    const activity = signupForm.dataset.activity;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        signupDialog.close();
        signupForm.reset();
        showMessage(result.message, "success");
        fetchActivities();
      } else {
        signupError.textContent = result.detail || "An error occurred";
        signupError.classList.remove("hidden");
      }
    } catch (error) {
      signupError.textContent = "Failed to sign up. Please try again.";
      signupError.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  fetchActivities();
});
