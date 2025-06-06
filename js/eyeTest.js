// Test configuration
const TEST_CONFIG = {
  rounds: 10,
  // Base sizes for 24-inch screen (1920x1024) at 90cm distance
  baseSizes: {
    "20/200": 58, // 15.5mm
    "20/100": 29, // 7.7mm
    "20/70": 20.2, // 5.4mm
    "20/50": 14.4, // 3.8mm
    "20/40": 11.5, // 3.1mm
    "20/30": 8.6, // 2.3mm
    "20/25": 7.2, // 1.9mm
    "20/20": 5.8, // 1.5mm
    "20/15": 4.3, // 1.1mm
    "20/10": 2.9, // 0.8mm
  },
  sizes: [], // Will be calculated based on screen size
  directions: [
    { rotation: "0deg", answer: "90deg", label: "↑" }, // Up
    { rotation: "45deg", answer: "135deg", label: "↗" }, // Up-Right
    { rotation: "90deg", answer: "180deg", label: "→" }, // Right
    { rotation: "135deg", answer: "225deg", label: "↘" }, // Down-Right
    { rotation: "180deg", answer: "270deg", label: "↓" }, // Down
    { rotation: "225deg", answer: "315deg", label: "↙" }, // Down-Left
    { rotation: "270deg", answer: "0deg", label: "←" }, // Left
    { rotation: "315deg", answer: "45deg", label: "↖" }, // Up-Left
  ],
  currentRound: 0,
  testStarted: false,
  isAnswering: false,
  hasRetry: false,
  screenSize: null, // Will store screen size in inches
  currentTest: "acuity", // Current test type: "acuity", "contrast", or "color"
  contrastLevels: [
    { level: 1.0, label: "100%" },
    { level: 0.8, label: "80%" },
    { level: 0.6, label: "60%" },
    { level: 0.4, label: "40%" },
    { level: 0.2, label: "20%" },
    { level: 0.1, label: "10%" },
    { level: 0.05, label: "5%" },
    { level: 0.025, label: "2.5%" },
    { level: 0.0125, label: "1.25%" },
    { level: 0.00625, label: "0.625%" },
  ],
  // Color test tracking
  correctAnswers: 0,
  wrongAnswers: 0,
};

// Add these constants at the top of the file with other TEST_CONFIG
const CONTRAST_RATINGS = {
  "0.625%": "Excellent",
  "1.25%": "Very Good",
  "2.5%": "Good",
  "5%": "Fair",
  "10%": "Moderate",
  "20%": "Poor",
  "40%": "Very Poor",
  "60%": "Severe",
  "80%": "Very Severe",
  "100%": "Critical",
};

const CONTRAST_SCORES = {
  "0.625%": 100,
  "1.25%": 90,
  "2.5%": 80,
  "5%": 70,
  "10%": 60,
  "20%": 50,
  "40%": 40,
  "60%": 30,
  "80%": 20,
  "100%": 10,
};

const CONTRAST_RECOMMENDATIONS = {
  "0.625%": "Your contrast sensitivity is excellent. No action needed.",
  "1.25%":
    "Your contrast sensitivity is very good. Regular eye check-ups recommended.",
  "2.5%": "Your contrast sensitivity is good. Consider annual eye exams.",
  "5%": "Your contrast sensitivity is fair. Schedule an eye exam soon.",
  "10%":
    "Your contrast sensitivity is moderate. Schedule an eye exam as soon as possible.",
  "20%": "Your contrast sensitivity is poor. Schedule an eye exam immediately.",
  "40%":
    "Your contrast sensitivity is very poor. Schedule an eye exam immediately.",
  "60%":
    "Your contrast sensitivity is severe. Schedule an eye exam immediately.",
  "80%":
    "Your contrast sensitivity is very severe. Schedule an eye exam immediately.",
  "100%":
    "Your contrast sensitivity is critical. Schedule an eye exam immediately.",
};

// Function to exit fullscreen
function exitFullscreen() {
  // Stop the demo animation
  if (demoInterval) {
    clearInterval(demoInterval);
    demoInterval = null;
  }

  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
  window.location.href = "pretestPage.html";
}

// Function to calculate sizes based on screen dimensions
function calculateSizes() {
  // Get actual screen dimensions in pixels
  const screenWidth = window.screen.width * window.devicePixelRatio;
  const screenHeight = window.screen.height * window.devicePixelRatio;

  // Calculate PPI based on screen size and resolution
  const diagonalPixels = Math.sqrt(
    Math.pow(screenWidth, 2) + Math.pow(screenHeight, 2)
  );
  const ppi = diagonalPixels / TEST_CONFIG.screenSize;

  // Calculate scale based on PPI (using 24-inch screen with 1920x1024 as reference)
  // For a 24-inch screen with 1920x1024, the reference PPI is approximately 92
  const ppiScale = ppi / 92;

  // Calculate new sizes
  TEST_CONFIG.sizes = Object.values(TEST_CONFIG.baseSizes).map(
    (size) => Math.round(size * ppiScale * 100) / 100 // Round to 2 decimal places
  );

  // Debug info
  console.log("Screen Information:", {
    logicalResolution: `${window.screen.width}x${window.screen.height}`,
    physicalResolution: `${screenWidth}x${screenHeight}`,
    devicePixelRatio: window.devicePixelRatio,
    screenSize: `${TEST_CONFIG.screenSize} inches`,
    calculatedPPI: Math.round(ppi),
    ppiScale: ppiScale.toFixed(3),
    viewingDistance: "90cm (constant)",
    note: "Using detected screen dimensions and user-provided screen size",
  });
  console.log("Calculated sizes:", TEST_CONFIG.sizes);
}

// Function to start fullscreen and test
function startFullscreenTest() {
  document.documentElement
    .requestFullscreen()
    .then(() => {
      // Calculate sizes after entering fullscreen
      calculateSizes();
      startAcuityTest();
    })
    .catch((err) => {
      console.log(`Error attempting to enable fullscreen: ${err.message}`);
      // If fullscreen fails, still calculate sizes and start test
      calculateSizes();
      startAcuityTest();
    });
}

// Function to start the acuity test
function startAcuityTest() {
  // Stop the demo animation
  if (demoInterval) {
    clearInterval(demoInterval);
    demoInterval = null;
  }

  TEST_CONFIG.testStarted = true;
  TEST_CONFIG.currentRound = 0;
  TEST_CONFIG.hasRetry = false;

  // Calculate sizes based on screen and viewing distance
  calculateSizes();

  // Hide demo content
  document.querySelector(".max-w-3xl").innerHTML = `
    <div class="text-center space-y-8">
      <h2 class="text-4xl font-bold text-brand-dark-blue">Visual Acuity Test - Round ${
        TEST_CONFIG.currentRound + 1
      }/${TEST_CONFIG.rounds}</h2>
      <div class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden max-w-2xl mx-auto">
        <div id="testArea" class="absolute inset-0 flex items-center justify-center">
          <div id="testLetter" class="text-6xl font-bold text-brand-dark-blue transform transition-all duration-500"></div>
          <div id="testButtons" class="absolute inset-0">
            <!-- Top Button -->
            <button onclick="checkAnswer('0deg')" class="absolute top-8 right-[38%] -translate-x-1/2 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↑</button>
            <!-- Top-Right Button -->
            <button onclick="checkAnswer('45deg')" class="absolute top-8 right-8 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↗</button>
            <!-- Right Button -->
            <button onclick="checkAnswer('90deg')" class="absolute top-[50%] right-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">→</button>
            <!-- Bottom-Right Button -->
            <button onclick="checkAnswer('135deg')" class="absolute bottom-8 right-8 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↘</button>
            <!-- Bottom Button -->
            <button onclick="checkAnswer('180deg')" class="absolute bottom-8 right-[38%] -translate-x-1/2 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↓</button>
            <!-- Bottom-Left Button -->
            <button onclick="checkAnswer('225deg')" class="absolute bottom-8 left-8 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↙</button>
            <!-- Left Button -->
            <button onclick="checkAnswer('270deg')" class="absolute top-[50%] left-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">←</button>
            <!-- Top-Left Button -->
            <button onclick="checkAnswer('315deg')" class="absolute top-8 left-8 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↖</button>
          </div>
        </div>
      </div>
      <div class="text-lg">
        <p>Cover your left eye and click the button showing the direction the E is pointing.</p>
        <p class="mt-2">Round ${TEST_CONFIG.currentRound + 1} of ${
    TEST_CONFIG.rounds
  }</p>
      </div>
    </div>
  `;

  // Start the first round
  startRound();
}

// Function to start a new round
function startRound() {
  const testLetter = document.getElementById("testLetter");
  const currentSize = TEST_CONFIG.sizes[TEST_CONFIG.currentRound];

  const randomDirection =
    TEST_CONFIG.directions[
      Math.floor(Math.random() * TEST_CONFIG.directions.length)
    ];

  testLetter.style.fontSize = `${currentSize}px`;
  testLetter.textContent = "E";
  testLetter.style.transform = `rotate(${randomDirection.rotation})`;

  // Store the correct answer direction for this round
  testLetter.dataset.correctDirection = randomDirection.answer;

  // Debug info
  console.log("New round started:");
  console.log("Round number:", TEST_CONFIG.currentRound + 1);
  console.log(
    "Snellen equivalent:",
    getSnellenEquivalent(TEST_CONFIG.currentRound)
  );
  console.log("E size:", currentSize.toFixed(2) + "px");
  console.log("E rotation:", randomDirection.rotation);
  console.log("Correct answer:", randomDirection.answer);
  console.log("Direction:", randomDirection.label);
}

// Function to get Snellen equivalent for current round
function getSnellenEquivalent(round) {
  const snellenLevels = [
    "20/200",
    "20/100",
    "20/70",
    "20/50",
    "20/40",
    "20/30",
    "20/25",
    "20/20",
    "20/15",
    "20/10",
  ];
  return snellenLevels[round] || "Unknown";
}

// Function to check the answer
function checkAnswer(selectedDirection) {
  if (TEST_CONFIG.isAnswering) return;

  TEST_CONFIG.isAnswering = true;
  const testLetter = document.getElementById("testLetter");
  const correctDirection = testLetter.dataset.correctDirection;
  const buttons = document.querySelectorAll("#testButtons button");

  // Disable all buttons temporarily
  buttons.forEach((btn) => (btn.disabled = true));

  // Handle "can't see" response
  if (selectedDirection === "cant_see") {
    const cantSeeButton = document.querySelector(
      "button[onclick=\"checkAnswer('cant_see')\"]"
    );
    cantSeeButton.classList.add("bg-red-300");

    setTimeout(() => {
      if (!TEST_CONFIG.hasRetry) {
        // First "can't see" - mark retry used and continue to next size
        TEST_CONFIG.hasRetry = true;
        TEST_CONFIG.currentRound++;

        if (TEST_CONFIG.currentRound < TEST_CONFIG.rounds) {
          // Update round number
          const isLeftEye = document
            .querySelector("h2")
            .textContent.includes("Left Eye");
          document.querySelector("h2").textContent = `${
            isLeftEye ? "Left" : "Right"
          } Eye Test - Round ${TEST_CONFIG.currentRound + 1}/${
            TEST_CONFIG.rounds
          }`;
          document.querySelector(
            ".text-lg p:nth-child(2)"
          ).textContent = `Round ${TEST_CONFIG.currentRound + 1} of ${
            TEST_CONFIG.rounds
          }`;

          // Reset button styles
          buttons.forEach((btn) => {
            btn.disabled = false;
            btn.classList.remove("bg-brand-pale-green", "bg-red-300");
          });

          // Start next round
          startRound();
        } else {
          // Test completed
          const isLeftEye = document
            .querySelector("h2")
            .textContent.includes("Left Eye");
          showResults(false, isLeftEye ? "left" : "right");
        }
      } else {
        // Second "can't see" - end test
        const isLeftEye = document
          .querySelector("h2")
          .textContent.includes("Left Eye");
        showResults(false, isLeftEye ? "left" : "right");
      }

      TEST_CONFIG.isAnswering = false;
    }, 1000);
    return;
  }

  // Highlight the selected button
  const selectedButton = document.querySelector(
    `button[onclick="checkAnswer('${selectedDirection}')"]`
  );
  if (selectedButton) {
    selectedButton.classList.add(
      selectedDirection === correctDirection
        ? "bg-brand-pale-green"
        : "bg-red-300"
    );
  }

  // Debug info
  console.log("Answer Check:", {
    selected: selectedDirection,
    correct: correctDirection,
    isCorrect: selectedDirection === correctDirection,
    currentRound: TEST_CONFIG.currentRound + 1,
  });

  // Wait 1 second before moving to next round
  setTimeout(() => {
    if (selectedDirection === correctDirection) {
      // Correct answer - move to next size
      TEST_CONFIG.currentRound++;
      TEST_CONFIG.hasRetry = false;

      if (TEST_CONFIG.currentRound < TEST_CONFIG.rounds) {
        // Update round number
        const isLeftEye = document
          .querySelector("h2")
          .textContent.includes("Left Eye");
        document.querySelector("h2").textContent = `${
          isLeftEye ? "Left" : "Right"
        } Eye Test - Round ${TEST_CONFIG.currentRound + 1}/${
          TEST_CONFIG.rounds
        }`;
        document.querySelector(
          ".text-lg p:nth-child(2)"
        ).textContent = `Round ${TEST_CONFIG.currentRound + 1} of ${
          TEST_CONFIG.rounds
        }`;

        // Reset button styles
        buttons.forEach((btn) => {
          btn.disabled = false;
          btn.classList.remove("bg-brand-pale-green", "bg-red-300");
        });

        // Start next round
        startRound();
      } else {
        // Test completed with perfect score
        const isLeftEye = document
          .querySelector("h2")
          .textContent.includes("Left Eye");
        showResults(true, isLeftEye ? "left" : "right");
      }
    } else if (!TEST_CONFIG.hasRetry) {
      // Wrong answer but haven't used retry yet
      TEST_CONFIG.hasRetry = true;

      // Reset button styles
      buttons.forEach((btn) => {
        btn.disabled = false;
        btn.classList.remove("bg-brand-pale-green", "bg-red-300");
      });

      // Try same size again
      startRound();
    } else {
      // Wrong answer and already used retry - end test
      const isLeftEye = document
        .querySelector("h2")
        .textContent.includes("Left Eye");
      showResults(false, isLeftEye ? "left" : "right");
    }

    TEST_CONFIG.isAnswering = false;
  }, 1000);
}

// Function to show test results
function showResults(perfectScore, eye = "right") {
  const lastSuccessfulRound = TEST_CONFIG.currentRound - 1;
  const snellenResult = getSnellenEquivalent(lastSuccessfulRound);

  // Store the result for the current eye
  TEST_CONFIG[`${eye}EyeResult`] = snellenResult;

  if (eye === "right") {
    // Show left eye test prompt
    document.querySelector(".max-w-3xl").innerHTML = `
      <div class="text-center space-y-8">
        <div class="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
          <div class="space-y-6">
            <!-- Right Eye Results -->
            <div class="bg-brand-pale-green/20 p-6 rounded-lg">
              <h3 class="text-2xl font-semibold text-brand-dark-blue mb-4">Right Eye Test Complete!</h3>
              <div class="flex items-center justify-center space-x-4">
                <div class="w-16 h-16 bg-brand-pale-green/30 rounded-full flex items-center justify-center">
                  <svg class="w-8 h-8 text-brand-dark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div class="text-left">
                  <p class="text-2xl font-bold text-brand-dark-blue">${snellenResult}</p>
                  <p class="text-gray-600">Visual Acuity</p>
                </div>
              </div>
              ${
                perfectScore
                  ? '<p class="text-lg text-green-600 mt-4">Perfect score! You completed all levels.</p>'
                  : ""
              }
            </div>

            <!-- Left Eye Instructions -->
            <div class="text-center">
              <h3 class="text-2xl font-semibold text-brand-dark-blue mb-4">Now let's test your left eye</h3>
              <div class="flex items-center justify-center space-x-4 mb-6">
                <div class="w-12 h-12 bg-brand-pale-green/20 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-brand-dark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p class="text-lg">Please cover your right eye with your hand</p>
              </div>
              <button
                id="startLeftEyeButton"
                onclick="startLeftEyeTest()"
                class="bg-brand-dark-blue text-white py-4 px-12 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold shadow-lg"
              >
                Start Left Eye Test
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add keyboard listener for Enter key
    const enterHandler = function (e) {
      if (e.key === "Enter") {
        document.getElementById("startLeftEyeButton").click();
        document.removeEventListener("keypress", enterHandler);
      }
    };
    document.addEventListener("keypress", enterHandler);
  } else {
    // Show final results for both eyes and prompt for contrast test
    document.querySelector(".max-w-3xl").innerHTML = `
      <div class="text-center space-y-8">
        <div class="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
          <div class="space-y-6">
            <h2 class="text-3xl font-bold text-brand-dark-blue">Acuity Test Completed!</h2>
            
            <!-- Results Grid -->
            <div class="grid grid-cols-2 gap-6">
              <!-- Right Eye -->
              <div class="bg-brand-pale-green/20 p-6 rounded-lg">
                <div class="flex items-center space-x-4 mb-4">
                  <div class="w-12 h-12 bg-brand-pale-green/30 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-brand-dark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 class="text-xl font-semibold text-brand-dark-blue">Right Eye</h3>
                </div>
                <p class="text-2xl font-bold text-brand-dark-blue">${TEST_CONFIG.rightEyeResult}</p>
              </div>

              <!-- Left Eye -->
              <div class="bg-brand-pale-green/20 p-6 rounded-lg">
                <div class="flex items-center space-x-4 mb-4">
                  <div class="w-12 h-12 bg-brand-pale-green/30 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-brand-dark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 class="text-xl font-semibold text-brand-dark-blue">Left Eye</h3>
                </div>
                <p class="text-2xl font-bold text-brand-dark-blue">${TEST_CONFIG.leftEyeResult}</p>
              </div>
            </div>

            <!-- Next Test Prompt -->
            <div class="text-center pt-6">
              <h3 class="text-2xl font-semibold text-brand-dark-blue mb-4">Now let's test your contrast sensitivity</h3>
              <p class="text-lg mb-6">This test will measure how well you can distinguish between different shades of gray</p>
              <button
                onclick="startContrastTest()"
                class="bg-brand-dark-blue text-white py-4 px-12 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold shadow-lg"
              >
                Start Contrast Test
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add keyboard listener for Enter key
    document.addEventListener("keypress", function handleEnter(e) {
      if (e.key === "Enter") {
        document.querySelector('button[onclick="startContrastTest()"]').click();
        document.removeEventListener("keypress", handleEnter);
      }
    });
  }
}

// Function to start left eye test
function startLeftEyeTest() {
  // Stop any existing demo animation
  if (demoInterval) {
    clearInterval(demoInterval);
    demoInterval = null;
  }

  TEST_CONFIG.testStarted = true;
  TEST_CONFIG.currentRound = 0;
  TEST_CONFIG.hasRetry = false;

  // Calculate sizes based on screen and viewing distance
  calculateSizes();

  // Hide demo content
  document.querySelector(".max-w-3xl").innerHTML = `
    <div class="text-center space-y-8">
      <h2 class="text-4xl font-bold text-brand-dark-blue">Left Eye Test - Round ${
        TEST_CONFIG.currentRound + 1
      }/${TEST_CONFIG.rounds}</h2>
      <div class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden max-w-2xl mx-auto">
        <div id="testArea" class="absolute inset-0 flex items-center justify-center">
          <div id="testLetter" class="text-6xl font-bold text-brand-dark-blue transform transition-all duration-500"></div>
          <div id="testButtons" class="absolute inset-0">
            <!-- Top Button -->
            <button onclick="checkAnswer('0deg')" class="absolute top-8 right-[38%] -translate-x-1/2 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↑</button>
            <!-- Top-Right Button -->
            <button onclick="checkAnswer('45deg')" class="absolute top-8 right-8 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↗</button>
            <!-- Right Button -->
            <button onclick="checkAnswer('90deg')" class="absolute top-[50%] right-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">→</button>
            <!-- Bottom-Right Button -->
            <button onclick="checkAnswer('135deg')" class="absolute bottom-8 right-8 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↘</button>
            <!-- Bottom Button -->
            <button onclick="checkAnswer('180deg')" class="absolute bottom-8 right-[38%] -translate-x-1/2 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↓</button>
            <!-- Bottom-Left Button -->
            <button onclick="checkAnswer('225deg')" class="absolute bottom-8 left-8 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↙</button>
            <!-- Left Button -->
            <button onclick="checkAnswer('270deg')" class="absolute top-[50%] left-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">←</button>
            <!-- Top-Left Button -->
            <button onclick="checkAnswer('315deg')" class="absolute top-8 left-8 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↖</button>
          </div>
        </div>
      </div>
      <div class="text-lg">
        <p>Cover your right eye and click the button showing the direction the E is pointing.</p>
        <p class="mt-2">Round ${TEST_CONFIG.currentRound + 1} of ${
    TEST_CONFIG.rounds
  }</p>
      </div>
    </div>
  `;

  // Start the first round
  startRound();
}

// Function to play the test demonstration
let demoInterval;

function playDemo() {
  const letterDemo = document.getElementById("letterDemo");
  const topButton = document.getElementById("topButton");
  const rightButton = document.getElementById("rightButton");
  const bottomButton = document.getElementById("bottomButton");
  const leftButton = document.getElementById("leftButton");

  // Reset animations
  letterDemo.style.transform = "rotate(0deg)";
  [topButton, rightButton, bottomButton, leftButton].forEach((btn) => {
    btn.style.transform = "scale(0)";
    btn.classList.remove("bg-brand-pale-green", "bg-red-300");
  });

  // Show all buttons
  setTimeout(() => {
    [topButton, rightButton, bottomButton, leftButton].forEach((btn) => {
      btn.style.transform = "scale(1)";
    });
  }, 1000);

  // Rotate E and press corresponding button
  const directions = [
    { rotation: "0deg", button: topButton, correct: false },
    { rotation: "90deg", button: rightButton, correct: true },
    { rotation: "180deg", button: bottomButton, correct: true },
    { rotation: "270deg", button: leftButton, correct: true },
  ];

  directions.forEach((direction, index) => {
    // Rotate E and press button
    setTimeout(() => {
      letterDemo.style.transform = `rotate(${direction.rotation})`;
      direction.button.classList.add(
        direction.correct ? "bg-brand-pale-green" : "bg-red-300"
      );
    }, 2000 + index * 2000);

    // Reset button
    setTimeout(() => {
      direction.button.classList.remove("bg-brand-pale-green", "bg-red-300");
    }, 2500 + index * 2000);
  });

  // Reset for next play
  setTimeout(() => {
    letterDemo.style.transform = "rotate(0deg)";
    [topButton, rightButton, bottomButton, leftButton].forEach((btn) => {
      btn.style.transform = "scale(0)";
      btn.classList.remove("bg-brand-pale-green", "bg-red-300");
    });
  }, 10000);
}

// Function to calculate viewing distance based on PPI
function calculateViewingDistance(ppi) {
  // PPI to distance mapping (rounded up for better visibility)
  const ppiToDistance = {
    72: 2.5, // 72 PPI -> 2.5 meters
    92: 2.0, // 92 PPI -> 2.0 meters
    109: 1.7, // 109 PPI -> 1.7 meters
    163: 1.2, // 163 PPI -> 1.2 meters
    220: 0.9, // 220 PPI -> 0.9 meters
    264: 0.7, // 264 PPI -> 0.7 meters
    300: 0.7, // 300 PPI -> 0.7 meters
  };

  // Find the closest PPI value
  const ppiValues = Object.keys(ppiToDistance).map(Number);
  const closestPPI = ppiValues.reduce((prev, curr) => {
    return Math.abs(curr - ppi) < Math.abs(prev - ppi) ? curr : prev;
  });

  return ppiToDistance[closestPPI];
}

// Function to calculate PPI
function calculatePPI(screenSizeInches) {
  const width = window.screen.width;
  const height = window.screen.height;
  const diagonalPixels = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
  return Math.round(diagonalPixels / screenSizeInches);
}

// Function to show calibration screen
function showCalibrationScreen() {
  document.querySelector(".max-w-3xl").innerHTML = `
    <div class="text-center space-y-8">
      <h2 class="text-4xl font-bold text-brand-dark-blue">Screen Calibration</h2>
      
      <!-- Main Calibration Card -->
      <div class="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
        <div class="space-y-6">
          <!-- Calibration Overview -->
          <div class="flex items-center space-x-4 text-left">
            <div class="flex-shrink-0 w-12 h-12 bg-brand-pale-green/20 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-brand-dark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-brand-dark-blue">Screen Size Required</h3>
              <p class="text-gray-600">Please select your display type or enter your screen size</p>
            </div>
          </div>

          <!-- Input Section -->
          <div class="bg-gray-50 rounded-lg p-6">
            <!-- Common Displays Dropdown -->
            <div class="mb-6">
              <label for="displayType" class="block text-sm font-medium text-gray-700 mb-2">Common Displays</label>
              <select
                id="displayType"
                class="w-full px-4 py-3 text-lg border-2 border-brand-dark-blue rounded-lg focus:outline-none focus:border-brand-cyan"
                onchange="handleDisplayTypeChange(this.value)"
              >
                <option value="">Select your display type</option>
                <optgroup label="Laptops">
                  <option value="13">13" Laptop (MacBook Air, etc.)</option>
                  <option value="14">14" Laptop (MacBook Pro, etc.)</option>
                  <option value="15.6">15.6" Laptop (Standard Windows Laptop)</option>
                  <option value="16">16" Laptop (MacBook Pro, etc.)</option>
                </optgroup>
                <optgroup label="Desktop Monitors">
                  <option value="21.5">21.5" Monitor (Standard Desktop)</option>
                  <option value="24">24" Monitor (Standard Desktop)</option>
                  <option value="27">27" Monitor (Standard Desktop)</option>
                  <option value="32">32" Monitor (Large Desktop)</option>
                </optgroup>
                <optgroup label="Apple Displays">
                  <option value="21.5">iMac 21.5"</option>
                  <option value="24">iMac 24"</option>
                  <option value="27">iMac 27"</option>
                  <option value="32">iMac 32"</option>
                </optgroup>
                <option value="custom">Custom Size</option>
              </select>
            </div>

            <!-- Manual Input -->
            <div class="flex items-center justify-center space-x-4">
              <input
                type="number"
                id="screenSize"
                class="w-24 px-4 py-3 text-xl text-center border-2 border-brand-dark-blue rounded-lg focus:outline-none focus:border-brand-cyan"
                placeholder="Size"
                min="1"
                max="100"
                step="0.1"
              />
              <span class="text-xl font-semibold text-gray-700">inches</span>
            </div>
            <p class="text-sm text-gray-600 mt-3">Measure diagonally from corner to corner</p>
          </div>

          <!-- Start Button -->
          <button
            onclick="startCalibration()"
            class="w-full bg-brand-dark-blue text-white py-4 px-8 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold shadow-lg"
          >
            Start Test
          </button>
        </div>
      </div>
    </div>
  `;

  // Add enter key listener for the input
  document.getElementById("screenSize").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      startCalibration();
    }
  });
}

// Function to handle display type selection
function handleDisplayTypeChange(value) {
  const screenSizeInput = document.getElementById("screenSize");
  if (value === "custom") {
    screenSizeInput.value = "";
    screenSizeInput.focus();
  } else if (value) {
    screenSizeInput.value = value;
  }
}

// Function to start calibration
function startCalibration() {
  const screenSizeInput = document.getElementById("screenSize");
  const screenSize = parseFloat(screenSizeInput.value);

  if (!screenSize || screenSize <= 0) {
    alert("Please enter a valid screen size");
    return;
  }

  TEST_CONFIG.screenSize = screenSize;

  document.documentElement
    .requestFullscreen()
    .then(() => {
      const ppi = calculatePPI(screenSize);
      TEST_CONFIG.viewingDistance = calculateViewingDistance(ppi);

      console.log("Calibration Results:", {
        screenSize: `${screenSize} inches`,
        ppi: ppi,
        viewingDistance: `${TEST_CONFIG.viewingDistance} meters`,
        note: "Please position yourself at the specified distance from the screen",
      });

      // Show distance instructions
      showPositioningScreen();
    })
    .catch((err) => {
      console.log(`Error attempting to enable fullscreen: ${err.message}`);
      // If fullscreen fails, still proceed with calibration
      const ppi = calculatePPI(screenSize);
      TEST_CONFIG.viewingDistance = calculateViewingDistance(ppi);
      showTestInstructions();
    });
}

// Function to show positioning screen
function showPositioningScreen() {
  document.querySelector(".max-w-3xl").innerHTML = `
    <div class="text-center space-y-8">
      <h2 class="text-4xl font-bold text-brand-dark-blue">Position Yourself</h2>
      
      <!-- Main Instructions Card -->
      <div class="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
        <div class="space-y-6">
          <!-- Viewing Distance -->
          <div class="flex items-center space-x-4 text-left">
            <div class="flex-shrink-0 w-12 h-12 bg-brand-pale-green/20 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-brand-dark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-brand-dark-blue">Viewing Distance</h3>
              <p class="text-gray-600">Stand 90 centimeters (35 inches) away from your screen</p>
              <p class="text-gray-600">This is about arm's length from the screen</p>
            </div>
          </div>

          <!-- Test Overview -->
          <div class="flex items-center space-x-4 text-left">
            <div class="flex-shrink-0 w-12 h-12 bg-brand-pale-green/20 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-brand-dark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-brand-dark-blue">Test Overview</h3>
              <p class="text-gray-600">You'll be shown letters in different sizes and asked to identify their direction</p>
            </div>
          </div>

          <!-- Instructions List -->
          <div class="space-y-4 text-left">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-brand-pale-green/20 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-brand-dark-blue font-semibold">1</span>
              </div>
              <p class="text-gray-700">Cover one eye with your hand</p>
            </div>
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-brand-pale-green/20 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-brand-dark-blue font-semibold">2</span>
              </div>
              <p class="text-gray-700">Look at the letter in the center of the screen</p>
            </div>
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-brand-pale-green/20 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-brand-dark-blue font-semibold">3</span>
              </div>
              <p class="text-gray-700">Click the button showing the direction the letter is pointing</p>
            </div>
          </div>

          <!-- Test Sequence -->
          <div class="bg-gray-50 rounded-lg p-4 text-left">
            <h4 class="text-sm font-semibold text-gray-600 mb-2">Test Sequence:</h4>
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-brand-dark-blue rounded-full"></div>
                <p class="text-gray-700">Visual Acuity Test (Right Eye)</p>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-brand-dark-blue rounded-full"></div>
                <p class="text-gray-700">Visual Acuity Test (Left Eye)</p>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-brand-dark-blue rounded-full"></div>
                <p class="text-gray-700">Contrast Sensitivity Test (Right Eye)</p>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-brand-dark-blue rounded-full"></div>
                <p class="text-gray-700">Contrast Sensitivity Test (Left Eye)</p>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-brand-dark-blue rounded-full"></div>
                <p class="text-gray-700">Color Vision Test (Both Eyes)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onclick="showTestInstructions()"
        class="bg-brand-dark-blue text-white py-4 px-12 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold shadow-lg"
      >
        Start Test
      </button>
    </div>
  `;

  // Add keyboard listener for Enter key
  document.addEventListener("keypress", function handleEnter(e) {
    if (e.key === "Enter") {
      showTestInstructions();
      document.removeEventListener("keypress", handleEnter);
    }
  });
}

// Function to show test instructions
function showTestInstructions() {
  document.querySelector(".max-w-3xl").innerHTML = `
    <div class="text-center space-y-8">
      <h2 class="text-4xl font-bold text-brand-dark-blue">Visual Acuity Test</h2>
      
      <!-- Main Instructions Card -->
      <div class="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
        <div class="space-y-6">
          <!-- Test Overview -->
          <div class="flex items-center space-x-4 text-left">
            <div class="flex-shrink-0 w-12 h-12 bg-brand-pale-green/20 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-brand-dark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-brand-dark-blue">Test Overview</h3>
              <p class="text-gray-600">You'll be shown a series of letters in different sizes</p>
            </div>
          </div>

          <!-- Instructions List -->
          <div class="space-y-4 text-left">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-brand-pale-green/20 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-brand-dark-blue font-semibold">1</span>
              </div>
              <p class="text-gray-700">Cover your left eye with your hand</p>
            </div>
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-brand-pale-green/20 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-brand-dark-blue font-semibold">2</span>
              </div>
              <p class="text-gray-700">Look at the letter in the center of the screen</p>
            </div>
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-brand-pale-green/20 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-brand-dark-blue font-semibold">3</span>
              </div>
              <p class="text-gray-700">Click the button showing the direction the letter is pointing</p>
            </div>
          </div>

          <!-- Keyboard Controls -->
          <div class="bg-gray-50 rounded-lg p-4 text-left">
            <h4 class="text-sm font-semibold text-gray-600 mb-2">Keyboard Controls:</h4>
            <div class="grid grid-cols-3 gap-2 text-sm">
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">7</kbd>
                <span class="text-gray-600">↖</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">8</kbd>
                <span class="text-gray-600">↑</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">9</kbd>
                <span class="text-gray-600">↗</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">4</kbd>
                <span class="text-gray-600">←</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">5</kbd>
                <span class="text-gray-600">-</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">6</kbd>
                <span class="text-gray-600">→</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">1</kbd>
                <span class="text-gray-600">↙</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">2</kbd>
                <span class="text-gray-600">↓</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">3</kbd>
                <span class="text-gray-600">↘</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onclick="startAcuityTest()"
        class="bg-brand-dark-blue text-white py-4 px-12 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold shadow-lg"
      >
        Start Test
      </button>
    </div>
  `;

  // Add keyboard listener for Enter key
  document.addEventListener("keypress", function handleEnter(e) {
    if (e.key === "Enter") {
      startAcuityTest();
      document.removeEventListener("keypress", handleEnter);
    }
  });
}

// Add keyboard event listener for test navigation
document.addEventListener("keydown", (event) => {
  if (!TEST_CONFIG.testStarted || TEST_CONFIG.isAnswering) return;

  // Only handle keyboard navigation for the current test type
  if (TEST_CONFIG.currentTest === "acuity") {
    switch (event.key) {
      case "ArrowUp":
        checkAnswer("0deg");
        break;
      case "ArrowRight":
        checkAnswer("90deg");
        break;
      case "ArrowDown":
        checkAnswer("180deg");
        break;
      case "ArrowLeft":
        checkAnswer("270deg");
        break;
      // Add diagonal directions with number pad
      case "7":
        checkAnswer("315deg"); // Top-Left
        break;
      case "8":
        checkAnswer("0deg"); // Top
        break;
      case "9":
        checkAnswer("45deg"); // Top-Right
        break;
      case "4":
        checkAnswer("270deg"); // Left
        break;
      case "6":
        checkAnswer("90deg"); // Right
        break;
      case "1":
        checkAnswer("225deg"); // Bottom-Left
        break;
      case "2":
        checkAnswer("180deg"); // Bottom
        break;
      case "3":
        checkAnswer("135deg"); // Bottom-Right
        break;
    }
  } else if (TEST_CONFIG.currentTest === "contrast") {
    switch (event.key) {
      case "ArrowUp":
        checkContrastAnswer("0deg");
        break;
      case "ArrowRight":
        checkContrastAnswer("90deg");
        break;
      case "ArrowDown":
        checkContrastAnswer("180deg");
        break;
      case "ArrowLeft":
        checkContrastAnswer("270deg");
        break;
      // Add diagonal directions with number pad
      case "7":
        checkContrastAnswer("315deg"); // Top-Left
        break;
      case "8":
        checkContrastAnswer("0deg"); // Top
        break;
      case "9":
        checkContrastAnswer("45deg"); // Top-Right
        break;
      case "4":
        checkContrastAnswer("270deg"); // Left
        break;
      case "6":
        checkContrastAnswer("90deg"); // Right
        break;
      case "1":
        checkContrastAnswer("225deg"); // Bottom-Left
        break;
      case "2":
        checkContrastAnswer("180deg"); // Bottom
        break;
      case "3":
        checkContrastAnswer("135deg"); // Bottom-Right
        break;
    }
  }
});

// Handle fullscreen changes
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    // Clear any intervals before redirecting
    if (demoInterval) {
      clearInterval(demoInterval);
    }
    window.location.href = "pretestPage.html";
  }
});

// Start with calibration screen
window.onload = () => {
  showCalibrationScreen();
};

// Function to start contrast test
function startContrastTest() {
  TEST_CONFIG.currentTest = "contrast";
  TEST_CONFIG.testStarted = true;
  TEST_CONFIG.currentRound = 0;
  TEST_CONFIG.hasRetry = false;
  TEST_CONFIG.currentEye = "right";

  // Show contrast test instructions
  document.querySelector(".max-w-3xl").innerHTML = `
    <div class="text-center space-y-8">
      <h2 class="text-4xl font-bold text-brand-dark-blue">Contrast Sensitivity Test</h2>
      
      <!-- Main Instructions Card -->
      <div class="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
        <div class="space-y-6">
          <!-- Test Overview -->
          <div class="flex items-center space-x-4 text-left">
            <div class="flex-shrink-0 w-12 h-12 bg-brand-pale-green/20 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-brand-dark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-brand-dark-blue">Test Overview</h3>
              <p class="text-gray-600">You'll be shown letter C in different shades of gray</p>
            </div>
          </div>

          <!-- Instructions List -->
          <div class="space-y-4 text-left">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-brand-pale-green/20 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-brand-dark-blue font-semibold">1</span>
              </div>
              <p class="text-gray-700">Cover your left eye with your hand</p>
            </div>
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-brand-pale-green/20 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-brand-dark-blue font-semibold">2</span>
              </div>
              <p class="text-gray-700">Look at the letter C and identify which way it's pointing</p>
            </div>
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-brand-pale-green/20 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-brand-dark-blue font-semibold">3</span>
              </div>
              <p class="text-gray-700">Click the corresponding direction button or use the number pad</p>
            </div>
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-brand-pale-green/20 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-brand-dark-blue font-semibold">4</span>
              </div>
              <p class="text-gray-700">The contrast will decrease as you progress through the test</p>
            </div>
          </div>

          <!-- Keyboard Controls -->
          <div class="bg-gray-50 rounded-lg p-4 text-left">
            <h4 class="text-sm font-semibold text-gray-600 mb-2">Keyboard Controls:</h4>
            <div class="grid grid-cols-3 gap-2 text-sm">
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">7</kbd>
                <span class="text-gray-600">↖</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">8</kbd>
                <span class="text-gray-600">↑</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">9</kbd>
                <span class="text-gray-600">↗</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">4</kbd>
                <span class="text-gray-600">←</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">5</kbd>
                <span class="text-gray-600">-</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">6</kbd>
                <span class="text-gray-600">→</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">1</kbd>
                <span class="text-gray-600">↙</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">2</kbd>
                <span class="text-gray-600">↓</span>
              </div>
              <div class="flex items-center space-x-2">
                <kbd class="px-2 py-1 bg-white rounded border">3</kbd>
                <span class="text-gray-600">↘</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        id="startTestButton"
        onclick="startContrastTestRound()"
        class="bg-brand-dark-blue text-white py-4 px-12 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold shadow-lg"
      >
        Start Test
      </button>
    </div>
  `;

  // Add keyboard listener for Enter key
  const enterHandler = function (e) {
    if (e.key === "Enter") {
      document.getElementById("startTestButton").click();
      document.removeEventListener("keypress", enterHandler);
    }
  };
  document.addEventListener("keypress", enterHandler);
}

// Function to start a contrast test round
function startContrastTestRound() {
  // Stop the demo animation
  if (demoInterval) {
    clearInterval(demoInterval);
    demoInterval = null;
  }

  const currentContrast = TEST_CONFIG.contrastLevels[TEST_CONFIG.currentRound];
  const isLeftEye = TEST_CONFIG.currentEye === "left";

  // Create a fixed-size container to prevent resizing
  document.querySelector(".max-w-3xl").innerHTML = `
    <div class="text-center space-y-8">
      <h2 class="text-4xl font-bold text-brand-dark-blue">${
        isLeftEye ? "Left" : "Right"
      } Eye Contrast Test - Round ${TEST_CONFIG.currentRound + 1}/${
    TEST_CONFIG.rounds
  }</h2>
      <div class="relative w-[600px] h-[600px] bg-gray-100 rounded-lg overflow-hidden mx-auto">
        <div id="testArea" class="absolute inset-0 flex items-center justify-center">
          <img id="testLetter" src="assets/c.png" class="w-24 h-24 transform transition-all duration-500" style="opacity: ${
            currentContrast.level
          }" alt="C">
          <div id="testButtons" class="absolute inset-0">
            <!-- Top Button -->
            <button onclick="checkContrastAnswer('0deg')" class="absolute top-8 right-[38%] -translate-x-1/2 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↑</button>
            <!-- Top-Right Button -->
            <button onclick="checkContrastAnswer('45deg')" class="absolute top-8 right-8 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↗</button>
            <!-- Right Button -->
            <button onclick="checkContrastAnswer('90deg')" class="absolute top-[50%] right-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">→</button>
            <!-- Bottom-Right Button -->
            <button onclick="checkContrastAnswer('135deg')" class="absolute bottom-8 right-8 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↘</button>
            <!-- Bottom Button -->
            <button onclick="checkContrastAnswer('180deg')" class="absolute bottom-8 right-[38%] -translate-x-1/2 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↓</button>
            <!-- Bottom-Left Button -->
            <button onclick="checkContrastAnswer('225deg')" class="absolute bottom-8 left-8 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↙</button>
            <!-- Left Button -->
            <button onclick="checkContrastAnswer('270deg')" class="absolute top-[50%] left-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">←</button>
            <!-- Top-Left Button -->
            <button onclick="checkContrastAnswer('315deg')" class="absolute top-8 left-8 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↖</button>
          </div>
        </div>
      </div>
      <div class="text-lg">
        <p>Click the button showing the direction the C is pointing.</p>
        <p class="mt-2">Round ${TEST_CONFIG.currentRound + 1} of ${
    TEST_CONFIG.rounds
  }</p>
      </div>
    </div>
  `;

  // Start the round
  const testLetter = document.getElementById("testLetter");
  const randomDirection =
    TEST_CONFIG.directions[
      Math.floor(Math.random() * TEST_CONFIG.directions.length)
    ];

  testLetter.style.transform = `rotate(${randomDirection.rotation})`;
  testLetter.dataset.correctDirection = randomDirection.answer;

  // Debug info
  console.log("New contrast round started:");
  console.log("Round number:", TEST_CONFIG.currentRound + 1);
  console.log("Contrast level:", currentContrast.label);
  console.log("C rotation:", randomDirection.rotation);
  console.log("Correct answer:", randomDirection.answer);
  console.log("Direction:", randomDirection.label);
  console.log("Current eye:", TEST_CONFIG.currentEye);
}

// Function to check contrast test answer
function checkContrastAnswer(selectedDirection) {
  if (TEST_CONFIG.isAnswering) return;

  TEST_CONFIG.isAnswering = true;
  const testLetter = document.getElementById("testLetter");
  const correctDirection = testLetter.dataset.correctDirection;
  const buttons = document.querySelectorAll("#testButtons button");

  // Disable all buttons temporarily
  buttons.forEach((btn) => (btn.disabled = true));

  // Highlight the selected button
  const selectedButton = document.querySelector(
    `button[onclick="checkContrastAnswer('${selectedDirection}')"]`
  );
  if (selectedButton) {
    selectedButton.classList.add(
      selectedDirection === correctDirection
        ? "bg-brand-pale-green"
        : "bg-red-300"
    );
  }

  // Debug info
  console.log("Contrast Answer Check:", {
    selected: selectedDirection,
    correct: correctDirection,
    isCorrect: selectedDirection === correctDirection,
    currentRound: TEST_CONFIG.currentRound + 1,
  });

  // Wait 1 second before moving to next round
  setTimeout(() => {
    if (selectedDirection === correctDirection) {
      // Correct answer - move to next contrast level
      TEST_CONFIG.currentRound++;
      TEST_CONFIG.hasRetry = false;

      if (TEST_CONFIG.currentRound < TEST_CONFIG.rounds) {
        startContrastTestRound();
      } else {
        // Test completed with perfect score
        const isLeftEye = TEST_CONFIG.currentEye === "left";
        showContrastResults(true, isLeftEye ? "left" : "right");
      }
    } else if (!TEST_CONFIG.hasRetry) {
      // First wrong answer - mark retry used and continue to next contrast level
      TEST_CONFIG.hasRetry = true;
      TEST_CONFIG.currentRound++;

      if (TEST_CONFIG.currentRound < TEST_CONFIG.rounds) {
        startContrastTestRound();
      } else {
        const isLeftEye = TEST_CONFIG.currentEye === "left";
        showContrastResults(false, isLeftEye ? "left" : "right");
      }
    } else {
      // Second wrong answer in a row - end test
      const isLeftEye = TEST_CONFIG.currentEye === "left";
      showContrastResults(false, isLeftEye ? "left" : "right");
    }

    TEST_CONFIG.isAnswering = false;
  }, 1000);
}

// Function to show contrast test results
function showContrastResults(perfectScore, eye = "right") {
  const passed = perfectScore;
  document.querySelector(".max-w-3xl").innerHTML = `
    <div class="text-center space-y-8">
      <h2 class="text-4xl font-bold text-brand-dark-blue">Contrast Test Results - ${
        eye === "right" ? "Right" : "Left"
      } Eye</h2>
      <div class="bg-brand-pale-green/20 p-8 rounded-lg">
        <p class="text-2xl mb-4">Test Status: ${
          passed ? "Passed" : "Failed"
        }</p>
        <p class="text-xl mb-2">Correct Answers: ${
          TEST_CONFIG.correctAnswers
        } out of ${TEST_CONFIG.requiredCorrectAnswers} required</p>
        <p class="text-xl mb-2">Wrong Answers: ${TEST_CONFIG.wrongAnswers}</p>
        <p class="text-lg mt-4">${
          passed
            ? "Your contrast sensitivity appears to be normal. No action needed."
            : "You may have some contrast sensitivity issues. Consider consulting an eye care professional for a comprehensive assessment."
        }</p>
      </div>
      ${
        eye === "right"
          ? `<button onclick="startLeftEyeContrastTest()" class="bg-brand-dark-blue text-white py-3 px-8 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold">
              Test Left Eye
            </button>`
          : `<button onclick="switchTestType('color')" class="bg-brand-dark-blue text-white py-3 px-8 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold">
              Continue to Color Test
            </button>`
      }
    </div>
  `;

  // Add keyboard listener for Enter key
  const enterHandler = function (e) {
    if (e.key === "Enter") {
      if (eye === "right") {
        startLeftEyeContrastTest();
      } else {
        switchTestType("color");
      }
      document.removeEventListener("keypress", enterHandler);
    }
  };
  document.addEventListener("keypress", enterHandler);
}

// Function to start left eye contrast test
function startLeftEyeContrastTest() {
  // Reset test state
  TEST_CONFIG.currentTest = "contrast";
  TEST_CONFIG.testStarted = true;
  TEST_CONFIG.currentRound = 0;
  TEST_CONFIG.hasRetry = false;
  TEST_CONFIG.currentEye = "left";

  // Start the first round
  startContrastTestRound();
}

// Function to load a script dynamically
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Function to switch between test types
async function switchTestType(testType) {
  try {
    // Load the appropriate script
    await loadScript(`js/${testType}Test.js`);

    // Wait a moment for the script to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Start the test
    switch (testType) {
      case "acuity":
        startAcuityTest();
        break;
      case "contrast":
        startContrastTest();
        break;
      case "color":
        if (typeof window.startColorTest === "function") {
          window.startColorTest();
        } else {
          console.error("startColorTest function not found");
        }
        break;
    }
  } catch (error) {
    console.error("Error loading test script:", error);
  }
}
