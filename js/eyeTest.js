// Test configuration
const TEST_CONFIG = {
  rounds: 10,
  // Base sizes for 1920x1024 screen at 1m distance
  baseSizes: {
    "20/200": 54, // 14.6mm
    "20/100": 27, // 7.3mm
    "20/70": 18.9, // 5.1mm
    "20/50": 13.5, // 3.7mm
    "20/40": 10.74, // 2.9mm
    "20/30": 8, // 2.2mm
    "20/25": 6.72, // 1.8mm
    "20/20": 5.4, // 1.4mm
    "20/15": 4, // 1.1mm
    "20/10": 2.7, // 0.7mm
  },
  sizes: [], // Will be calculated based on screen size
  directions: [
    { rotation: "0deg", answer: "90deg", label: "↑" }, // Up
    { rotation: "90deg", answer: "180deg", label: "→" }, // Right
    { rotation: "180deg", answer: "270deg", label: "↓" }, // Down
    { rotation: "270deg", answer: "0deg", label: "←" }, // Left
  ],
  currentRound: 0,
  testStarted: false,
  isAnswering: false,
  hasRetry: false,
  screenSize: null, // Will store screen size in inches
  viewingDistance: null, // Will store calculated viewing distance
  currentTest: "acuity", // Current test type: "acuity" or "contrast"
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

// Function to calculate sizes based on screen dimensions and viewing distance
function calculateSizes() {
  // Get actual screen dimensions in pixels
  const screenWidth = window.screen.width * window.devicePixelRatio;
  const screenHeight = window.screen.height * window.devicePixelRatio;

  // Calculate PPI based on screen size and resolution
  const diagonalPixels = Math.sqrt(
    Math.pow(screenWidth, 2) + Math.pow(screenHeight, 2)
  );
  const ppi = diagonalPixels / TEST_CONFIG.screenSize;

  // Calculate scale based on PPI (using 96 PPI as reference)
  const ppiScale = ppi / 96;

  // Adjust sizes based on viewing distance
  // Base sizes are calibrated for 1m, so multiply by the actual viewing distance
  const distanceMultiplier = TEST_CONFIG.viewingDistance;

  // Calculate new sizes
  TEST_CONFIG.sizes = Object.values(TEST_CONFIG.baseSizes).map(
    (size) => Math.round(size * ppiScale * distanceMultiplier * 100) / 100 // Round to 2 decimal places
  );

  // Debug info
  console.log("Screen Information:", {
    logicalResolution: `${window.screen.width}x${window.screen.height}`,
    physicalResolution: `${screenWidth}x${screenHeight}`,
    devicePixelRatio: window.devicePixelRatio,
    screenSize: `${TEST_CONFIG.screenSize} inches`,
    calculatedPPI: Math.round(ppi),
    ppiScale: ppiScale.toFixed(3),
    viewingDistance: `${TEST_CONFIG.viewingDistance} meters`,
    distanceMultiplier: distanceMultiplier,
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
            <!-- Right Button -->
            <button onclick="checkAnswer('90deg')" class="absolute top-[50%] right-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">→</button>
            <!-- Bottom Button -->
            <button onclick="checkAnswer('180deg')" class="absolute bottom-8 right-[38%] -translate-x-1/2 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↓</button>
            <!-- Left Button -->
            <button onclick="checkAnswer('270deg')" class="absolute top-[50%] left-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">←</button>
          </div>
        </div>
      </div>
      <div class="text-lg">
        <p>Cover your left eye and click the button showing the direction the E is pointing.</p>
        <p class="mt-2">Round ${TEST_CONFIG.currentRound + 1} of ${
    TEST_CONFIG.rounds
  }</p>
        <p class="mt-2 text-sm text-gray-600">You can use arrow keys (↑, →, ↓, ←) or click the buttons to answer</p>
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
        <h2 class="text-4xl font-bold text-brand-dark-blue">Right Eye Test Complete!</h2>
        <div class="bg-brand-pale-green/20 p-8 rounded-lg">
          <p class="text-2xl mb-4">Right Eye Visual Acuity: ${snellenResult}</p>
          ${
            perfectScore
              ? '<p class="text-lg text-green-600">Perfect score! You completed all levels.</p>'
              : ""
          }
        </div>
        <div class="mt-8">
          <h3 class="text-2xl font-semibold text-brand-dark-blue mb-4">Now let's test your left eye</h3>
          <p class="text-lg mb-6">Please cover your right eye with your hand</p>
          <button
            id="startLeftEyeButton"
            onclick="startLeftEyeTest()"
            class="bg-brand-dark-blue text-white py-3 px-8 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold"
          >
            Start Left Eye Test
          </button>
          <p class="text-sm text-gray-600 mt-2">Press Enter to start the test</p>
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
        <h2 class="text-4xl font-bold text-brand-dark-blue">Acuity Test Completed!</h2>
        <div class="bg-brand-pale-green/20 p-8 rounded-lg">
          <p class="text-2xl mb-4">Your Visual Acuity Results:</p>
          <div class="grid grid-cols-2 gap-4 mt-4">
            <div class="p-4 bg-white rounded-lg">
              <p class="text-xl font-semibold text-brand-dark-blue">Right Eye</p>
              <p class="text-2xl mt-2">${TEST_CONFIG.rightEyeResult}</p>
            </div>
            <div class="p-4 bg-white rounded-lg">
              <p class="text-xl font-semibold text-brand-dark-blue">Left Eye</p>
              <p class="text-2xl mt-2">${TEST_CONFIG.leftEyeResult}</p>
            </div>
          </div>
        </div>
        <div class="mt-8">
          <h3 class="text-2xl font-semibold text-brand-dark-blue mb-4">Now let's test your contrast sensitivity</h3>
          <p class="text-lg mb-6">This test will measure how well you can distinguish between different shades of gray</p>
          <button
            onclick="startContrastTest()"
            class="bg-brand-dark-blue text-white py-3 px-8 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold"
          >
            Start Contrast Test
          </button>
          <p class="text-sm text-gray-600 mt-2">Press Enter to start the test</p>
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
            <!-- Right Button -->
            <button onclick="checkAnswer('90deg')" class="absolute top-[50%] right-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">→</button>
            <!-- Bottom Button -->
            <button onclick="checkAnswer('180deg')" class="absolute bottom-8 right-[38%] -translate-x-1/2 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↓</button>
            <!-- Left Button -->
            <button onclick="checkAnswer('270deg')" class="absolute top-[50%] left-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">←</button>
          </div>
        </div>
      </div>
      <div class="text-lg">
        <p>Cover your right eye and click the button showing the direction the E is pointing.</p>
        <p class="mt-2">Round ${TEST_CONFIG.currentRound + 1} of ${
    TEST_CONFIG.rounds
  }</p>
        <p class="mt-2 text-sm text-gray-600">You can use arrow keys (↑, →, ↓, ←) or click the buttons to answer</p>
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
      <div class="bg-brand-pale-green/20 p-8 rounded-lg max-w-md mx-auto">
        <p class="text-lg mb-4">Please enter your screen size:</p>
        <div class="flex items-center justify-center space-x-2">
          <input
            type="number"
            id="screenSize"
            class="w-24 px-4 py-2 border-2 border-brand-dark-blue rounded-lg focus:outline-none focus:border-brand-cyan"
            placeholder="Size"
            min="1"
            max="100"
            step="0.1"
          />
          <span class="text-lg">inches</span>
        </div>
        <p class="text-sm text-gray-600 mt-2">(Measure diagonally from corner to corner)</p>
        <button
          onclick="startCalibration()"
          class="mt-6 bg-brand-dark-blue text-white py-3 px-8 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold"
        >
          Start Test
        </button>
      </div>
    </div>
  `;

  // Add enter key listener
  document.getElementById("screenSize").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      startCalibration();
    }
  });
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

// Function to show distance instructions
function showPositioningScreen() {
  document.querySelector(".max-w-3xl").innerHTML = `
    <div class="text-center space-y-8">
      <h2 class="text-4xl font-bold text-brand-dark-blue">Position Yourself</h2>
      <div class="bg-brand-pale-green/20 p-8 rounded-lg max-w-md mx-auto">
        <p class="text-2xl mb-4">Please stand ${TEST_CONFIG.viewingDistance} meters from the screen</p>
        <p class="text-lg mb-6">This distance ensures accurate test results</p>
        <button
          id="readyButton"
          onclick="showTestInstructions()"
          class="bg-brand-dark-blue text-white py-3 px-8 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold"
        >
          I'm Ready
        </button>
        <p class="text-sm text-gray-600 mt-2">Press Enter to continue</p>
      </div>
    </div>
  `;

  // Add keyboard listener for Enter key
  document.addEventListener("keypress", function handleEnter(e) {
    if (e.key === "Enter") {
      document.getElementById("readyButton").click();
      document.removeEventListener("keypress", handleEnter);
    }
  });
}

// Function to show test instructions and demo
function showTestInstructions() {
  document.querySelector(".max-w-3xl").innerHTML = `
    <div class="text-center space-y-8">
      <h2 class="text-4xl font-bold text-brand-dark-blue">Visual Acuity Test</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Instructions Column -->
        <div class="bg-brand-pale-green/20 p-6 rounded-lg">
          <h3 class="text-xl font-semibold text-brand-dark-blue mb-4">Instructions:</h3>
          <ul class="text-left space-y-3">
            <li>• Cover your left eye with your hand.</li>
            <li>• You'll be shown letter E in different sizes</li>
            <li>• Press the button in which direction the E is pointing</li>
            <li>• If you're not sure about a letter, make your best guess</li>
            <li>• You'll get one retry if you answer incorrectly</li>
          </ul>
        </div>

        <!-- Test Demonstration Animation -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-xl font-semibold text-brand-dark-blue mb-4">Watch How to Do the Test:</h3>
          <div class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <!-- Animation Container -->
            <div id="testDemo" class="absolute inset-0 flex items-center justify-center">
              <!-- E Letter Animation -->
              <div id="letterDemo" class="text-6xl font-bold text-brand-dark-blue transform transition-all duration-1000">E</div>
              <!-- Direction Buttons -->
              <div id="directionButtons" class="absolute inset-0 pointer-events-none">
                <!-- Top Button -->
                <button id="topButton" class="absolute top-8 left-[38%] -translate-x-1/2 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all transform scale-0 transition-transform duration-300 text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↑</button>
                <!-- Right Button -->
                <button id="rightButton" class="absolute top-[37%] right-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all transform scale-0 transition-transform duration-300 text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">→</button>
                <!-- Bottom Button -->
                <button id="bottomButton" class="absolute bottom-8 left-[38%] -translate-x-1/2 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all transform scale-0 transition-transform duration-300 text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↓</button>
                <!-- Left Button -->
                <button id="leftButton" class="absolute top-[37%] left-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all transform scale-0 transition-transform duration-300 text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">←</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p class="text-lg mt-6">When you're ready, click the button below to begin the test.</p>
      <button
        id="startTestButton"
        onclick="startAcuityTest()"
        class="bg-brand-dark-blue text-white py-3 px-8 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold"
      >
        Start Test
      </button>
      <p class="text-sm text-gray-600 mt-2">Press Enter to start the test</p>
    </div>
  `;

  // Start the demo animation
  playDemo();
  demoInterval = setInterval(playDemo, 10000);

  // Add keyboard listener for Enter key
  document.addEventListener("keypress", function handleEnter(e) {
    if (e.key === "Enter") {
      document.getElementById("startTestButton").click();
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
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Instructions Column -->
        <div class="bg-brand-pale-green/20 p-6 rounded-lg">
          <h3 class="text-xl font-semibold text-brand-dark-blue mb-4">Instructions:</h3>
          <ul class="text-left space-y-3">
            <li>• You'll be shown a letter C in different shades of gray</li>
            <li>• The C will be pointing in one of four directions</li>
            <li>• Press the button in which direction the C is pointing</li>
            <li>• If you're not sure, make your best guess</li>
            <li>• You'll get one retry if you answer incorrectly</li>
          </ul>
        </div>

        <!-- Test Demonstration Animation -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-xl font-semibold text-brand-dark-blue mb-4">Watch How to Do the Test:</h3>
          <div class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <!-- Animation Container -->
            <div id="testDemo" class="absolute inset-0 flex items-center justify-center">
              <!-- C Letter Animation -->
              <img id="letterDemo" src="assets/c.png" class="w-24 h-24 transform transition-all duration-1000" alt="C">
              <!-- Direction Buttons -->
              <div id="directionButtons" class="absolute inset-0 pointer-events-none">
                <!-- Top Button -->
                <button id="topButton" class="absolute top-8 left-[38%] -translate-x-1/2 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all transform scale-0 transition-transform duration-300 text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↑</button>
                <!-- Right Button -->
                <button id="rightButton" class="absolute top-[37%] right-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all transform scale-0 transition-transform duration-300 text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">→</button>
                <!-- Bottom Button -->
                <button id="bottomButton" class="absolute bottom-8 left-[38%] -translate-x-1/2 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all transform scale-0 transition-transform duration-300 text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↓</button>
                <!-- Left Button -->
                <button id="leftButton" class="absolute top-[37%] left-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all transform scale-0 transition-transform duration-300 text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">←</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p class="text-lg mt-6">When you're ready, click the button below to begin the test.</p>
      <button
        id="startTestButton"
        onclick="startContrastTestRound()"
        class="bg-brand-dark-blue text-white py-3 px-8 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold"
      >
        Start Test
      </button>
      <p class="text-sm text-gray-600 mt-2">Press Enter to start the test</p>
    </div>
  `;

  // Start the demo animation
  playContrastDemo();
  demoInterval = setInterval(playContrastDemo, 10000);

  // Add keyboard listener for Enter key
  const enterHandler = function (e) {
    if (e.key === "Enter") {
      // Stop the demo animation
      if (demoInterval) {
        clearInterval(demoInterval);
        demoInterval = null;
      }
      // Remove the event listener
      document.removeEventListener("keypress", enterHandler);
      // Start the test
      startContrastTestRound();
    }
  };
  document.addEventListener("keypress", enterHandler);
}

// Function to play contrast test demonstration
function playContrastDemo() {
  const letterDemo = document.getElementById("letterDemo");
  const topButton = document.getElementById("topButton");
  const rightButton = document.getElementById("rightButton");
  const bottomButton = document.getElementById("bottomButton");
  const leftButton = document.getElementById("leftButton");

  // Reset animations
  letterDemo.style.transform = "rotate(0deg)";
  letterDemo.style.opacity = "1";
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

  // Rotate C and press corresponding button
  const directions = [
    { rotation: "0deg", button: topButton, correct: false },
    { rotation: "90deg", button: rightButton, correct: true },
    { rotation: "180deg", button: bottomButton, correct: true },
    { rotation: "270deg", button: leftButton, correct: true },
  ];

  // Start with full opacity
  letterDemo.style.opacity = "1";

  directions.forEach((direction, index) => {
    // Rotate C and press button
    setTimeout(() => {
      letterDemo.style.transform = `rotate(${direction.rotation})`;
      // Change opacity for each direction
      letterDemo.style.opacity =
        TEST_CONFIG.contrastLevels[
          index % TEST_CONFIG.contrastLevels.length
        ].level;
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
    letterDemo.style.opacity = "1";
    [topButton, rightButton, bottomButton, leftButton].forEach((btn) => {
      btn.style.transform = "scale(0)";
      btn.classList.remove("bg-brand-pale-green", "bg-red-300");
    });
  }, 10000);
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
            <!-- Right Button -->
            <button onclick="checkContrastAnswer('90deg')" class="absolute top-[50%] right-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">→</button>
            <!-- Bottom Button -->
            <button onclick="checkContrastAnswer('180deg')" class="absolute bottom-8 right-[38%] -translate-x-1/2 px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">↓</button>
            <!-- Left Button -->
            <button onclick="checkContrastAnswer('270deg')" class="absolute top-[50%] left-8 -translate-y-1/2 px-3 py-6 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">←</button>
          </div>
        </div>
      </div>
      <div class="text-lg">
        <p>Click the button showing the direction the C is pointing.</p>
        <p class="mt-2">Round ${TEST_CONFIG.currentRound + 1} of ${
    TEST_CONFIG.rounds
  }</p>
        <p class="mt-2 text-sm text-gray-600">You can use arrow keys (↑, →, ↓, ←) or click the buttons to answer</p>
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
        // Start next round
        startContrastTestRound();
      } else {
        // Test completed with perfect score
        const isLeftEye = TEST_CONFIG.currentEye === "left";
        showContrastResults(true, isLeftEye ? "left" : "right");
      }
    } else if (!TEST_CONFIG.hasRetry) {
      // Wrong answer but haven't used retry yet
      TEST_CONFIG.hasRetry = true;

      // Try same contrast level again
      startContrastTestRound();
    } else {
      // Wrong answer and already used retry - end test
      const isLeftEye = TEST_CONFIG.currentEye === "left";
      showContrastResults(false, isLeftEye ? "left" : "right");
    }

    TEST_CONFIG.isAnswering = false;
  }, 1000);
}

// Function to show contrast test results
function showContrastResults(perfectScore, eye = "right") {
  const lastSuccessfulRound = TEST_CONFIG.currentRound - 1;
  const contrastResult = TEST_CONFIG.contrastLevels[lastSuccessfulRound].label;

  // Store the result for the current eye
  TEST_CONFIG[`${eye}EyeContrastResult`] = contrastResult;

  if (eye === "right") {
    // Show left eye test prompt
    document.querySelector(".max-w-3xl").innerHTML = `
      <div class="text-center space-y-8">
        <h2 class="text-4xl font-bold text-brand-dark-blue">Right Eye Contrast Test Complete!</h2>
        <div class="bg-brand-pale-green/20 p-8 rounded-lg">
          <p class="text-2xl mb-4">Right Eye Contrast Sensitivity: ${contrastResult}</p>
          ${
            perfectScore
              ? '<p class="text-lg text-green-600">Perfect score! You completed all levels.</p>'
              : ""
          }
        </div>
        <div class="mt-8">
          <h3 class="text-2xl font-semibold text-brand-dark-blue mb-4">Now let's test your left eye</h3>
          <p class="text-lg mb-6">Please cover your right eye with your hand</p>
          <button
            id="startLeftEyeContrastButton"
            onclick="startLeftEyeContrastTest()"
            class="bg-brand-dark-blue text-white py-3 px-8 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold"
          >
            Start Left Eye Test
          </button>
          <p class="text-sm text-gray-600 mt-2">Press Enter to start the test</p>
        </div>
      </div>
    `;

    // Add keyboard listener for Enter key
    const enterHandler = function (e) {
      if (e.key === "Enter") {
        document.getElementById("startLeftEyeContrastButton").click();
        document.removeEventListener("keypress", enterHandler);
      }
    };
    document.addEventListener("keypress", enterHandler);
  } else {
    // Show final results for both eyes and return home button
    document.querySelector(".max-w-3xl").innerHTML = `
      <div class="text-center space-y-8">
        <h2 class="text-4xl font-bold text-brand-dark-blue">All Tests Completed!</h2>
        <div class="bg-brand-pale-green/20 p-8 rounded-lg">
          <p class="text-2xl mb-4">Your Test Results:</p>
          <div class="grid grid-cols-2 gap-4 mt-4">
            <div class="p-4 bg-white rounded-lg">
              <p class="text-xl font-semibold text-brand-dark-blue">Right Eye</p>
              <p class="text-lg mt-2">Visual Acuity: ${TEST_CONFIG.rightEyeResult}</p>
              <p class="text-lg mt-2">Contrast Sensitivity: ${TEST_CONFIG.rightEyeContrastResult}</p>
            </div>
            <div class="p-4 bg-white rounded-lg">
              <p class="text-xl font-semibold text-brand-dark-blue">Left Eye</p>
              <p class="text-lg mt-2">Visual Acuity: ${TEST_CONFIG.leftEyeResult}</p>
              <p class="text-lg mt-2">Contrast Sensitivity: ${TEST_CONFIG.leftEyeContrastResult}</p>
            </div>
          </div>
        </div>
        <button
          onclick="exitFullscreen()"
          class="bg-brand-dark-blue text-white py-3 px-8 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold"
        >
          Return to Home
        </button>
      </div>
    `;
  }
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
