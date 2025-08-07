let questions = window.questions;
let currentTime = 0;
let timerInterval;
let startTime = 0;
let currentQuestionIndex = 0;
let selectedAnswers = {};

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
        ${q.options.map((option, i) => `
          <label>
            <input type="${isMultiple ? "checkbox" : "radio"}"
                   name="question-${index}"
                   value="${option}"
                   ${getStoredAnswer(index, option) ? "checked" : ""}>
            ${option}
          </label>
        `).join("")}
      </div>
    </div>
  `;

  updateProgress();
  updateNavButtons();
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
  saveCurrentSelection();
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    displayQuestion(currentQuestionIndex);
  }
}

function prevQuestion() {
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
    currentQuestionIndex === questions.length - 1 ? "inline-block" : "none";
}

function updateNavButtons() {
  const navButtons = document.querySelectorAll(".nav-buttons button");
  navButtons[0].disabled = currentQuestionIndex === 0;
  navButtons[1].disabled = currentQuestionIndex === questions.length - 1;
}

function submitTest() {
  clearInterval(timerInterval);

  saveCurrentSelection(); // save final answer
  let score = 0;
  const total = questions.length;

  questions.forEach((question, index) => {
    const selectedValues = selectedAnswers[index] || [];
    const correctAnswers = Array.isArray(question.answer) ? question.answer : [question.answer];

    const isCorrect = selectedValues.length === correctAnswers.length &&
      selectedValues.every(val => correctAnswers.includes(val));

    if (isCorrect) {
      score++;
    }
  });

  // Disable inputs
  const inputs = document.querySelectorAll('input[type=radio], input[type=checkbox]');
  inputs.forEach(input => input.disabled = true);

  const submitButton = document.getElementById("submit-btn");
  if (submitButton) submitButton.disabled = true;

  // Show result
  const resultDiv = document.getElementById('result');
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = `
    <h2>Result:</h2>
    <p>Score: ${score}/${total}</p>
    <p>Time Taken: ${Math.floor((Date.now() - startTime) / 1000)} seconds</p>
    <button onclick="location.reload()">Retake Test</button>
  `;

  const name = document.getElementById("user-display").innerText.replace("Name: ", "");
  const pastResults = JSON.parse(localStorage.getItem("results")) || [];

  pastResults.push({
    name,
    score,
    total,
    time: Math.floor((Date.now() - startTime) / 1000),
    date: new Date().toLocaleString()
  });

  localStorage.setItem("results", JSON.stringify(pastResults));
}
