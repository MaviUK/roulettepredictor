// European roulette wheel numbers in order (clockwise)
const wheelNumbers = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Initialize variables
let spinHistory = [];
let currentDirection = null;
let currentCWStreak = 0;
let currentCCWStreak = 0;
let longestCWStreak = 0;
let longestCCWStreak = 0;
let longestCombinedStreak = 0;

// Initialize the wheel visualization
function initWheel() {
    const wheel = document.getElementById('wheel');
    const pocketAngle = 360 / wheelNumbers.length;
    
    wheelNumbers.forEach((num, index) => {
        const pocket = document.createElement('div');
        pocket.className = 'pocket';
        pocket.textContent = num;
        pocket.style.transform = `rotate(${index * pocketAngle}deg) translate(0, -150px) rotate(${-index * pocketAngle}deg)`;
        
        // Color pockets
        if (num === 0) {
            pocket.style.color = 'white';
            pocket.style.backgroundColor = 'green';
        } else if (num % 2 === 0) {
            pocket.style.backgroundColor = 'black';
        } else {
            pocket.style.backgroundColor = 'red';
        }
        
        wheel.appendChild(pocket);
    });
}

// Add a spin to history and update prediction
function addSpin(number, direction = null) {
    // Validate number
    if (number < 0 || number > 36) {
        console.error('Invalid number');
        return;
    }

    // Determine direction if not provided
    if (direction === null) {
        if (spinHistory.length === 0) {
            console.error('First spin must have direction');
            return;
        }
        const lastDirection = spinHistory[spinHistory.length - 1].direction;
        direction = lastDirection === 'CW' ? 'CCW' : 'CW';
    } else if (!['CW', 'CCW'].includes(direction)) {
        console.error('Invalid direction');
        return;
    }
    
    // Calculate pockets from previous spin if available
    let pockets = null;
    let fromNumber = null;
    
    if (spinHistory.length > 0) {
        const lastSpin = spinHistory[spinHistory.length - 1];
        fromNumber = lastSpin.number;
        pockets = calculatePockets(fromNumber, number, direction);
    }
    
    // Update streaks
    updateStreaks(direction);
    
    // Add to history
    const spin = {
        number,
        direction,
        from: fromNumber,
        pockets,
        timestamp: new Date()
    };
    
    spinHistory.push(spin);
    updateHistoryTable();
    updateStreakDisplay();
    updatePrediction(); // Automatically update prediction after each spin
}

// Update the prediction display automatically
function updatePrediction() {
    const prediction = predictNext();
    const resultDiv = document.getElementById('predictionResult');
    
    if (prediction.success) {
        resultDiv.innerHTML = `
            <p><strong>Next Predicted Number:</strong> ${prediction.predictedNumber}</p>
            <p><strong>Expected Direction:</strong> ${prediction.predictedDirection}</p>
            <p><strong>From Current Number:</strong> ${prediction.currentNumber}</p>
            <p><strong>Pockets to move:</strong> ${prediction.averagePockets} ${prediction.predictedDirection}</p>
        `;
    } else {
        resultDiv.innerHTML = `
            <p><strong>Prediction Status:</strong> ${prediction.message}</p>
            <p>Need at least 5 spins in each direction for predictions</p>
        `;
    }
}

// [Keep all other existing functions: calculatePockets, updateStreaks, predictNext, 
// updateHistoryTable, updateStreakDisplay, animateSpin exactly the same]

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initWheel();
    
    // Spin button - automatically shows prediction after spin
    document.getElementById('spinBtn').addEventListener('click', () => {
        const randomNumber = Math.floor(Math.random() * 37);
        let randomDirection;
        
        if (spinHistory.length === 0) {
            randomDirection = Math.random() > 0.5 ? 'CW' : 'CCW';
        } else {
            const lastDirection = spinHistory[spinHistory.length - 1].direction;
            randomDirection = lastDirection === 'CW' ? 'CCW' : 'CW';
        }
        
        animateSpin(randomNumber, randomDirection, () => {
            addSpin(randomNumber, randomDirection);
        });
    });
    
    // Remove the predict button since it's automatic now
    document.getElementById('predictBtn').remove();
    
    // [Keep all other existing event listeners the same, 
    // just remove any references to predictBtn]
    
    // Initialize with empty prediction display
    updatePrediction();
});
