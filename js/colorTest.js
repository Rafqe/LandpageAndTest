// Color Vision Test Configuration
const colorTestConfig = {
  symbols: ["BOX", "I", "O", "SMILEY", "X"],
  imageCounts: {}, // Will be populated dynamically
  maxWrongAnswers: 2,
  requiredCorrectAnswers: 6,
  totalPlates: 8,
};

// Function to get available images for a symbol
async function getAvailableImages(symbol) {
  try {
    const response = await fetch(`assets/colorTests/${symbol}/`);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const links = Array.from(doc.getElementsByTagName("a"));
    const imageFiles = links
      .map((link) => link.href)
      .filter((href) => href.endsWith(".png"))
      .map((href) => {
        const match = href.match(/(\d+)\.png$/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((num) => num !== null);
    return imageFiles.sort((a, b) => a - b);
  } catch (error) {
    console.error(`Error getting images for ${symbol}:`, error);
    return [];
  }
}

// Function to initialize color test configuration
async function initializeColorTest() {
  for (const symbol of colorTestConfig.symbols) {
    const images = await getAvailableImages(symbol);
    colorTestConfig.imageCounts[symbol] = images;
  }
  console.log("Color test configuration initialized:", colorTestConfig);
}

// Function to get a random image number for a symbol
function getRandomImageNumber(symbol) {
  const availableImages = colorTestConfig.imageCounts[symbol];
  if (!availableImages || availableImages.length === 0) {
    console.error(`No images available for symbol: ${symbol}`);
    return 1; // Fallback to first image
  }
  const randomIndex = Math.floor(Math.random() * availableImages.length);
  return availableImages[randomIndex];
}

// Function to get a random symbol
function getRandomSymbol() {
  const symbols = colorTestConfig.symbols.filter(
    (symbol) =>
      colorTestConfig.imageCounts[symbol] &&
      colorTestConfig.imageCounts[symbol].length > 0
  );
  if (symbols.length === 0) {
    console.error("No symbols with available images found");
    return colorTestConfig.symbols[0]; // Fallback to first symbol
  }
  return symbols[Math.floor(Math.random() * symbols.length)];
}

// Function to start color vision test
async function startColorTest() {
  // Initialize color test configuration if not already done
  if (Object.keys(colorTestConfig.imageCounts).length === 0) {
    await initializeColorTest();
  }

  TEST_CONFIG.currentTest = "color";
  TEST_CONFIG.testStarted = true;
  TEST_CONFIG.currentRound = 0;
  TEST_CONFIG.hasRetry = false;
  TEST_CONFIG.currentEye = "right";
  TEST_CONFIG.correctAnswers = 0;
  TEST_CONFIG.wrongAnswers = 0;

  document.querySelector(".max-w-3xl").innerHTML = `
    <div class="text-center space-y-8">
      <h2 class="text-4xl font-bold text-brand-dark-blue">Color Vision Test</h2>
      
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
              <p class="text-gray-600">You'll be shown a series of images and asked to identify what you see</p>
            </div>
          </div>

          <!-- Instructions List -->
          <div class="space-y-4 text-left">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-brand-pale-green/20 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-brand-dark-blue font-semibold">1</span>
              </div>
              <p class="text-gray-700">Look at the image in the center of the screen</p>
            </div>
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-brand-pale-green/20 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-brand-dark-blue font-semibold">2</span>
              </div>
              <p class="text-gray-700">Click the button that matches what you see</p>
            </div>
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-brand-pale-green/20 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-brand-dark-blue font-semibold">3</span>
              </div>
              <p class="text-gray-700">If you can't see anything clearly, click the "Nothing" button</p>
            </div>
          </div>

          
            
          </div>
        </div>
      </div>

      <button
        id="startColorTestButton"
        onclick="startColorTestRound()"
        class="bg-brand-dark-blue text-white py-4 px-12 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold shadow-lg"
      >
        Start Test
      </button>
    </div>
  `;

  // Add keyboard listener for Enter key
  const enterHandler = function (e) {
    if (e.key === "Enter") {
      document.getElementById("startColorTestButton").click();
      document.removeEventListener("keypress", enterHandler);
    }
  };
  document.addEventListener("keypress", enterHandler);
}

// Function to start a color test round
function startColorTestRound() {
  // Get random symbol and image
  const symbol = getRandomSymbol();
  const imageNumber = getRandomImageNumber(symbol);
  const imagePath = `assets/colorTests/${symbol}/${imageNumber}.png`;

  document.querySelector(".max-w-3xl").innerHTML = `
    <div class="text-center space-y-8">
      <h2 class="text-4xl font-bold text-brand-dark-blue">Color Vision Test - Plate ${
        TEST_CONFIG.currentRound + 1
      }/${colorTestConfig.totalPlates}</h2>
      <div class="relative bg-gray-100 rounded-lg overflow-hidden max-w-2xl mx-auto">
        <!-- Test Image -->
        <div class="p-8">
          <img id="testImage" src="${imagePath}" alt="Color test plate" class="w-96 h-96 mx-auto transform transition-all duration-500">
        </div>
        
        <!-- Answer Buttons -->
        <div class="grid grid-cols-3 gap-4 p-6 bg-white border-t border-gray-200">
          <!-- Box Button -->
          <button onclick="checkColorAnswer('BOX')" class="px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">
            <img src="assets/colorTests/boxBtn.png" alt="Box" class="w-8 h-8 mx-auto">
          </button>
          <!-- I Button -->
          <button onclick="checkColorAnswer('I')" class="px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">
            <img src="assets/colorTests/iBtn.png" alt="I" class="w-8 h-8 mx-auto">
          </button>
          <!-- O Button -->
          <button onclick="checkColorAnswer('O')" class="px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">
            <img src="assets/colorTests/OBtn.png" alt="O" class="w-8 h-8 mx-auto">
          </button>
          <!-- Smiley Button -->
          <button onclick="checkColorAnswer('SMILEY')" class="px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">
            <img src="assets/colorTests/SmileyBtn.png" alt="Smiley" class="w-8 h-8 mx-auto">
          </button>
          <!-- X Button -->
          <button onclick="checkColorAnswer('X')" class="px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-brand-dark-blue border-2 border-gray-200">
            <img src="assets/colorTests/xBtn.png" alt="X" class="w-8 h-8 mx-auto">
          </button>
          <!-- Nothing Button -->
          <button onclick="checkColorAnswer('nothing')" class="px-6 py-3 bg-white rounded-lg shadow-md hover:bg-brand-pale-green transition-all text-2xl font-semibold text-black border-2 border-gray-200">
            <div class="flex flex-col items-center">
              <span class="text-sm mt-1">Nothing</span>
            </div>
          </button>
        </div>
      </div>
      <div class="text-lg">
        <p>Click the button that matches what you see in the image.</p>
        <p class="mt-2">Plate ${TEST_CONFIG.currentRound + 1} of ${
    colorTestConfig.totalPlates
  }</p>
      </div>
    </div>
  `;

  // Store the correct answer for this round
  document.getElementById("testImage").dataset.correctAnswer = symbol;

  // Remove any existing keyboard listeners
  document.removeEventListener("keypress", handleColorTestKeyPress);
}

// Function to handle keyboard input during color test
function handleColorTestKeyPress(e) {
  if (TEST_CONFIG.isAnswering) return;

  switch (e.key) {
    case "1":
      checkColorAnswer("BOX");
      break;
    case "2":
      checkColorAnswer("I");
      break;
    case "3":
      checkColorAnswer("O");
      break;
    case "4":
      checkColorAnswer("SMILEY");
      break;
    case "5":
      checkColorAnswer("X");
      break;
    case "6":
      checkColorAnswer("nothing");
      break;
  }
}

// Function to check color test answer
function checkColorAnswer(selectedAnswer) {
  if (TEST_CONFIG.isAnswering) return;

  TEST_CONFIG.isAnswering = true;
  const testImage = document.getElementById("testImage");
  const correctAnswer = testImage.dataset.correctAnswer;
  const buttons = document.querySelectorAll("button");

  // Disable all buttons temporarily
  buttons.forEach((btn) => (btn.disabled = true));

  // Handle "nothing" response
  if (selectedAnswer === "nothing") {
    const nothingButton = document.querySelector(
      "button[onclick=\"checkColorAnswer('nothing')\"]"
    );
    nothingButton.classList.add("bg-red-300");

    setTimeout(() => {
      TEST_CONFIG.wrongAnswers++;
      TEST_CONFIG.currentRound++;

      if (
        TEST_CONFIG.wrongAnswers >= colorTestConfig.maxWrongAnswers ||
        TEST_CONFIG.currentRound >= colorTestConfig.totalPlates
      ) {
        showColorTestResults();
      } else {
        startColorTestRound();
      }

      TEST_CONFIG.isAnswering = false;
    }, 1000);
    return;
  }

  // Highlight the selected button
  const selectedButton = document.querySelector(
    `button[onclick="checkColorAnswer('${selectedAnswer}')"]`
  );
  if (selectedButton) {
    selectedButton.classList.add(
      selectedAnswer === correctAnswer ? "bg-brand-pale-green" : "bg-red-300"
    );
  }

  // Wait 1 second before moving to next round
  setTimeout(() => {
    if (selectedAnswer === correctAnswer) {
      TEST_CONFIG.correctAnswers++;
    } else {
      TEST_CONFIG.wrongAnswers++;
    }

    TEST_CONFIG.currentRound++;

    if (
      TEST_CONFIG.correctAnswers >= colorTestConfig.requiredCorrectAnswers ||
      TEST_CONFIG.wrongAnswers >= colorTestConfig.maxWrongAnswers ||
      TEST_CONFIG.currentRound >= colorTestConfig.totalPlates
    ) {
      showColorTestResults();
    } else {
      startColorTestRound();
    }

    TEST_CONFIG.isAnswering = false;
  }, 1000);
}

// Function to show color test results
function showColorTestResults() {
  console.log("Showing color test results..."); // Debug log
  const passed =
    TEST_CONFIG.correctAnswers >= colorTestConfig.requiredCorrectAnswers;

  // Remove keyboard listener when showing results
  document.removeEventListener("keypress", handleColorTestKeyPress);

  document.querySelector(".max-w-3xl").innerHTML = `
        <div class="text-center space-y-8">
            <h2 class="text-4xl font-bold text-brand-dark-blue">Color Vision Test Results</h2>
            <div class="bg-brand-pale-green/20 p-8 rounded-lg">
                <p class="text-2xl mb-4">Test Status: ${
                  passed ? "Passed" : "Failed"
                }</p>
                <p class="text-xl mb-2">Correct Answers: ${
                  TEST_CONFIG.correctAnswers
                } out of ${colorTestConfig.requiredCorrectAnswers} required</p>
                <p class="text-xl mb-2">Wrong Answers: ${
                  TEST_CONFIG.wrongAnswers
                }</p>
                <p class="text-lg mt-4">${
                  passed
                    ? "Your color vision appears to be normal. No action needed."
                    : "You may have some color vision deficiency. Consider consulting an eye care professional for a comprehensive color vision assessment."
                }</p>
            </div>
            <button onclick="exitFullscreen()" class="bg-brand-dark-blue text-white py-3 px-8 rounded-lg hover:bg-brand-cyan transition-all transform hover:-translate-y-1 text-xl font-semibold">
                Return to Home
            </button>
        </div>
    `;
}

// Make sure the functions are available globally
window.startColorTest = startColorTest;
window.startColorTestRound = startColorTestRound;
window.checkColorAnswer = checkColorAnswer;
window.showColorTestResults = showColorTestResults;
window.handleColorTestKeyPress = handleColorTestKeyPress;
