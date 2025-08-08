let questions = window.questions;
let currentTime = 0;
let timerInterval;
let startTime = 0;
let currentQuestionIndex = 0;
let selectedAnswers = {};
let isSubmitted = false;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function startTest() {
  const nameInput = document.getElementById("username");
  const name = nameInput.value.trim();
  if (!name) {
    alert("Please enter your name.");
    return;
  }

  document.getElementById("start-screen").style.display = "none";
  document.getElementById("test-screen").style.display = "block";
  document.getElementById("user-display").innerText = "Name: " + name;

  questions = shuffle(questions);
  questions.forEach(q => q.options = shuffle(q.options));

  displayQuestion(currentQuestionIndex);
  startTime = Date.now();
  startTimer();
}

function startTimer() {
  const timerDisplay = document.getElementById("timer");
  currentTime = 0;
  timerDisplay.innerText = "Time: 0 sec";

  timerInterval = setInterval(() => {
    currentTime++;
    timerDisplay.innerText = "Time: " + currentTime + " sec";
  }, 1000);
}

function displayQuestion(index) {
  const container = document.getElementById("question-container");
  const q = questions[index];
  const correctAnswers = Array.isArray(q.answer) ? q.answer : [q.answer];
  const isMultiple = correctAnswers.length > 1;

  container.innerHTML = `
    <div class="question">
      <p>${index + 1}. ${q.question}</p>
      <div class="options">
        ${q.options.map((option, i) => {
          const isChecked = getStoredAnswer(index, option) ? "checked" : "";
          const isDisabled = isSubmitted ? "disabled" : "";
          return `
            <label class="${getOptionClass(index, option)}">
              <input type="${isMultiple ? "checkbox" : "radio"}"
                     name="question-${index}"
                     value="${option}"
                     ${isChecked} ${isDisabled}>
              ${option}
            </label>
          `;
        }).join("")}
      </div>
    </div>
  `;

  updateProgress();
  updateNavButtons();
}

function getOptionClass(index, option) {
  if (!isSubmitted) return "";
  const correctAnswers = Array.isArray(questions[index].answer) ? questions[index].answer : [questions[index].answer];
  const selectedValues = selectedAnswers[index] || [];

  if (correctAnswers.includes(option) && selectedValues.includes(option)) return "correct";
  if (!correctAnswers.includes(option) && selectedValues.includes(option)) return "wrong";
  if (correctAnswers.includes(option)) return "correct";
  return "";
}

function saveCurrentSelection() {
  const inputs = document.querySelectorAll(`input[name="question-${currentQuestionIndex}"]`);
  selectedAnswers[currentQuestionIndex] = [];

  inputs.forEach(input => {
    if (input.checked) {
      selectedAnswers[currentQuestionIndex].push(input.value);
    }
  });
}

function getStoredAnswer(index, option) {
  return selectedAnswers[index]?.includes(option);
}

function nextQuestion() {
  if (isSubmitted) return;
  saveCurrentSelection();
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    displayQuestion(currentQuestionIndex);
  }
}

function prevQuestion() {
  if (isSubmitted) return;
  saveCurrentSelection();
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    displayQuestion(currentQuestionIndex);
  }
}

function updateProgress() {
  document.getElementById("progress-text").innerText = 
    `Question ${currentQuestionIndex + 1} of ${questions.length}`;

  document.getElementById("submit-btn").style.display = 
    currentQuestionIndex === questions.length - 1 && !isSubmitted ? "inline-block" : "none";
}

function updateNavButtons() {
  const navButtons = document.querySelectorAll(".nav-buttons button");
  navButtons[0].disabled = isSubmitted || currentQuestionIndex === 0;
  navButtons[1].disabled = isSubmitted || currentQuestionIndex === questions.length - 1;
}

function submitTest() {
  clearInterval(timerInterval);
  isSubmitted = true;

  saveCurrentSelection(); // Save last answer
  let score = 0;
  const total = questions.length;

  const reviewContainer = document.getElementById("question-container");
  reviewContainer.innerHTML = ""; // Clear current question view

  questions.forEach((question, index) => {
    const selectedValues = selectedAnswers[index] || [];
    const correctAnswers = Array.isArray(question.answer)
      ? question.answer
      : [question.answer];

    const isCorrect =
      selectedValues.length === correctAnswers.length &&
      selectedValues.every((val) => correctAnswers.includes(val));
    if (isCorrect) score++;

    const isMultiple = correctAnswers.length > 1;

    const div = document.createElement("div");
    div.classList.add("question");
    div.innerHTML = `<p>${index + 1}. ${question.question}</p>`;

    const optionsDiv = document.createElement("div");
    optionsDiv.classList.add("options");

    question.options.forEach((option) => {
      const input = document.createElement("input");
      input.type = isMultiple ? "checkbox" : "radio";
      input.disabled = true;
      input.name = `question-${index}`;
      input.value = option;

      if (selectedValues.includes(option)) {
        input.checked = true;
      }

      const label = document.createElement("label");
      label.appendChild(input);
      label.append(" " + option);

      if (correctAnswers.includes(option) && selectedValues.includes(option)) {
        label.classList.add("correct");
      } else if (
        !correctAnswers.includes(option) &&
        selectedValues.includes(option)
      ) {
        label.classList.add("wrong");
      } else if (
        correctAnswers.includes(option) &&
        !selectedValues.includes(option)
      ) {
        label.classList.add("correct"); // to show missed correct
        label.style.opacity = "0.6";
      }

      optionsDiv.appendChild(label);
    });

    div.appendChild(optionsDiv);
    reviewContainer.appendChild(div);
  });

  // Hide navigation
  document.querySelector(".nav-buttons").style.display = "none";
  document.getElementById("progress-text").style.display = "none";
  document.getElementById("submit-btn").style.display = "none";

  // Show result
  const resultDiv = document.getElementById("result");
  resultDiv.style.display = "block";
  resultDiv.innerHTML = `
    <h2>Result:</h2>
    <p>Score: ${score}/${total}</p>
    <p>Time Taken: ${Math.floor((Date.now() - startTime) / 1000)} seconds</p>
    <button onclick="location.reload()">Retake Test</button>
  `;

  // Save result
  const name = document
    .getElementById("user-display")
    .innerText.replace("Name: ", "");
  const pastResults = JSON.parse(localStorage.getItem("results")) || [];

  pastResults.push({
    name,
    score,
    total,
    time: Math.floor((Date.now() - startTime) / 1000),
    date: new Date().toLocaleString(),
  });

  localStorage.setItem("results", JSON.stringify(pastResults));
}



 

