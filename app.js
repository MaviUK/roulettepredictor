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
    updatePrediction();
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

// Calculate pockets between two numbers in a given direction
function calculatePockets(from, to, direction) {
    const fromIndex = wheelNumbers.indexOf(from);
    const toIndex = wheelNumbers.indexOf(to);
    
    if (fromIndex === -1 || toIndex === -1) return null;
    
    if (direction === 'CW') {
        if (toIndex > fromIndex) {
            return toIndex - fromIndex;
        } else {
            return wheelNumbers.length - fromIndex + toIndex;
        }
    } else { // CCW
        if (toIndex < fromIndex) {
            return fromIndex - toIndex;
        } else {
            return wheelNumbers.length - toIndex + fromIndex;
        }
    }
}

// Update streak counters
function updateStreaks(direction) {
    if (direction === 'CW') {
        currentCWStreak++;
        currentCCWStreak = 0;
        if (currentCWStreak > longestCWStreak) {
            longestCWStreak = currentCWStreak;
        }
    } else {
        currentCCWStreak++;
        currentCWStreak = 0;
        if (currentCCWStreak > longestCCWStreak) {
            longestCCWStreak = currentCCWStreak;
        }
    }
    
    const currentCombined = currentCWStreak + currentCCWStreak;
    if (currentCombined > longestCombinedStreak) {
        longestCombinedStreak = currentCombined;
    }
    
    currentDirection = direction;
}

// Predict the next number
function predictNext() {
    if (spinHistory.length < 5) {
        return {
            success: false,
            message: "Need at least 5 spins in the current direction to make a prediction"
        };
    }
    
    // Get last 5 spins in the next direction (opposite of current)
    const nextDirection = currentDirection === 'CW' ? 'CCW' : 'CW';
    const last5Spins = spinHistory
        .filter(spin => spin.direction === nextDirection)
        .slice(-5);
    
    if (last5Spins.length < 5) {
        return {
            success: false,
            message: `Need at least 5 spins in ${nextDirection} direction to make a prediction`
        };
    }
    
    // Calculate pockets for each of the last 5 spins
    const pocketData = [];
    for (let i = 1; i < last5Spins.length; i++) {
        const from = last5Spins[i-1].number;
        const to = last5Spins[i].number;
        const pockets = calculatePockets(from, to, nextDirection);
        pocketData.push(pockets);
    }
    
    // Remove highest and lowest, average the remaining 3
    pocketData.sort((a, b) => a - b);
    const middle3 = pocketData.slice(1, -1);
    const averagePockets = Math.round(middle3.reduce((sum, val) => sum + val, 0) / middle3.length);
    
    // Get current number
    const currentNumber = spinHistory[spinHistory.length - 1].number;
    const currentIndex = wheelNumbers.indexOf(currentNumber);
    
    // Calculate predicted number
    let predictedIndex;
    if (nextDirection === 'CW') {
        predictedIndex = (currentIndex + averagePockets) % wheelNumbers.length;
    } else {
        predictedIndex = (currentIndex - averagePockets + wheelNumbers.length) % wheelNumbers.length;
    }
    
    const predictedNumber = wheelNumbers[predictedIndex];
    
    return {
        success: true,
        predictedNumber,
        predictedDirection: nextDirection,
        averagePockets,
        currentNumber,
        calculationSteps: {
            last5Spins,
            pocketData,
            middle3,
            averagePockets
        }
    };
}

// Update the history table
function updateHistoryTable() {
    const tableBody = document.getElementById('historyTable');
    tableBody.innerHTML = '';
    
    const displaySpins = spinHistory.slice().reverse().slice(0, 50);
    
    displaySpins.forEach((spin, i) => {
        const row = document.createElement('tr');
        
        if (spin.direction === 'CW') {
            row.classList.add('table-warning');
        } else {
            row.classList.add('table-info');
        }
        
        row.innerHTML = `
            <td>${spinHistory.length - i}</td>
            <td>${spin.number}</td>
            <td>${spin.direction}</td>
            <td>${spin.from !== null ? spin.from : '-'}</td>
            <td>${spin.number}</td>
            <td>${spin.pockets !== null ? spin.pockets : '-'}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Update streak display
function updateStreakDisplay() {
    document.getElementById('cwStreak').textContent = longestCWStreak;
    document.getElementById('ccwStreak').textContent = longestCCWStreak;
    document.getElementById('currentCWStreak').textContent = currentCWStreak;
    document.getElementById('currentCCWStreak').textContent = currentCCWStreak;
}

// Animate the wheel spin
function animateSpin(number, direction, callback) {
    const wheel = document.getElementById('wheel');
    const ball = document.getElementById('ball');
    
    const numberIndex = wheelNumbers.indexOf(number);
    const rotationAngle = 360 * 5 + (numberIndex * (360 / wheelNumbers.length));
    
    // Set initial position
    wheel.style.transition = 'none';
    wheel.style.transform = 'rotate(0deg)';
    ball.style.transition = 'none';
    ball.style.opacity = '1';
    
    // Force reflow
    void wheel.offsetWidth;
    
    // Animate
    wheel.style.transition = 'transform 5s cubic-bezier(0.17, 0.67, 0.21, 0.99)';
    wheel.style.transform = `rotate(${-rotationAngle}deg)`;
    
    // Animate ball
    setTimeout(() => {
        ball.style.transition = 'all 0.5s ease-out';
        ball.style.transform = `translate(-50%, -50%) rotate(${rotationAngle}deg)`;
    }, 4500);
    
    // Callback when animation completes
    setTimeout(() => {
        if (callback) callback();
    }, 5000);
}

// Add batch spins with automatic alternating directions
function addBatchSpins(numbers) {
    if (!Array.isArray(numbers)) {
        console.error('Input must be an array of numbers');
        return false;
    }

    if (numbers.length === 0) return true;

    // First spin needs direction if history is empty
    if (spinHistory.length === 0) {
        const direction = prompt(`Enter direction for first spin (${numbers[0]}):\nCW for Clockwise\nCCW for Counter-Clockwise`);
        
        if (!direction || !['CW', 'CCW'].includes(direction.toUpperCase())) {
            alert('Invalid direction - must be CW or CCW');
            return false;
        }
        
        addSpin(numbers[0], direction.toUpperCase());
    } else {
        addSpin(numbers[0]);
    }

    // Add remaining spins with automatic alternating directions
    for (let i = 1; i < numbers.length; i++) {
        addSpin(numbers[i]);
    }

    return true;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initWheel();
    
    // Spin button
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
    const predictBtn = document.getElementById('predictBtn');
    if (predictBtn) predictBtn.remove();
    
    // Add spin button
    document.getElementById('addSpinBtn').addEventListener('click', () => {
        const number = parseInt(document.getElementById('numberInput').value);
        
        if (isNaN(number) || number < 0 || number > 36) {
            alert('Please enter a valid number between 0 and 36');
            return;
        }
        
        if (spinHistory.length === 0) {
            const direction = prompt(`Enter direction for first spin (${number}):\nCW for Clockwise\nCCW for Counter-Clockwise`);
            
            if (!direction || !['CW', 'CCW'].includes(direction.toUpperCase())) {
                alert('Invalid direction - must be CW or CCW');
                return;
            }
            
            addSpin(number, direction.toUpperCase());
        } else {
            addSpin(number);
        }
    });
    
    // Add random spin button
    document.getElementById('addRandomBtn').addEventListener('click', () => {
        const randomNumber = Math.floor(Math.random() * 37);
        document.getElementById('numberInput').value = randomNumber;
        
        if (spinHistory.length === 0) {
            const randomDirection = Math.random() > 0.5 ? 'CW' : 'CCW';
            document.getElementById('directionInput').value = randomDirection;
            addSpin(randomNumber, randomDirection);
        } else {
            addSpin(randomNumber);
        }
    });
    
    // Add batch import button
    const batchImportBtn = document.createElement('button');
    batchImportBtn.textContent = 'Import Batch Spins';
    batchImportBtn.className = 'btn btn-secondary mt-3';
    batchImportBtn.id = 'batchImportBtn';
    document.querySelector('.card-body').appendChild(batchImportBtn);

    document.getElementById('batchImportBtn').addEventListener('click', () => {
        const numberInput = prompt('Paste all numbers (0-36), separated by commas or spaces:\nExample: 17, 32, 5, 0, 23, 12');
        
        if (!numberInput) return;
        
        // Parse input into array of numbers
        const numbers = numberInput.split(/[\s,]+/).map(num => {
            const parsed = parseInt(num.trim());
            return isNaN(parsed) ? null : parsed;
        }).filter(num => num !== null && num >= 0 && num <= 36);
        
        if (numbers.length === 0) {
            alert('No valid numbers entered');
            return;
        }

        addBatchSpins(numbers);
    });
    
    // Initialize with empty prediction display
    updatePrediction();
});
